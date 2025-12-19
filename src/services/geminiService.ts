
import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile, SeoDiagnosis } from "../types";
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';
import { PROMPTS, PERSONA_INSTRUCTIONS } from '../constants/prompts';
import { FIXED_TEMPLATES } from '../constants/templates';

// Constants
const MODEL_IDS = {
  TEXT: "gemini-3.0-flash", // Default text model
  IMAGE: "gemini-2.5-flash-image", // "Nano Banana" - Dedicated image generation model as per documentation
} as const;

// Helper to get client securely
const getGenAI = () => {
  const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

  if (!key) {
    throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// [NEW] Helper to fetch market data for context
const fetchMarketDataContext = async (): Promise<string> => {
  try {
    const res = await fetch('/api/market_data');
    if (!res.ok) return "";
    const json = await res.json();
    if (json.status !== 'success' || !json.data) return "";

    const lines = json.data.map((item: any) =>
      `- ${item.name} (${item.symbol}): ${item.currency === 'KRW' ? item.price.toLocaleString() : item.price} ${item.currency} (${item.change >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`
    ).join('\n');

    return `\n\n[REAL-TIME MARKET CONTEXT (${new Date().toLocaleDateString()})]:\n${lines}\n(Use this data to ground your content if relevant to the topic.)`;
  } catch (e) {
    console.warn("Failed to fetch market context", e);
    return "";
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
  modelId: string = MODEL_IDS.TEXT // [NEW] Accept modelId
): Promise<OutlineData> => {
  const ai = getGenAI();

  // Get current date for context
  const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // [NEW] Inject Market Context
  const marketContext = await fetchMarketDataContext();

  // [NEW] Check for Fixed Templates (Standardized Formats)
  if (FIXED_TEMPLATES[topic]) {
    // Return the pre-defined template directly
    // Allow slight title variation by appending date if needed, but structure is fixed.
    const template = FIXED_TEMPLATES[topic];
    return {
      title: template.title, // You might want to append date here dynamically
      sections: template.sections
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

  const parts: any[] = [{ text: promptText }];

  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  const response = await ai.models.generateContent({
    model: modelId, // [NEW] Use passed modelId
    contents: { role: 'user', parts },
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an expert content strategist. Output valid JSON only.",
    },
  });

  const text = response.text || "";
  if (!text) throw new Error("No outline generated.");

  // Track API usage with actual token counts from response
  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(promptText);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'outline');

  const outline = safeJsonParse<OutlineData>(text);

  // Safety check: Ensure sections are strings, not objects (fixes [object Object] bug)
  if (outline.sections && Array.isArray(outline.sections)) {
    outline.sections = outline.sections.map((sec: any) => {
      if (typeof sec === 'object' && sec !== null) {
        // Try to find a meaningful string property
        return sec.title || sec.heading || sec.name || sec.section || JSON.stringify(sec);
      }
      return String(sec);
    });
  }

  return outline;
};


/**
 * 주제에 대한 핵심 팩트(수치, 날짜 등)를 먼저 검색하여 추출하는 함수
 */
const generateKeyFacts = async (topic: string, ai: GoogleGenAI): Promise<string> => {
  const prompt = PROMPTS.KEY_FACTS(topic);

  try {
    // 검색 도구(googleSearch)를 사용하여 팩트 수집
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    return response.text || "";
  } catch (e) {
    console.error("Fact generation failed", e);
    return ""; // 실패해도 글쓰기는 진행되도록 빈 문자열 반환
  }
};

/**
 * Helper to generate text with files
 */
const generateText = async (ai: GoogleGenAI, prompt: string, files: UploadedFile[], systemInstruction: string = "You are a helpful assistant.", modelId: string = MODEL_IDS.TEXT): Promise<string> => {
  const parts: any[] = [{ text: prompt }];

  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { role: 'user', parts },
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    let result = response.text || "";

    // Cleanup Google Search grounding artifacts (citations) like (cite: 1, 2)
    result = result.replace(/\s*\(cite:[\s\d,]+\)/gi, "");

    // Track API usage with actual token counts from response
    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(result);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'content');

    return result;
  } catch (error) {
    console.error("Section generation failed:", error);
    return "\n(이 섹션을 생성하는 중 오류가 발생했습니다.)\n";
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
  topic: string, // [NEW] Add topic for SEO keyword optimization
  modelId: string = MODEL_IDS.TEXT // [NEW] Accept modelId
): Promise<{ content: string; title: string }> => {
  const ai = getGenAI();
  const isEnglish = language === 'English';

  // [NEW] 1. 핵심 팩트 먼저 조사 (이 부분이 추가됨)
  // AI가 글을 쓰기 전에 팩트부터 찾아오게 시킵니다.
  const keyFacts = await generateKeyFacts(outline.title, ai);

  // [NEW] 커스텀 페르소나 가져오기
  const customPersona = localStorage.getItem('proinsight_custom_persona') || '';

  // [NEW] Inject Market Context
  const marketContext = await fetchMarketDataContext();

  // Common Context (Use PROMPTS.BASE_CONTEXT)
  let baseContext = PROMPTS.BASE_CONTEXT(
    outline.title,
    tone,
    language,
    keyFacts + marketContext, // Append market context here
    customPersona,
    isEnglish,
    topic,
    memo,
    urls,
    files.length > 0
  );

  // [NEW] Enforce "Briefing Report Style" for Fixed Topics
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

  // 1. Intro Generation
  const introPrompt = PROMPTS.INTRO(baseContext, outline.sections, outline.title, isEnglish);

  // 2. Section Generation (Parallel)
  const sectionPromises = outline.sections.map(async (section, idx) => {
    const sectionPrompt = PROMPTS.SECTION(baseContext, section, outline.sections, isEnglish);

    return generateText(ai, sectionPrompt, files, "You are an expert content writer. Use Tables and Emojis.", modelId);
  });

  // 3. Conclusion Generation
  const conclusionPrompt = PROMPTS.CONCLUSION(baseContext, outline.sections);

  // Execute all requests in parallel
  const [introRaw, ...bodyAndConclusion] = await Promise.all([
    generateText(ai, introPrompt, files, "You are a professional blog writer. Write an engaging intro.", modelId),
    ...sectionPromises,
    generateText(ai, conclusionPrompt, files, "You are a professional editor. Summarize perfectly.", modelId)
  ]);

  const conclusion = bodyAndConclusion.pop() || ""; // Last one is conclusion
  const bodySections = bodyAndConclusion; // Remaining are body sections

  // Parse Title and Intro
  let finalTitle = outline.title; // Default to original
  let introContent = introRaw;

  if (isEnglish) {
    // Extract TITLE: ...
    const titleMatch = introRaw.match(/^TITLE:\s*(.+)$/m);
    if (titleMatch) {
      finalTitle = titleMatch[1].trim();
      // Remove the TITLE line from intro
      introContent = introRaw.replace(/^TITLE:\s*.+$/m, '').trim();
    }
  }

  // Assemble
  const cleanBodySections = bodySections.map(section => {
    let content = section.replace(/---/g, '').trim();
    if (!isEnglish) {
      // Korean mode: remove AI generated headers if any, we use loop headers
      content = content.replace(/^## .+\n/gm, '').trim();
    }
    return content;
  });

  let fullPost = `${introContent.replace(/---/g, '').trim()}\n\n`;

  outline.sections.forEach((section, idx) => {
    if (isEnglish) {
      // English: The header is inside the content (as requested via prompt)
      // Just append the content. We trust the AI added "## English Title"
      fullPost += `${cleanBodySections[idx]}\n\n`;
    } else {
      // Korean: Use the outline section as header
      fullPost += `## ${section}\n\n${cleanBodySections[idx]}\n\n`;
    }
  });

  fullPost += `${conclusion.replace(/---/g, '').trim()}`;

  return { content: fullPost, title: finalTitle };
};

/**
 * Generates social media posts and Instagram image.
 */
export const generateSocialPosts = async (title: string, summary: string, imageStyle: ImageStyle): Promise<SocialPost[]> => {
  const ai = getGenAI();

  const prompt = PROMPTS.SOCIAL(title, summary);

  const response = await ai.models.generateContent({
    model: MODEL_IDS.TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING, enum: ["Instagram", "LinkedIn", "Twitter"] },
            content: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["platform", "content", "hashtags"]
        }
      }
    }
  });

  let text = response.text || "";
  if (!text) return [];

  // Track API usage with actual token counts from response
  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'social');

  let posts: SocialPost[] = [];
  try {
    posts = safeJsonParse<SocialPost[]>(text);
  } catch (e) {
    console.error("Failed to parse social posts JSON", e);
    return [];
  }

  // 1. Link Replacement Logic
  try {
    const userUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
    const targetUrl = userUrls.NAVER || userUrls.TISTORY || userUrls.MEDIUM || userUrls.WORDPRESS || userUrls.SUBSTACK;

    if (targetUrl) {
      posts = posts.map(post => ({
        ...post,
        content: post.content.replace(/\[Link\]|\[Blog Link\]|\[블로그 링크\]/gi, targetUrl)
      }));
    }
  } catch (e) {
    console.error("Link replacement error", e);
  }

  // 2. Generate Instagram Image (1:1 Ratio)
  const instaIndex = posts.findIndex(p => p.platform.toLowerCase().includes('instagram'));
  if (instaIndex !== -1) {
    try {
      const instaImage = await generateBlogImage(title, imageStyle, "1:1");
      if (instaImage) {
        posts[instaIndex].imageUrl = instaImage;
      }
    } catch (e) {
      console.error("Failed to generate Instagram image", e);
    }
  }

  return posts;
};

