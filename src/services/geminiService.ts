
import { GoogleGenAI, Type } from "@google/genai";
import { BlogTone, OutlineData, SocialPost, ImageStyle, UploadedFile, SeoDiagnosis } from "../types";
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';

// Constants
const MODEL_IDS = {
  TEXT: "gemini-2.5-flash",
  IMAGE: "gemini-2.5-flash-image", // Reverted to the version user requested
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

  // Get current date for context
  const currentDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  let promptText = `
    Current Date: ${currentDate}
    
    You are a professional content strategist specializing in high-traffic blogs.
      Task: Create a blog post outline for the topic: "${topic}".
      
      1. **Title**: Create a **Viral, Click-worthy, and SEO-optimized** title.
         - **CRITICAL**: The Title MUST include the exact keyword: "${topic}".
        - It must be provocative, benefit-driven, or a listicle (e.g., "Top 5...", "Why you are wrong about...", "The Ultimate Guide to...").
        - Maximize curiosity and click-through rate (CTR).
      
      2. **Target Audience & Keywords**:
        - Define the **Target Audience Persona** (e.g., Beginners, Experts).
        - List 3-5 **Primary & LSI Keywords** for SEO.
      
      3. **Sections**: Create 5-7 logical sections.
      
      **CRITICAL INSTRUCTION FOR SPECIFICITY**:
      - If the topic refers to a specific industry or group (e.g., "Big Tech", "K-Pop", "EV Market"), you MUST identify 3-5 SPECIFIC real-world entities (companies, people, products) to focus on.
      - Create sections that specifically analyze these entities. Do not just use generic headers like "Market Trends". Use headers like "Microsoft: Copilot's Expansion" or "Tesla: New Model Launch".
      - **CRITICAL**: The \`sections\` array must contain ONLY STRINGS. Do NOT return objects (e.g., no { "title": ... }). Just simple strings.
      
      The output must be in Korean.
      
      **CRITICAL OUTPUT FORMAT**:
      Return strictly a JSON object. Do not include markdown formatting.
    {
      "title": "String",
      "sections": ["String", "String", ...]
    }
  `;

  if (memo && memo.trim()) {
    promptText += `\n\n[USER MEMO]: \n"${memo}"\n(Prioritize this instruction.)`;
  }

  if (urls.length > 0) {
    promptText += `\n\nRefer to these URLs: \n${urls.join('\n')} `;
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
      tools: [{ googleSearch: {} }],
      systemInstruction: "You are an expert content strategist. Output valid JSON only.",
    },
  });

  const text = response.text || "";
  if (!text) throw new Error("No outline generated.");

  // Track API usage with actual token counts from response
  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(promptText);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'outline');

  const outline = safeJsonParse<OutlineData>(text);

  // Safety check: Ensure sections are strings, not objects (fixes [object Object] bug)
  if (outline.sections && Array.isArray(outline.sections)) {
    outline.sections = outline.sections.map((sec: any) => {
      if (typeof sec === 'object' && sec !== null) {
        // Try to find a meaningful string property
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
const generateKeyFacts = async (topic: string, ai: GoogleGenAI): Promise<string> => {
  const prompt = `
    Topic: "${topic}"
    
    Task: Use Google Search to find 5-7 CRITICAL FACTS needed to write a professional blog post about this topic.
    
    Output Format (Bulleted List):
    - [Data/Number]: Specific Revenue, Stock Price, or Growth Rate (e.g., $100B, +15%).
    - [Date]: Release dates or event dates.
    - [Quote]: A short key quote from a CEO or Official.
    - [Context]: Why this matters now.
    
    Constraint: Only output the facts. Do not write an intro.
  `;

  try {
    // 검색 도구(googleSearch)를 사용하여 팩트 수집
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    return response.text || "";
  } catch (e) {
    console.error("Fact generation failed", e);
    return ""; // 실패해도 글쓰기는 진행되도록 빈 문자열 반환
  }
};

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
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    let result = response.text || "";

    // Cleanup Google Search grounding artifacts (citations) like (cite: 1, 2)
    result = result.replace(/\s*\(cite:[\s\d,]+\)/gi, "");

    // Track API usage with actual token counts from response
    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(result);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'content');

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
  topic: string // [NEW] Add topic for SEO keyword optimization
): Promise<{ content: string; title: string }> => {
  const ai = getGenAI();
  const isEnglish = language === 'English';

  // [NEW] 1. 핵심 팩트 먼저 조사 (이 부분이 추가됨)
  // AI가 글을 쓰기 전에 팩트부터 찾아오게 시킵니다.
  const keyFacts = await generateKeyFacts(outline.title, ai);

  // [NEW] 커스텀 페르소나 가져오기
  const customPersona = localStorage.getItem('proinsight_custom_persona') || '';

  // Common Context (기존 코드에 keyFacts 변수 내용을 주입)
  let baseContext = `
    Blog Title: "${outline.title}"
    Tone: ${tone}
    Language: ${language}
    Style: Use ** Standard Unicode Emojis ** actively(e.g., 💡, 🚀, ✅, 📌).

    **CRITICAL CONTEXT (KEY FACTS)**:
    You MUST use the following facts to ensure accuracy. Do not hallucinate numbers if they are provided here.
    ${keyFacts}
    
    ** USER CUSTOM INSTRUCTION (HIGHEST PRIORITY) **:
    ${customPersona ? customPersona : "No custom instructions."}

    **CRITICAL LANGUAGE INSTRUCTION**:
    ${isEnglish ? '- **MUST WRITE IN ENGLISH**. Even if the outline or context is in Korean, you MUST translate and write the output in English.' : '- Write in natural, native Korean.'}
    
    ** EDITOR'S GUIDELINES (7 CORE PRINCIPLES)**:
    1. **SEO Optimization (CRITICAL)**: 
       - **Keyword Density**: Naturally repeat the main keyword "${topic}" 2-3 times per section. Aim for ~2% density.
       - **Placement**: Ensure keywords appear in the *First Paragraph* and *Headers*.
    2. **Reader Analysis**: Write for the specific audience. Use "F-pattern" formatting (bolding, bullets).
    3. **Visuals**: Use emojis and formatting to break up text.
    4. **Visuals & Infographics(CRITICAL)**:
       - **Markdown Tables**: Use for comparing data, pros/cons, or features.
       - **Mermaid Diagrams**: Use for processes, hierarchies, or timelines.
         - Syntax Rule 1: **ALWAYS enclose node labels in quotes** (e.g., id["Label with spaces!"]).
         - Syntax Rule 2: Do not use special characters like parentheses() inside the ID, only in the label.
         - Supported types: \`graph TD\`, \`mindmap\`, \`timeline\`, \`pie\`.
    5. **Interactive Elements**: Use **Emoji-based Checklists** (e.g., "- ✅ Item").
    6. **Data-Driven & Specific**:
           - **CRITICAL**: Use the \`googleSearch\` tool to find SPECIFIC data points (numbers, dates, quotes).
           - Do not say "Many companies". Say "Apple and Nvidia".
           - Cite real recent events.
    7. **References**: Provide external sources **ONLY if they are critical** for verification. 
       - Limit to max 1 high-quality link per section.
       - Format: \`[Source Name](https://...)\`. 
       - If no specific URL is found, omit the link. Do NOT create fake deep-links.
    8. **NO DISCLAIMERS**: Do NOT add "This is a fictional post" or "For illustrative purposes". Write with authority.
    9. **Target Length**: Aim for ~300-350 characters (Korean) per section to keep the total length around 3,000 characters. Be concise and impactful.
    10. **NO TITLE REPETITION**: The H1 title is already rendered by the system. Do NOT include the Main Title or "Title: ..." at the beginning of your output. Start directly with the Introduction.
  `;
  if (memo && memo.trim()) {
    baseContext += `

  [USER CUSTOM CONTEXT / INSTRUCTION START]
    ${memo}
  [USER CUSTOM CONTEXT / INSTRUCTION END]

    (Prioritize the above user instructions over default guidelines.)
    `;
  }
  if (urls.length > 0) baseContext += `\nSOURCE URLs(For reference only): \n${urls.join('\n')} `;
  if (files.length > 0) baseContext += `\n(Refer to attached documents)`;

  // 1. Intro Generation (Ask for translated title if English)
  const introPrompt = `
    ${baseContext}

  Task: Write an engaging ** Introduction ** for this blog post.
    Outline of the whole post: ${outline.sections.join(", ")}

  Instructions:
    ${isEnglish ? '- **TRANSLATION TASK**: Start your response with the English translation of the Blog Title on the first line, prefixed with "TITLE: ". Remove any labels like "(Preview)" or "(미리보기)".' : ''}
    - ** SEO Hook **: ** Start the very first sentence with the exact keyword: "${outline.title}".**
    - ** Value **: Briefly state what the reader will gain.
    - ** Conciseness **: Write about 300 - 400 characters(or 80 - 100 words).
    - Do NOT write any section headers(like ## Introduction).
    - Do NOT use horizontal rules(---).
  `;

  // 2. Section Generation (Parallel)
  const sectionPromises = outline.sections.map(async (section, idx) => {
    const sectionPrompt = `
      ${baseContext}

  Task: Write the content for the section: "${section}".
    Context(Full Outline): ${outline.sections.join(", ")}

  Instructions:
      ${isEnglish ? `- **HEADER TRANSLATION**: Start your response with the English translation of the section title "${section}" as a Level 2 Markdown Header (e.g. ## English Title).` : ''}
      - ** Structure **:
  1. ** Core Concept **: Clear explanation.
        2. ** Visual / Interactive ** (Choose one that fits best):
           - ** Comparison Table **: Use a Markdown Table for data / pros - cons.
           - ** Mermaid Diagram **: Use \`\`\`mermaid\`\`\` for flows/structures.
             **MERMAID DIAGRAM RULES (CRITICAL)**:
             • Use \`graph TD\`.
             • **Do NOT use text on arrows/edges**. Just use simple arrows (-->).
             • Format: \`NodeID["Label"]\`.
             • **Labels must be quoted in double quotes**.
             • **NO PARENTHESES () in Label**.
             • Example:
               graph TD
                 A["AI Market"] --> B["Growth"]
                 A --> C["Decline"]
           - **Checklist**: Use Emojis (e.g., "- ✅ Item").
           - **Bulleted List**: Use emojis for key points.
        3. **Key Insight**: Bold summary.
      
      - **Formatting**: ${isEnglish ? 'Use the translated header provided above.' : 'No subsections (###), no repeated headers, no horizontal rules.'}
      - **Length**: Write comprehensively. Aim for 400-500 characters (Korean) or 150-200 words (English) per section to meet deep content standards.
    `;
    return generateText(ai, sectionPrompt, files, "You are an expert content writer. Use Tables and Emojis.");
  });

  // 3. Conclusion Generation
  const conclusionPrompt = `
    ${baseContext}
    
    Task: Write a **Conclusion** and **3-Line Summary**.
    Outline of the whole post: ${outline.sections.join(", ")}
    
    Instructions:
    - Summarize the key takeaways.
    - **Interactive CTA**: Ask a question to encourage comments.
    - End with "## ⚡ 3줄 요약" (Or English equivalent "## ⚡ 3-Line Summary").
    - Do NOT use horizontal rules (---).
  `;

  // Execute all requests in parallel
  const [introRaw, ...bodyAndConclusion] = await Promise.all([
    generateText(ai, introPrompt, files, "You are a professional blog writer. Write an engaging intro."),
    ...sectionPromises,
    generateText(ai, conclusionPrompt, files, "You are a professional editor. Summarize perfectly.")
  ]);

  const conclusion = bodyAndConclusion.pop() || ""; // Last one is conclusion
  const bodySections = bodyAndConclusion; // Remaining are body sections

  // Parse Title and Intro
  let finalTitle = outline.title; // Default to original
  let introContent = introRaw;

  if (isEnglish) {
    // Extract TITLE: ...
    const titleMatch = introRaw.match(/^TITLE:\s*(.+)$/m);
    if (titleMatch) {
      finalTitle = titleMatch[1].trim();
      // Remove the TITLE line from intro
      introContent = introRaw.replace(/^TITLE:\s*.+$/m, '').trim();
    }
  }

  // Assemble
  const cleanBodySections = bodySections.map(section => {
    let content = section.replace(/---/g, '').trim();
    if (!isEnglish) {
      // Korean mode: remove AI generated headers if any, we use loop headers
      content = content.replace(/^## .+\n/gm, '').trim();
    }
    return content;
  });

  let fullPost = `${introContent.replace(/---/g, '').trim()}\n\n`;

  outline.sections.forEach((section, idx) => {
    if (isEnglish) {
      // English: The header is inside the content (as requested via prompt)
      // Just append the content. We trust the AI added "## English Title"
      fullPost += `${cleanBodySections[idx]}\n\n`;
    } else {
      // Korean: Use the outline section as header
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
  const ai = getGenAI();

  const prompt = `
    Create promotional social media posts for: "${title}".
    Summary: "${summary.substring(0, 300)}..."
    
    Generate 3 posts:
    1. **Instagram**: Engaging Caption. Use emojis. Do NOT use "(Slide 1)" markers.
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

  // Track API usage with actual token counts from response
  // Track API usage with actual token counts from response
  const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
  const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
  trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'social');

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
};

/**
 * Generates blog image with style and ratio.
 */
export const generateBlogImage = async (title: string, style: ImageStyle, ratio: string = "16:9"): Promise<string | undefined> => {
  const ai = getGenAI();

  let stylePrompt = `STYLE: ${style}`;
  // Map specific styles to better prompts if needed (simplified here for brevity)
  if (style === ImageStyle.PHOTOREALISTIC) stylePrompt = "STYLE: Cinematic, Photorealistic, 4k, Award-winning composition, High detail.";

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.IMAGE,
      contents: `Create a high-quality image for: "${title}". ${stylePrompt} Aspect Ratio: ${ratio}. 
      **CRITICAL INSTRUCTION: NO TEXT.** 
      - Do NOT include any text, letters, numbers, or characters in the image.
      - No signboards, no watermarks, no typography.
      - Pure visual representation only.`,
      config: {
        imageConfig: { aspectRatio: ratio }
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Track API usage for image generation
          // Image models typically use ~100 tokens for prompt, ~0 for completion
          trackApiCall(MODEL_IDS.IMAGE, 100, 0, 'image');

          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
  }
};

/**
 * Performs deep SEO diagnosis on the content with Viral/Persona awareness.
 */
export const analyzeSeoDetails = async (content: string, keyword: string, language: 'ko' | 'en' = 'ko', tone: string = 'polite'): Promise<SeoDiagnosis[]> => {
  const ai = getGenAI();
  const isEnglish = language === 'en';

  // 1. Define Persona based on Tone
  let personaInstruction = "";
  if (tone === 'witty' || tone === 'humorous') {
    personaInstruction = "Role: A Viral Content Editor who loves witty, punchy, and entertaining writing. Criticism should focus on 'boring' parts.";
  } else if (tone === 'professional' || tone === 'formal') {
    personaInstruction = "Role: A Senior Editor at a top-tier journal. Focus on Authority, Trustworthiness, and Clarity. Criticism should focus on 'vague' or 'unsupported' claims.";
  } else if (tone === 'emotional' || tone === 'emphathetic') {
    personaInstruction = "Role: An Emotional Storyteller. Focus on Empathy, Connection, and Human Touch. Criticism should focus on 'robotic' or 'cold' writing.";
  } else {
    personaInstruction = "Role: A Best-Selling Copywriter. Focus on Persuasion, Clarity, and Reader Retention.";
  }

  const prompt = `
    ${personaInstruction}
    
    Task: Analyze the following blog post and identify exactly 3 critical weaknesses that serve as barriers to viral growth or reader retention.
    
    Target Keyword: "${keyword || 'General'}"
    Context Language: ${isEnglish ? 'English' : 'Korean'}
    
    Evaluate based on these 3 criteria:
    1. **The Hook (First 3 seconds)**: Does the opening grab attention immediately? Is it boring?
    2. **Scannability (Mobile Experience)**: Is there a "Wall of Text"? Are sentences too long?
    3. **Viral Trigger / Authority**: Is there a reason to share this? (Emotion, Utility, or Insight).
    
    Output JSON format (Strict Array of Objects):
    [
      {
        "issue": "Short name of the issue (e.g., 'Weak Hook', 'Wall of Text', 'Robotic Tone') (${isEnglish ? 'in English' : 'in Korean'})",
        "original": "The exact sentence/segment causing the issue (max 50 chars)",
        "suggestion": "Specific, actionable advice on HOW to fix it. Be direct but helpful. (${isEnglish ? 'in English' : 'in Korean'})",
        "rewrite": "A perfect, polished rewrite of the segment that the user can use immediately."
      }
    ]
    
    **CRITICAL INSTRUCTION**:
    - If Context Language is Korean, 'issue' and 'suggestion' MUST be in Korean.
    - If Context Language is English, they MUST be treated in English.
    - Do NOT output markdown code blocks (like \`\`\`json). Just the raw JSON.
    
    Content to analyze:
    "${content.substring(0, 3000)}..." 
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_IDS.TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.response.text();
    // Clean potential markdown formatting
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Track API usage
    const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
    const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(jsonStr);
    trackApiCall(MODEL_IDS.TEXT, promptTokens, completionTokens, 'seo_analysis');

    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("SEO Analysis failed:", error);
    return [];
  }
};
