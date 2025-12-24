import { GoogleGenAI, Type } from '@google/genai';
import {
  BlogTone,
  OutlineData,
  SocialPost,
  ImageStyle,
  UploadedFile,
  SeoDiagnosis,
} from '../types';
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';
import { PROMPTS, PERSONA_INSTRUCTIONS } from '../constants/prompts';
import { FIXED_TEMPLATES } from '../constants/templates';

// Constants extracted to avoid magic strings, could be moved to src/constants/config.ts later
export const MODEL_IDS = {
  TEXT: 'gemini-3-flash-preview',
  IMAGE: 'gemini-3-pro-image-preview',
} as const;

// Helper to get client securely
const getGenAI = (): GoogleGenAI => {
  const key =
    sessionStorage.getItem('proinsight_api_key') ||
    localStorage.getItem('proinsight_api_key') ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta as any).env.VITE_API_KEY;

  if (!key) {
    throw new Error('API Key가 없습니다. 설정에서 키를 등록해주세요.');
  }
  return new GoogleGenAI({ apiKey: key });
};

// Market context response type
interface MarketDataItem {
  name: string;
  symbol: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketApiResponse {
  status: string;
  data: MarketDataItem[];
}

// [NEW] Helper to fetch market data for context
const fetchMarketDataContext = async (): Promise<string> => {
  try {
    const res = await fetch('/api/market_data');
    if (!res.ok) return '';

    // Use unknown first for safe casting
    const json = (await res.json()) as unknown;
    const response = json as MarketApiResponse; // Simple cast for now, validation ideal in real production

    if (response?.status !== 'success' || !Array.isArray(response?.data)) return '';

    const lines = response.data
      .map(
        (item) =>
          `- ${item.name} (${item.symbol}): ${item.currency === 'KRW' ? item.price.toLocaleString() : item.price
          } ${item.currency} (${item.change >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`,
      )
      .join('\n');

    return `\n\n[REAL-TIME MARKET CONTEXT (${new Date().toLocaleDateString()})]:\n${lines}\n(Use this data to ground your content if relevant to the topic.)`;
  } catch (e) {
    console.warn('Failed to fetch market context', e);
    return '';
  }
};

/**
 * Generates a blog post outline.
 */
export const generateOutline = async (
  topic: string,
  files: UploadedFile[],
  urls: string[],
  memo: string,
  modelId: string = MODEL_IDS.TEXT,
): Promise<OutlineData> => {
  const ai = getGenAI();

  // Get current date for context
  const currentDate = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // [NEW] Inject Market Context
  const marketContext = await fetchMarketDataContext();

  // [NEW] Check for Fixed Templates (Standardized Formats)
  if (FIXED_TEMPLATES[topic]) {
    const template = FIXED_TEMPLATES[topic];
    return {
      title: template.title,
      sections: template.sections,
    };
  }

  let promptText = PROMPTS.OUTLINE(currentDate, topic) + marketContext;

  if (memo && memo.trim()) {
    promptText += `\n\n[USER MEMO]: \n"${memo}"\n(Prioritize this instruction.)`;
  }

  if (urls.length > 0) {
    promptText += `\n\nRefer to these URLs: \n${urls.join('\n')} `;
  }

  if (files.length > 0) {
    promptText += `\n\nAnalyze the attached documents as the PRIMARY source.`;
  }

  const parts = [{ text: promptText }];

  files.forEach((file) => {
    parts.push({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Google GenAI SDK Type mismatch for inlineData unfortunately exists in some versions
      inlineData: {
        mimeType: file.mimeType,
        data: file.data,
      },
    } as any);
    // Explicit any used here due to potential SDK type definition mismatch with inlineData
    // In a full fix we would extend the type properly.
  });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { role: 'user', parts: parts as any }, // SDK type workaround
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: 'You are an expert content strategist. Output valid JSON only.',
    },
  });

  const text = response.text || '';
  if (!text) throw new Error('No outline generated.');

  // Track API usage with actual token counts from response
  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(promptText);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'outline');

  const outline = safeJsonParse<OutlineData>(text);

  // Safety check: Ensure sections are strings, not objects (fixes [object Object] bug)
  if (outline.sections && Array.isArray(outline.sections)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outline.sections = outline.sections.map((sec: any) => {
      if (typeof sec === 'object' && sec !== null) {
        return sec.title || sec.heading || sec.name || sec.section || JSON.stringify(sec);
      }
      return String(sec);
    });
  }

  return outline;
};

