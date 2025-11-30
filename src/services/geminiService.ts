import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile } from "../types";

// Helper to get client securely
const getGenAI = () => {
  const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;
  
  if (!key) {
    throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates a blog post outline based on a topic and optional source materials.
 */
export const generateOutline = async (topic: string, files: UploadedFile[], urls: string[], memo: string): Promise<OutlineData> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash";
  
  let promptText = `Write a blog post outline for the topic: "${topic}". The output must be in Korean.`;
  
  if (memo && memo.trim()) {
      promptText += `\n\n[USER MEMO / INSTRUCTIONS]:\n"${memo}"\n(Prioritize this instruction above all else.)`;
  }

  if (urls.length > 0) {
    promptText += `\n\nRefer to the following URLs for context:\n${urls.join('\n')}`;
  }
  
  if (files.length > 0) {
    promptText += `\n\nAnalyze the attached documents (PDF/Images) and use them as the PRIMARY source of truth.`;
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
    model: modelId,
    contents: { role: 'user', parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A catchy blog post title in Korean" },
          sections: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 4-6 main section headers in Korean",
          },
        },
        required: ["title", "sections"],
      },
      systemInstruction: "You are an expert content strategist. Create engaging, well-structured outlines.",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No outline generated.");
  }

  return JSON.parse(text) as OutlineData;
};

/**
 * Generates the full blog post content.
 */
export const generateBlogPostContent = async (
  outline: OutlineData,
  tone: BlogTone,
  files: UploadedFile[],
  urls: string[],
  memo: string
): Promise<string> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash"; 

  let promptText = `
    Write a high-quality, professional blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
  `;

  if (memo && memo.trim()) {
      promptText += `\n\n[CRITICAL USER INSTRUCTION]:\n"${memo}"\n(Follow this instruction precisely.)`;
  }

  if (urls.length > 0) {
      promptText += `\n\nSOURCE MATERIAL (URLs): Use information from these links:\n${urls.join('\n')}`;
  }

  if (files.length > 0) {
      promptText += `\n\nSOURCE MATERIAL (FILES): Analyze the attached documents deeply. Cite facts, statistics, and insights directly from these files.`;
  }

  promptText += `
    CRITICAL WRITING INSTRUCTIONS:
    1.  **NO EXCESSIVE BULLET POINTS**: Write primarily in **paragraphs**. Use bullet points (-) ONLY when listing items, never for main content flow.
    2.  **Visual Elements**: You MUST include at least one **Markdown Table** to compare data or summarize key points.
    3.  **Dense & Concise**: No fluff. Every sentence must provide value.
    4.  **Actionable**: Each section should answer "Why this matters" or "What to do".
    5.  **Source Usage**: If source files/URLs are provided, you MUST base your content on them.
    
    REQUIRED SECTIONS:
    1.  **Introduction**: Hook the reader immediately. State the problem and the solution.
    2.  **Body**: Follow the outline sections. Use subheaders (##).
    3.  **## 📚 참고 자료**: List trusted sources. If URLs were provided, list them as [Name](URL). If files were used, mention the document name.
    4.  **## ⚡ 3줄 요약**: Exactly 3 bullet points summarizing the key takeaways.
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
    model: modelId,
    contents: { role: 'user', parts },
    config: {
      systemInstruction: "You are a senior analyst. Your writing is extremely structured, data-driven, and easy to scan.",
    },
  });

  return response.text || "Failed to generate content.";
};

/**
 * Generates social media promotional posts and an Instagram image.
 */
export const generateSocialPosts = async (title: string, summary: string): Promise<SocialPost[]> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash";

  const prompt = `
    Create promotional social media posts for a blog article titled: "${title}".
    Summary context: "${summary.substring(0, 300)}..."
    
    Generate 3 distinct posts:
    1. **Instagram**: Carousel/Card News Plan. Use emojis.
    2. **LinkedIn**: Professional Insight.
    3. **Twitter (X)**: Thread Hook.
    
    IMPORTANT: Use the placeholder [Link] where the blog URL should go.
    Output in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
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

  const text = response.text;
  if (!text) return [];
  
  let posts = JSON.parse(text) as SocialPost[];

  // 1. Link Replacement (Smart Priority)
  try {
    const userUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
    // Priority: Naver > Tistory > Medium > WordPress > Substack
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

  // 2. Generate Image for Instagram (1:1 Ratio)
  // We explicitly check for Instagram and trigger a separate image generation
  const instaIndex = posts.findIndex(p => p.platform === 'Instagram');
  if (instaIndex !== -1) {
      try {
          console.log("Generating Instagram image...");
          const instaImage = await generateBlogImage(title, ImageStyle.DIGITAL_ART, "1:1");
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
 * Generates a hero image with support for Aspect Ratio.
 */
export const generateBlogImage = async (title: string, style: ImageStyle, ratio: string = "16:9"): Promise<string | undefined> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash-image";

  let stylePrompt = "";
  switch (style) {
    case ImageStyle.PHOTOREALISTIC:
      stylePrompt = `STYLE: Real life photography, Shot on DSLR, 4k resolution.`;
      break;
    case ImageStyle.DIGITAL_ART:
      stylePrompt = `STYLE: High-end Digital Art, Vibrant colors, Modern aesthetics.`;
      break;
    case ImageStyle.MINIMALIST:
      stylePrompt = `STYLE: Minimalist flat illustration, Pastel colors, Clean lines.`;
      break;
    case ImageStyle.RENDER_3D:
      stylePrompt = `STYLE: 3D Render, Blender style, Isometric view, High detail.`;
      break;
    default:
      stylePrompt = `STYLE: Photorealistic, 4k resolution.`;
  }

  try {
    const prompt = `
      Create a high-quality image representing: "${title}".
      ${stylePrompt}
      ASPECT RATIO: ${ratio}.
      
      CRITICAL NEGATIVE CONSTRAINTS:
      - NO TEXT, NO LETTERS, NO NUMBERS, NO WATERMARKS inside the image.
      - Do not include messy details.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64EncodeString: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined; 
  }
};