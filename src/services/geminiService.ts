
import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile } from "../types";

// Constants
const MODEL_IDS = {
  TEXT: "gemini-2.0-flash-exp",
  IMAGE: "gemini-2.0-flash-exp",
} as const;

// Helper to get client securely
const getGenAI = () => {
  const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

  if (!key) {
    throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates a blog post outline.
 */
export const generateOutline = async (topic: string, files: UploadedFile[], urls: string[], memo: string): Promise<OutlineData> => {
  const ai = getGenAI();

  let promptText = `Write a blog post outline for the topic: "${topic}". The output must be in Korean.`;

  if (memo && memo.trim()) {
    promptText += `\n\n[USER MEMO]:\n"${memo}"\n(Prioritize this instruction.)`;
  }

  if (urls.length > 0) {
    promptText += `\n\nRefer to these URLs:\n${urls.join('\n')}`;
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
    model: MODEL_IDS.TEXT,
    contents: { role: 'user', parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          sections: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["title", "sections"],
      },
      systemInstruction: "You are an expert content strategist.",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No outline generated.");

  return JSON.parse(text) as OutlineData;
};

/**
 * Generates full blog post content.
 */
export const generateBlogPostContent = async (
  outline: OutlineData,
  tone: BlogTone,
  files: UploadedFile[],
  urls: string[],
  memo: string
): Promise<string> => {
  const ai = getGenAI();

  let promptText = `
    Write a high-quality blog post:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    Tone: ${tone}
    Language: Korean
  `;

  if (memo && memo.trim()) promptText += `\n\n[USER INSTRUCTION]:\n"${memo}"`;
  if (urls.length > 0) promptText += `\n\nSOURCE URLs:\n${urls.join('\n')}`;
  if (files.length > 0) promptText += `\n\nSOURCE FILES: Analyze attached documents.`;

  promptText += `
    INSTRUCTIONS:
    1. **NO EXCESSIVE BULLETS**: Write in **paragraphs**. Use bullets (-) ONLY for lists.
    2. **Visuals**: Include at least one **Markdown Table**.
    3. **Dense & Concise**: No fluff.
    4. **References**: End with "## 📚 참고 자료" listing provided URLs/files.
    5. **Summary**: End with "## ⚡ 3줄 요약".
  `;

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
    model: MODEL_IDS.TEXT,
    contents: { role: 'user', parts },
    config: {
      systemInstruction: "You are a senior analyst. Writing is structured, data-driven, and readable.",
    },
  });

  return response.text || "Failed to generate content.";
};

/**
 * Generates social media posts and Instagram image.
 */
export const generateSocialPosts = async (title: string, summary: string, imageStyle: ImageStyle): Promise<SocialPost[]> => {
  const ai = getGenAI();

  const prompt = `
    Create promotional social media posts for: "${title}".
    Summary: "${summary.substring(0, 300)}..."
    
    Generate 3 posts:
    1. **Instagram**: Card News Plan (Slide 1, 2, 3...). Use emojis.
    2. **LinkedIn**: Professional Insight.
    3. **Twitter**: Thread Hook.
    
    Use placeholder [Link] for the URL.
    Output JSON.
    IMPORTANT: All content must be in Korean.
  `;

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

  let text = response.text;
  if (!text) return [];

  // Cleanup markdown code blocks if present
  text = text.replace(/```json|```/g, '').trim();

  let posts: SocialPost[] = [];
  try {
    posts = JSON.parse(text) as SocialPost[];
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
  if (style === ImageStyle.PHOTOREALISTIC) stylePrompt = "STYLE: Photorealistic, DSLR, 4k resolution.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.IMAGE,
      contents: `Create a high-quality image for: "${title}". ${stylePrompt} Aspect Ratio: ${ratio}. NO TEXT.`,
      config: {
        imageConfig: { aspectRatio: ratio }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
};
