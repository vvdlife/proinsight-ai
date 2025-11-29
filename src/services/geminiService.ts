import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle } from "../types";

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
  const modelId = "gemini-2.5-flash"; // Using Flash for speed

  const prompt = `
    Write a high-quality, professional blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
    
    CRITICAL INSTRUCTIONS FOR CONTENT:
    1.  **Conciseness**: Avoid long paragraphs. Use short sentences.
    2.  **Visual Structure**: You MUST include at least one **Markdown Table** to compare data or summarize key points. Use bullet points (-) frequently.
    3.  **Real Links**: When citing sources, use actual clickable URLs in the format [Source Name](URL). Do not use fake links.
    4.  **3-Line Summary**: The post MUST end with a section exactly named "## ⚡ 3줄 요약" containing 3 bullet points summarizing the entire post.
    
    CRITICAL INSTRUCTIONS FOR SOURCE CREDIBILITY:
    1.  **Fact-Based**: All content must be based on verified facts.
    2.  **Source Prioritization**: Prioritize information from Major News Outlets, Academic Journals, and Official Reports.
    3.  **References Section**: Before the 3-line summary, add a section "## 📚 참고 자료".
    
    FORMATTING REQUIREMENTS:
    - Use Markdown formatting.
    - **Headers**: Use ## for main sections.
    - **Tables**: Use standard Markdown table syntax (| Header | ... |).
    - **Links**: [Text](URL).
    - **Emphasis**: Use **bold** for key insights.
    - **Blockquotes**: Use > for important takeaways.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: "You are a professional analyst. You write concise, data-driven content with tables and charts. You never write long, boring walls of text.",
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
    
    Generate 3 distinct posts optimized for engagement:
    1. Instagram: Visual & Emotional focus. Use line breaks. Include 10-15 relevant hashtags.
    2. LinkedIn: Professional & Insightful. Focus on business value. 3-5 professional hashtags.
    3. Twitter (X): Hook-based, punchy, under 280 chars. 2-3 trending hashtags.
    
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

  // Construct prompt based on selected style
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