// [NEW] Interface for structured Key Facts
interface KeyFact {
  fact: string;
  urls: string[];
}

/**
 * 주제에 대한 핵심 팩트(수치, 날짜 등)를 먼저 검색하여 추출하는 함수
 * Returns structured data explicitly binding facts to URLs.
 */
const generateKeyFacts = async (topic: string, ai: GoogleGenAI): Promise<KeyFact[]> => {
  // We ask for JSON output now to get structured facts first
  const prompt = `
    Topic: "${topic}"
    Task: Find 5-7 CRITICAL FACTS.
    Output JSON format:
    [
      { "fact": "Fact 1", "query": "Search query used" },
      ...
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      },
    });

    const text = response.text || '[]';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawFacts = safeJsonParse<any[]>(text);

    // [NEW] Programmatically extract Grounding Sources and try to map them
    // Since Gemini Grounding is per-candidate, we get a list of all sources.
    // For now, we will attach the relevant grounding sources to the facts if possible,
    // or return the full list of sources for each fact to be safe.

    const candidate = response.candidates?.[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groundingMetadata = (candidate as any)?.groundingMetadata;
    let allSources: string[] = [];

    if (groundingMetadata?.groundingChunks) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allSources = groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web?.uri)
        .filter((uri: string) => uri);
      allSources = [...new Set(allSources)]; // Dedupe
    }

    // Map to internal KeyFact structure
    const structuredFacts: KeyFact[] = Array.isArray(rawFacts)
      ? rawFacts.map((f) => ({
        fact: f.fact || JSON.stringify(f),
        urls: allSources // Global sources for now
      }))
      : [];

    return structuredFacts;
  } catch (e) {
    console.error('Fact generation failed', e);
    return [];
  }
};

/**
 * Generates viral hashtags based on title.
 */
const generateHashtags = async (
  title: string,
  language: 'ko' | 'en',
  ai: GoogleGenAI,
): Promise<string[]> => {
  const prompt = PROMPTS.HASHTAGS(title, language);
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '[]';
    const tags = safeJsonParse<string[]>(text);
    return Array.isArray(tags) ? tags : [];
  } catch (e) {
    console.warn('Hashtag generation failed', e);
    return [];
  }
};

/**
 * Helper to generate text with files
 */
const generateText = async (
  ai: GoogleGenAI,
  prompt: string,
  files: UploadedFile[],
  systemInstruction: string = 'You are a helpful assistant.',
  modelId: string = MODEL_IDS.TEXT,
): Promise<string> => {
  const parts = [{ text: prompt }];

  files.forEach((file) => {
    parts.push({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      inlineData: {
        mimeType: file.mimeType,
        data: file.data,
      },
    } as any);
  });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { role: 'user', parts: parts as any },
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    let result = response.text || '';
    // [FIX] Cleanup Vertex AI Grounding Redirects and raw citations
    result = result
      .replace(/https:\/\/vertexaisearch\.cloud\.google\.com\/[^)\s]+/g, '') // Remove Vertex Redirects
      .replace(/\s*\(cite:[\s\d,]+\)/gi, '') // Remove [1] style citations
      .replace(/\[\d+\]/g, ''); // Remove [1] style markdown citations if any

    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(result);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'content');

    return result;
  } catch (error) {
    console.error('Section generation failed:', error);
    return '\n(이 섹션을 생성하는 중 오류가 발생했습니다.)\n';
  }
};

/**
 * Generates full blog post content (Section-by-Section).
 */
export const generateBlogPostContent = async (
  outline: OutlineData,
  tone: BlogTone,
  files: UploadedFile[],
  urls: string[],
  memo: string,
  language: string = 'Korean',
  topic: string,
  modelId: string = MODEL_IDS.TEXT,
): Promise<{ content: string; title: string; hashtags: string[] }> => {
  const ai = getGenAI();
  const isEnglish = language === 'English';

  const keyFactsData = await generateKeyFacts(outline.title, ai);
  const formattedKeyFacts = keyFactsData.map((kf, i) =>
    `Fact ${i + 1}: ${kf.fact}\nSource: ${kf.urls.join(', ')}`
  ).join('\n\n');

  // Collect all verified sources to pass to context
  const allVerifiedUrls = [...new Set(keyFactsData.flatMap(kf => kf.urls))];

  const customPersona = localStorage.getItem('proinsight_custom_persona') || '';
  const marketContext = await fetchMarketDataContext();

  let baseContext = PROMPTS.BASE_CONTEXT(
    outline.title,
    tone,
    language,
    formattedKeyFacts + marketContext,
    customPersona,
    isEnglish,
    topic,
    memo,
    [...urls, ...allVerifiedUrls], // Mapped here so they appear in 'SOURCE URLs' list too
    files.length > 0,
  );

  if (FIXED_TEMPLATES[topic]) {
    baseContext += `
      
      **CRITICAL STYLE OVERRIDE (REPORT MODE)**:
      This is a "Daily Market Briefing". You must write in a professional, concise **REPORT STYLE**.
      - **DO NOT** use conversational filler (e.g., "Let's dive in", "In this section").
      - **DO NOT** write long paragraphs.
      - **MUST** use Bullet Points (•) for almost every section.
      - **Structure**:
         1. **Key Data**: Start with the most important numbers/facts.
         2. **Cause**: Why did it move?
         3. **Implication**: What does it mean?
      - Tone: Analyst, Dry, Fact-based, High-density.
      `;
  }

  const introPrompt = PROMPTS.INTRO(baseContext, outline.sections, outline.title, isEnglish, topic);

  const sectionPromises = outline.sections.map(async (section) => {
    const sectionPrompt = PROMPTS.SECTION(baseContext, section, outline.sections, isEnglish);

    return generateText(
      ai,
      sectionPrompt,
      files,
      'You are an expert content writer. Use Tables and Emojis.',
      modelId,
    );
  });

  const conclusionPrompt = PROMPTS.CONCLUSION(baseContext, outline.sections);

  const results = await Promise.all([
    generateText(
      ai,
      introPrompt,
      files,
      'You are a professional blog writer. Write an engaging intro.',
      modelId,
    ),
    ...sectionPromises,
    generateText(
      ai,
      conclusionPrompt,
      files,
      'You are a professional editor. Summarize perfectly.',
      modelId,
    ),
    generateHashtags(outline.title, isEnglish ? 'en' : 'ko', ai),
  ]);

  const hashtags = (results.pop() as string[]) || [];
  const conclusion = (results.pop() as string) || '';
  const [introRaw, ...bodySections] = results as string[];

  let finalTitle = outline.title;
  let introContent = introRaw;

  if (isEnglish) {
    const titleMatch = introRaw.match(/^TITLE:\s*(.+)$/m);
    if (titleMatch) {
      finalTitle = titleMatch[1].trim();
      introContent = introRaw.replace(/^TITLE:\s*.+$/m, '').trim();
    }
  }

  const cleanBodySections = bodySections.map((section) => {
    let content = section.replace(/---/g, '').trim();
    if (!isEnglish) {
      content = content.replace(/^## .+\n/gm, '').trim();
    }
    return content;
  });

  let fullPost = `${introContent.replace(/---/g, '').trim()}\n\n`;

  outline.sections.forEach((section, idx) => {
    if (isEnglish) {
      fullPost += `${cleanBodySections[idx]}\n\n`;
    } else {
      fullPost += `## ${section}\n\n${cleanBodySections[idx]}\n\n`;
    }
  });

  fullPost += `${conclusion.replace(/---/g, '').trim()}`;

  return { content: fullPost, title: finalTitle, hashtags };
};

