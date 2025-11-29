import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a blog post outline based on a topic.
 * Returns a JSON object with a title and a list of section headers.
 */
export const generateOutline = async (topic: string): Promise<OutlineData> => {
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
 * Generates the full blog post content based on the approved outline and tone.
 */
export const generateBlogPostContent = async (
  outline: OutlineData,
  tone: BlogTone
): Promise<string> => {
  const modelId = "gemini-2.5-flash"; // Using Flash for speed, Pro could be used for deeper reasoning

  const prompt = `
    Write a complete blog post based on this outline:
    Title: ${outline.title}
    Sections: ${outline.sections.join(", ")}
    
    Tone: ${tone}
    Language: Korean
    
    Requirements:
    - Use Markdown formatting.
    - Write a compelling introduction.
    - Elaborate on each section with valuable details.
    - Include a conclusion.
    - Keep paragraphs concise.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      systemInstruction: "You are a professional blog writer. Your writing is engaging, SEO-friendly, and easy to read.",
    },
  });

  return response.text || "Failed to generate content.";
};

/**
 * Generates a hero image for the blog post.
 */
export const generateBlogImage = async (title: string): Promise<string | undefined> => {
  const modelId = "gemini-2.5-flash-image";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `A high quality, modern, blog header image representing the topic: "${title}". Minimalist, clean, bright colors, digital art style. No text in the image.`,
      config: {
        // Image generation configs can go here if using Imagen models, 
        // but for gemini-2.5-flash-image we handle it via prompt mostly.
        // Aspect ratio is not directly configurable in flash-image prompt config usually,
        // but the model tries to follow prompt instructions.
      }
    });

    // Extract image from response parts
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
    // Fail gracefully without crashing the text generation
    return undefined; 
  }
};