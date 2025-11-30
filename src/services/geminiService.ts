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
export const generateOutline = async (topic: string, files: UploadedFile[], urls: string[]): Promise<OutlineData> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash";
  
  let promptText = `Write a blog post outline for the topic: "${topic}". The output must be in Korean.`;
  
  if (urls.length > 0) {
    promptText += `\n\nRefer to the following URLs for context:\n${urls.join('\n')}`;
  }
  
  if (files.length > 0) {
    promptText += `\n\nAnalyze the attached PDF documents and use them as the PRIMARY source of truth.`;
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
      systemInstruction: "You are an expert content strategist. Create engaging, well-structured outlines based on the provided source materials.",
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
  urls: string[]
): Promise<string> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash"; 

  // Construct precise reference list for the prompt
  let referenceInstruction = "";
  if (urls.length > 0 || files.length > 0) {
      referenceInstruction = `
      IMPORTANT: You MUST end the post with a section titled "## 📚 참고 자료 (References)".
      In this section, you MUST list the following sources exactly as provided:
      `;
      
      if (urls.length > 0) {
          referenceInstruction += `\nURLs:\n${urls.map(url => `- ${url}`).join('\n')}`;
      }
      if (files.length > 0) {
          referenceInstruction += `\nDocuments:\n${files.map(f => `- ${f.name} (Uploaded Document)`).join('\n')}`;
      }
      
      referenceInstruction += "\n\n(Do not invent fake links. Use the provided ones.)";
  }

  let promptText = `
    Write a high-quality, professional blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
  `;

  if (urls.length > 0) {
      promptText += `\n\nSOURCE MATERIAL (URLs): Use information from these links:\n${urls.join('\n')}`;
  }

  if (files.length > 0) {
      promptText += `\n\nSOURCE MATERIAL (FILES): Analyze the attached documents deeply. Cite facts, statistics, and insights directly from these files.`;
  }

  promptText += `
    CRITICAL WRITING INSTRUCTIONS:
    1.  **Natural Paragraphs**: Write primarily in natural paragraphs (Seosul-hyeong). Do NOT use bullet points (-) for the main body unless listing specific items. Avoid excessive hyphenation.
    2.  **Visual Elements**: You MUST include at least one **Markdown Table** to compare data or summarize key points.
    3.  **Dense & Concise**: No fluff. Every sentence must provide value.
    4.  **Actionable**: Each section should answer "Why this matters" or "What to do".
    5.  **Source Integrity**: Base your arguments on the provided sources.
    
    REQUIRED SECTIONS:
    1.  **Introduction**: Hook the reader immediately.
    2.  **Body**: Follow the outline. Use subheaders (##).
    3.  **## ⚡ 3줄 요약**: Exactly 3 bullet points summarizing the key takeaways.
    ${referenceInstruction}
    
    FORMATTING:
    - Use ## for main sections.
    - Use **bold** for emphasis (but do not over-use).
    - Use > blockquotes for key insights.
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
      systemInstruction: "You are a senior analyst. Your writing is structured, data-driven, and easy to read. You prioritize facts from provided documents.",
    },
  });

  return response.text || "Failed to generate content.";
};

/**
 * Generates social media promotional posts.
 */
export const generateSocialPosts = async (title: string, summary: string): Promise<SocialPost[]> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash";

  // Get user's saved blog URLs for context, but we will use the prompt to structure it.
  let blogUrlContext = "";
  try {
    const userUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
    const targetUrl = userUrls.NAVER || userUrls.TISTORY || userUrls.MEDIUM || userUrls.WORDPRESS || userUrls.SUBSTACK;
    if (targetUrl) {
        blogUrlContext = `The link to the blog post is: ${targetUrl}. Please include this link naturally in the posts where appropriate (e.g. "Link in bio" or directly).`;
    } else {
        blogUrlContext = `Use a placeholder [Link] for the blog post URL.`;
    }
  } catch (e) {
      blogUrlContext = `Use a placeholder [Link] for the blog post URL.`;
  }

  const prompt = `
    Create promotional social media posts for a blog article titled: "${title}".
    Summary context: "${summary.substring(0, 300)}..."
    
    ${blogUrlContext}
    
    Generate 3 distinct posts:
    
    1. **Instagram**: Carousel/Card News Plan.
       - Structure: Slide 1 (Hook), Slide 2-3 (Points), Slide 4 (CTA).
       - Tone: Visual, Emojis.
       
    2. **LinkedIn**: Professional Insight.
       - Tone: Thought leadership.
       
    3. **Twitter (X)**: Thread Hook.
       - Tone: Punchy, concise.
    
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
  
  return JSON.parse(text) as SocialPost[];
};

/**
 * Generates a hero image.
 */
export const generateBlogImage = async (title: string, style: ImageStyle): Promise<string | undefined> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash-image";

  let stylePrompt = "";
  switch (style) {
    case ImageStyle.PHOTOREALISTIC:
      stylePrompt = "STYLE: Real life photography, Shot on DSLR, 4k resolution, Cinematic lighting. Aspect Ratio: 16:9.";
      break;
    case ImageStyle.DIGITAL_ART:
      stylePrompt = "STYLE: High-end Digital Art, Vibrant colors, Clean composition, Modern Tech aesthetics. Aspect Ratio: 16:9.";
      break;
    case ImageStyle.MINIMALIST:
      stylePrompt = "STYLE: Minimalist flat illustration, Pastel colors, Clean lines, Negative space. Aspect Ratio: 16:9.";
      break;
    case ImageStyle.RENDER_3D:
      stylePrompt = "STYLE: 3D Render, Blender style, Isometric view, Soft lighting, High detail. Aspect Ratio: 16:9.";
      break;
    default:
      stylePrompt = "STYLE: Photorealistic, 4k resolution. Aspect Ratio: 16:9.";
  }

  try {
    const prompt = `
      Create a high-quality blog header image representing: "${title}".
      
      ${stylePrompt}
      
      CRITICAL NEGATIVE CONSTRAINTS:
      - NO TEXT, NO LETTERS, NO NUMBERS, NO WATERMARKS inside the image.
      - Do not include messy details or distorted faces.
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