/**
 * Generates social media posts and Instagram image.
 */
export const generateSocialPosts = async (
  title: string,
  summary: string,
  imageStyle: ImageStyle,
): Promise<SocialPost[]> => {
  const ai = getGenAI();

  const prompt = PROMPTS.SOCIAL(title, summary);

  const response = await ai.models.generateContent({
    model: MODEL_IDS.TEXT,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING, enum: ['Instagram', 'LinkedIn', 'X (Twitter)'] },
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['platform', 'content', 'hashtags'],
        },
      },
    },
  });

  const text = response.text || '';
  if (!text) return [];

  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'social');

  let posts: SocialPost[] = [];
  try {
    posts = safeJsonParse<SocialPost[]>(text);
  } catch (e) {
    console.error('Failed to parse social posts JSON', e);
    return [];
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}') as any;
    const targetUrl =
      userUrls.NAVER ||
      userUrls.TISTORY ||
      userUrls.MEDIUM ||
      userUrls.WORDPRESS ||
      userUrls.SUBSTACK;

    if (targetUrl) {
      posts = posts.map((post) => ({
        ...post,
        content: post.content.replace(/\[Link\]|\[Blog Link\]|\[블로그 링크\]/gi, targetUrl),
      }));
    }
  } catch (e) {
    console.error('Link replacement error', e);
  }

  const instaIndex = posts.findIndex((p) => p.platform.toLowerCase().includes('instagram'));
  if (instaIndex !== -1) {
    try {
      const instaImage = await generateBlogImage(title, imageStyle, '1:1');
      if (instaImage) {
        posts[instaIndex].imageUrl = instaImage;
      }
    } catch (e) {
      console.error('Failed to generate Instagram image', e);
    }
  }

  return posts;
};

