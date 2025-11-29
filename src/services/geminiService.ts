import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost } from "../types";

// Helper to get client securely only when needed
const getGenAI = () => {
  // Try session storage first (secure), then local storage (legacy/dev)
  const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key');
  
  if (!key) {
    throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Generates a blog post outline based on a topic.
 */
export const generateOutline = async (topic: string): Promise<OutlineData> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model: modelId,
    contents: `Write a blog post outline for the topic: "${topic}". The output must be in Korean.`,
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
  tone: BlogTone
): Promise<string> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash"; 

  const prompt = `
    Write a complete blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
    
    Requirements:
    - Use Markdown formatting (headers, bold, lists).
    - Structure the post with a clear Introduction, Body paragraphs corresponding to sections, and a Conclusion.
    - Add a "FAQ" section at the end if relevant.
    - Keep paragraphs concise and readable (mobile-friendly).
    - ensure the content is high quality and informative.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: "You are a professional blog writer. Your writing is engaging, SEO-friendly, and easy to read. Do not output any system messages, just the blog content.",
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

  const prompt = `
    Create promotional social media posts for a blog article titled: "${title}".
    Summary of content: "${summary.substring(0, 500)}..."
    
    Generate 3 distinct posts:
    1. Instagram: Engaging, uses emojis, includes 10-15 popular hashtags.
    2. LinkedIn: Professional tone, business insights, 3-5 hashtags.
    3. Twitter (X): Short, punchy, under 280 characters, 2-3 hashtags.
    
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
export const generateBlogImage = async (title: string): Promise<string | undefined> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash-image";

  try {
    // Enhanced prompt to prevent text and ensure quality
    const prompt = `
      A high-quality, photorealistic or digital art style header image for a blog post about: "${title}".
      
      CRITICAL REQUIREMENTS:
      - ABSOLUTELY NO TEXT inside the image.
      - NO WATERMARKS, NO LABELS, NO SIGNATURES.
      - Clean, modern, minimalist composition.
      - Professional lighting and color grading.
      - Aspect ratio suitable for web headers (landscape).
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