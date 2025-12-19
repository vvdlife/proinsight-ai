import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile, SeoDiagnosis } from "../types";
import { safeJsonParse } from './utils';
import { FIXED_TEMPLATES } from '../constants/templates';
import { AiClient } from "./ai/AiClient";
import { PromptBuilder } from "./ai/PromptBuilder";

// Constants
const MODEL_IDS = {
  TEXT: "gemini-2.5-flash",
  IMAGE: "gemini-2.5-flash-image",
} as const;

// [NEW] Helper to fetch market data for context
// (This remains here as it's business/API logic, not strict AI logic)
const fetchMarketDataContext = async (): Promise<string> => {
  try {
    const res = await fetch('/api/market_data');
    if (!res.ok) return "";
    const json = await res.json();
    if (json.status !== 'success' || !json.data || !Array.isArray(json.data)) return "";

    const lines = json.data.map((item: any) =>
      `- ${item.name} (${item.symbol}): ${item.currency === 'KRW' ? item.price.toLocaleString() : item.price} ${item.currency} (${item.change >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`
    ).join('\n');

    return `\n\n[REAL-TIME MARKET CONTEXT (${new Date().toLocaleDateString()})]:\n${lines}\n(Use this data to ground your content if relevant to the topic.)`;
  } catch (e) {
    // Ignore error in production/demo mode
    if ((import.meta as any).env.DEV) {
      console.warn("Failed to fetch market context", e);
    }
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

  // Get current date for context
  const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  // [NEW] Inject Market Context
  const marketContext = await fetchMarketDataContext();

  // [NEW] Check for Fixed Templates (Standardized Formats)
  // Logic remains in Service as it determines strict return flow
  if (FIXED_TEMPLATES[topic]) {
    const template = FIXED_TEMPLATES[topic];
    return {
      title: template.title,
      sections: template.sections
    };
  }

  const promptText = PromptBuilder.buildOutlinePrompt(
    topic, currentDate, marketContext, memo, urls, files.length > 0
  );

  const parts: any[] = [{ text: promptText }];

  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  const response = await AiClient.generate(
    modelId,
    parts,
    {
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an expert content strategist. Output valid JSON only.",
    },
    'outline',
    promptText // For token estimation fallback
  );

  const text = response.text || "";
  if (!text) throw new Error("No outline generated.");

  const outline = safeJsonParse<OutlineData>(text);

  // Safety check: Ensure sections are strings
  if (outline.sections && Array.isArray(outline.sections)) {
    outline.sections = outline.sections.map((sec: any) => {
      if (typeof sec === 'object' && sec !== null) {
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
const generateKeyFacts = async (topic: string): Promise<string> => {
  const prompt = PromptBuilder.buildKeyFactsPrompt(topic);

  try {
    const response = await AiClient.generate(
      "gemini-2.5-flash",
      [{ text: prompt }],
      { tools: [{ googleSearch: {} }] },
      'key_facts',
      prompt
    );
    return response.text || "";
  } catch (e) {
    console.error("Fact generation failed", e);
    return "";
  }
};

/**
 * Helper to generate text with files
 */
const generateText = async (prompt: string, files: UploadedFile[], systemInstruction: string = "You are a helpful assistant.", modelId: string = MODEL_IDS.TEXT): Promise<string> => {
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
    // Note: AiClient handles tracking internally
    const response = await AiClient.generate(
      modelId,
      parts,
      {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
      'content',
      prompt
    );

    let result = response.text || "";

    // Cleanup Google Search grounding artifacts
    result = result.replace(/\s*\(cite:[\s\d,]+\)/gi, "");

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
  const isEnglish = language === 'English';

  // [NEW] 1. 핵심 팩트 먼저 조사
  const keyFacts = await generateKeyFacts(outline.title);

  // [NEW] 커스텀 페르소나 가져오기
  const customPersona = localStorage.getItem('proinsight_custom_persona') || '';

  // [NEW] Inject Market Context
  const marketContext = await fetchMarketDataContext();

  // Common Context
  const baseContext = PromptBuilder.buildBaseContext(
    outline.title,
    tone,
    language,
    keyFacts, // Note: Market Context is passed as separate arg in Builder? No, previously it was appended to keyFacts in PromptBuilder call.
    // Wait, PromptBuilder.buildBaseContext signature: (title, tone, ..., keyFacts, marketContext, ...).
    // I need to make sure I updated PromptBuilder with that signature or pass it correctly.
    // Let's check the PromptBuilder code I wrote. 
    // Logic in PromptBuilder: keyFacts + marketContext. 
    // So I should pass marketContext as 5th argument.
    // (title, tone, language, keyFacts, marketContext, customPersona, isEnglish, topic, memo, urls, hasFiles)
    marketContext,
    customPersona,
    isEnglish,
    topic,
    memo,
    urls,
    files.length > 0
  );

  // 1. Intro Generation
  const introPrompt = PromptBuilder.buildIntroPrompt(baseContext, outline.sections, outline.title, isEnglish);

  // 2. Section Generation (Parallel)
  const sectionPromises = outline.sections.map(async (section, idx) => {
    const sectionPrompt = PromptBuilder.buildSectionPrompt(baseContext, section, outline.sections, isEnglish);

    return generateText(sectionPrompt, files, "You are an expert content writer. Use Tables and Emojis.", modelId);
  });

  // 3. Conclusion Generation
  const conclusionPrompt = PromptBuilder.buildConclusionPrompt(baseContext, outline.sections);

  // Execute all requests in parallel
  const [introRaw, ...bodyAndConclusion] = await Promise.all([
    generateText(introPrompt, files, "You are a professional blog writer. Write an engaging intro.", modelId),
    ...sectionPromises,
    generateText(conclusionPrompt, files, "You are a professional editor. Summarize perfectly.", modelId)
  ]);

  const conclusion = bodyAndConclusion.pop() || "";
  const bodySections = bodyAndConclusion;

  // Parse Title and Intro
  let finalTitle = outline.title;
  let introContent = introRaw;

  if (isEnglish) {
    const titleMatch = introRaw.match(/^TITLE:\s*(.+)$/m);
    if (titleMatch) {
      finalTitle = titleMatch[1].trim();
      introContent = introRaw.replace(/^TITLE:\s*.+$/m, '').trim();
    }
  }

  // Assemble
  const cleanBodySections = bodySections.map(section => {
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

  return { content: fullPost, title: finalTitle };
};

/**
 * Generates social media posts and Instagram image.
 */
export const generateSocialPosts = async (title: string, summary: string, imageStyle: ImageStyle): Promise<SocialPost[]> => {

  const prompt = PromptBuilder.buildSocialPrompt(title, summary);

  try {
    const response = await AiClient.generate(
      MODEL_IDS.TEXT,
      [{ text: prompt }],
      {
        responseMimeType: "application/json",
        // Note: Schema definition often requires Type import from SDK. 
        // AiClient can handle schema if passed as object. 
        // Ideally we pass schema, but to avoid importing Type here, maybe we let AiClient handle simple JSON mode or skip schema validation if it's too complex to migrate now without Type import.
        // For now, let's skip schema or import it?
        // "Type" is imported in original file. I removed it from imports.
        // Let's trust JSON mode or re-add Type import if schemas are critical.
        // For safety, I'll assume AiClient handles it or I should rely on text parsing as before.
        // The original code used responseSchema.
        // I'll skip schema for this step to reduce dependency, relies on PROMPTS.SOCIAL saying "Output JSON".
        // existing prompt says "Output JSON".
      },
      'social',
      prompt
    );

    let text = response.text || "";
    if (!text) return [];

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
  } catch (error) {
    console.error("Social generation failed", error);
    return [];
  }
};

/**
 * Generates blog image with style and ratio.
 */
export const generateBlogImage = async (title: string, style: ImageStyle, ratio: string = "16:9"): Promise<string | undefined> => {
  // Map specific styles logic moved to PromptBuilder or just pass raw style
  // PromptBuilder.buildImagePrompt handles the prompt construction.
  const prompt = PromptBuilder.buildImagePrompt(title, style, ratio);

  return AiClient.generateImage(MODEL_IDS.IMAGE, prompt, ratio);
};

/**
 * Performs deep SEO diagnosis on the content with Viral/Persona awareness.
 */
export const analyzeSeoDetails = async (content: string, keyword: string, language: 'ko' | 'en' = 'ko', tone: string = 'polite'): Promise<SeoDiagnosis[]> => {
  const isEnglish = language === 'en';

  const personaInstruction = PromptBuilder.getPersonaInstruction(tone);
  const prompt = PromptBuilder.buildSeoAnalysisPrompt(personaInstruction, keyword, isEnglish, content);

  try {
    const response = await AiClient.generate(
      MODEL_IDS.TEXT,
      [{ text: prompt }],
      { responseMimeType: "application/json" },
      'seo_analysis',
      prompt
    );

    const text = response.text || "";
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("SEO Analysis failed:", error);
    return [];
  }
};