/**
 * Generates blog image with style and ratio.
 */
export const generateBlogImage = async (
  title: string,
  style: ImageStyle,
  ratio: string = '16:9',
): Promise<string | undefined> => {
  const ai = getGenAI();

  let stylePrompt = `STYLE: ${style}`;
  if (style === ImageStyle.PHOTOREALISTIC)
    stylePrompt = 'STYLE: Cinematic, Photorealistic, 4k, Award-winning composition, High detail.';

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.IMAGE,
      contents: PROMPTS.IMAGE(title, stylePrompt, ratio),
      config: {
        imageConfig: { aspectRatio: ratio },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          trackApiCall(MODEL_IDS.IMAGE, 100, 0, 'image');
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error('Image generation failed:', error);
  }
};

/**
 * Performs deep SEO diagnosis on the content with Viral/Persona awareness.
 */
export const analyzeSeoDetails = async (
  content: string,
  keyword: string,
  language: 'ko' | 'en' = 'ko',
  tone: string = 'polite',
): Promise<SeoDiagnosis[]> => {
  const ai = getGenAI();
  const isEnglish = language === 'en';

  let personaInstruction = PERSONA_INSTRUCTIONS.DEFAULT;
  if (tone === 'witty' || tone === 'humorous') {
    personaInstruction = PERSONA_INSTRUCTIONS.WITTY;
  } else if (tone === 'professional' || tone === 'formal') {
    personaInstruction = PERSONA_INSTRUCTIONS.PROFESSIONAL;
  } else if (tone === 'emotional' || tone === 'emphathetic') {
    personaInstruction = PERSONA_INSTRUCTIONS.EMOTIONAL;
  }

  const prompt = PROMPTS.SEO_ANALYSIS(personaInstruction, keyword, isEnglish, content);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const jsonStr = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens =
      response.usageMetadata?.candidatesTokenCount || estimateTokens(jsonStr);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'seo_analysis');

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('SEO Analysis failed:', error);
    return [];
  }
};
