
import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile } from "../types";

// Constants
const MODEL_IDS = {
  TEXT: "gemini-2.5-flash",
  IMAGE: "gemini-2.5-flash-image", // Nanobanana
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
/**
 * Helper to generate text with files
 */
const generateText = async (ai: GoogleGenAI, prompt: string, files: UploadedFile[], systemInstruction: string = "You are a helpful assistant."): Promise<string> => {
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
      model: MODEL_IDS.TEXT,
      contents: { role: 'user', parts },
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text || "";
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
  memo: string
): Promise<string> => {
  const ai = getGenAI();

  // Common Context
  let baseContext = `
    Blog Title: "${outline.title}"
    Tone: ${tone}
    Language: Korean
    Style: Use **Standard Unicode Emojis** actively (e.g., 💡, 🚀, ✅, 📌) to make the content visually appealing and friendly.
  `;
  if (memo && memo.trim()) baseContext += `\n[USER MEMO]: "${memo}"`;
  if (urls.length > 0) baseContext += `\nSOURCE URLs:\n${urls.join('\n')}`;
  if (files.length > 0) baseContext += `\n(Refer to attached documents)`;

  // 1. Intro Generation
  const introPrompt = `
    ${baseContext}
    
    Task: Write an engaging **Introduction** for this blog post.
    Outline of the whole post: ${outline.sections.join(", ")}
    
    Instructions:
    - Start with an eye-catching emoji.
    - Hook the reader immediately.
    - Briefly mention what will be covered.
    - **Keep it extremely concise (max 3 sentences).**
    - Do NOT write any section headers (like ## Introduction). Just the content.
  `;

  // 2. Section Generation (Parallel)
  const sectionPromises = outline.sections.map(async (section, idx) => {
    const sectionPrompt = `
      ${baseContext}
      
      Task: Write the content for the section: "${section}".
      Context (Full Outline): ${outline.sections.join(", ")}
      
      Instructions:
      - Write **visually engaging** and **concise** content (approx. 200-250 words).
      - **DO NOT** just write a wall of text. Use **diverse formatting**:
        1. **Bullet Points** or **Numbered Lists** for key details (Use emojis like ✅, 👉).
        2. **Markdown Table**: IF this section involves comparisons, stats, or features, **YOU MUST include a table**.
        3. **Bold Text**: Highlight key concepts.
      - **Use Emojis**: Add relevant emojis to headers or key sentences.
      - **DO NOT** use subsections (###). Use **Bold Headers** if needed.
      - Focus on information density. Express complex ideas simply.
      - Do NOT repeat the main section header (## ${section}).
    `;
    return generateText(ai, sectionPrompt, files, "You are an expert content writer. Use tables, lists, and emojis to make content readable.");
  });

  // 3. Conclusion Generation
  const conclusionPrompt = `
    ${baseContext}
    
    Task: Write a **Conclusion** and **3-Line Summary**.
    Outline of the whole post: ${outline.sections.join(", ")}
    
    Instructions:
    - Summarize the key takeaways in **max 3 sentences**.
    - End with a special section: "## ⚡ 3줄 요약".
    - Use emojis for the summary points (e.g., ✅, 💡, 🚀).
    - Include a "## 📚 참고 자료" section if URLs were provided.
  `;

  // Execute all requests in parallel
  const [intro, ...bodyAndConclusion] = await Promise.all([
    generateText(ai, introPrompt, files, "You are a professional blog writer. Write an engaging intro."),
    ...sectionPromises,
    generateText(ai, conclusionPrompt, files, "You are a professional editor. Summarize perfectly.")
  ]);

  const conclusion = bodyAndConclusion.pop(); // Last one is conclusion
  const bodySections = bodyAndConclusion; // Remaining are body sections

  // Assemble the full post
  let fullPost = `${intro}\n\n`;

  outline.sections.forEach((section, idx) => {
    fullPost += `## ${section}\n\n${bodySections[idx]}\n\n`;
  });

  fullPost += `${conclusion}`;

  return fullPost;
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
