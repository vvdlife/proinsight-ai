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
  const modelId = "gemini-2.5-flash"; // Using Flash for speed

  const prompt = `
    Write a high-quality, professional blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
    
    CRITICAL INSTRUCTIONS FOR SOURCE CREDIBILITY:
    1.  **Fact-Based**: All content must be based on verified facts.
    2.  **Source Prioritization**: Prioritize information from:
        - Major News Outlets (verified journalism)
        - Academic Journals & Papers
        - Official Government/Organization Reports
        - Trusted Tech/Economy Documentation
    3.  **No Hallucinations**: Do not invent statistics or citations. If exact data isn't known, speak in general verified trends.
    4.  **References Section**: At the very end of the post, add a section named "## 📚 신뢰할 수 있는 출처 및 참고 자료". List the types of sources or specific public names used (e.g., "Statistics Korea 2024 Report", "Nature Journal related articles").
    
    FORMATTING REQUIREMENTS:
    - Use Markdown formatting.
    - **Headers**: Use ## for main sections, ### for subsections.
    - **Emphasis**: Use **bold** for key insights.
    - **Lists**: Use bullet points (-) for readability.
    - **Blockquotes**: Use > for summaries or important takeaways.
    - **Structure**: Introduction -> Body -> Conclusion -> References.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: "You are a professional analyst and writer. Your goal is to provide accurate, insightful, and verifiable information. Writing style should be suitable for a high-quality tech/economy blog.",
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
export const generateBlogImage = async (title: string): Promise<string | undefined> => {
  const ai = getGenAI();
  const modelId = "gemini-2.5-flash-image";

  try {
    const prompt = `
      A professional, minimalist, abstract header image representing: "${title}".
      
      CRITICAL:
      - NO TEXT, NO LETTERS, NO NUMBERS inside the image.
      - NO WATERMARKS.
      - Photorealistic or high-end 3D render style.
      - Soft, natural lighting.
      - Landscape aspect ratio.
      - Theme: Modern Technology / Business / Economy / Nature (depending on title).
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