import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle } from "../types";

// Helper to get client securely
const getGenAI = () => {
  const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || process.env.API_KEY;
  
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
    Write a high-quality, professional blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
    
    CRITICAL WRITING INSTRUCTIONS:
    1.  **NO EXCESSIVE BULLET POINTS**: Write primarily in **paragraphs**. Use bullet points (-) ONLY when listing items, never for main content flow.
    2.  **Visual Elements**: You MUST include at least one **Markdown Table** to compare data or summarize key points.
    3.  **Dense & Concise**: No fluff. Every sentence must provide value.
    4.  **Actionable**: Each section should answer "Why this matters" or "What to do".
    
    REQUIRED SECTIONS:
    1.  **Introduction**: Hook the reader immediately. State the problem and the solution.
    2.  **Body**: Follow the outline sections. Use subheaders (##).
    3.  **## 📚 참고 자료**: List trusted sources (News, Journals) using [Name](URL) format.
    4.  **## ⚡ 3줄 요약**: Exactly 3 bullet points summarizing the key takeaways.
    
    FORMATTING:
    - Use ## for main sections.
    - Use **bold** for emphasis.
    - Use > blockquotes for key insights.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: "You are a senior analyst. Your writing is extremely structured, data-driven, and easy to scan.",
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
    Summary context: "${summary.substring(0, 300)}..."
    
    Generate 3 distinct posts optimized for each platform's culture:
    
    1. **Instagram**: Create a "Carousel/Card News" plan.
       - Structure: "Slide 1: [Hook]", "Slide 2: [Point 1]", "Slide 3: [Point 2]", "Slide 4: [Conclusion]".
       - Tone: Visual, Emoji-rich, Emotional.
       - Hashtags: 10-15 relevant tags.
       
    2. **LinkedIn**: Professional Insight.
       - Focus: Industry impact, professional growth, business value.
       - Tone: Professional, Thought leadership.
       - Hashtags: 3-5 professional tags.
       
    3. **Twitter (X)**: A Thread (Targeting high engagement).
       - Structure: "1/5 [Hook]", "2/5 [Point]", ... "5/5 [Link]".
       - Tone: Punchy, controversial or surprising.
       - Hashtags: 2-3 trending tags.
    
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