/**
 * Generates blog image with style and ratio.
 */
export const generateBlogImage = async (title: string, style: ImageStyle, ratio: string = "16:9"): Promise<string | undefined> => {
  const ai = getGenAI();

  let stylePrompt = `STYLE: ${style}`;
  // Map specific styles to better prompts if needed (simplified here for brevity)
  if (style === ImageStyle.PHOTOREALISTIC) stylePrompt = "STYLE: Cinematic, Photorealistic, 4k, Award-winning composition, High detail.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.IMAGE,
      contents: PROMPTS.IMAGE(title, stylePrompt, ratio),
      config: {
        imageConfig: { aspectRatio: ratio }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Track API usage for image generation
          // Image models typically use ~100 tokens for prompt, ~0 for completion
          trackApiCall(MODEL_IDS.IMAGE, 100, 0, 'image');

          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
  }
};

/**
 * Performs deep SEO diagnosis on the content with Viral/Persona awareness.
 */
export const analyzeSeoDetails = async (content: string, keyword: string, language: 'ko' | 'en' = 'ko', tone: string = 'polite'): Promise<SeoDiagnosis[]> => {
  const ai = getGenAI();
  const isEnglish = language === 'en';

  // 1. Define Persona based on Tone
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
        responseMimeType: "application/json",
      }
    });

    // [FIX] Use response.text instead of response.response.text()
    const text = response.text || "";

    // Clean potential markdown formatting
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Track API usage
    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(jsonStr);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'seo_analysis');

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("SEO Analysis failed:", error);
    return [];
  }
};
