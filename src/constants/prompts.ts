
export const PROMPTS = {
    OUTLINE: (currentDate: string, topic: string) => `
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
  `,

    KEY_FACTS: (topic: string) => `
    Topic: "${topic}"
    
    Task: Use Google Search to find 5-7 CRITICAL FACTS needed to write a professional blog post about this topic.
    
    Output Format (Bulleted List):
    - [Data/Number]: Specific Revenue, Stock Price, or Growth Rate (e.g., $100B, +15%).
    - [Date]: Release dates or event dates.
    - [Quote]: A short key quote from a CEO or Official.
    - [Context]: Why this matters now.
    
    Constraint: Only output the facts. Do not write an intro.
  `,

    BASE_CONTEXT: (
        title: string,
        tone: string,
        language: string,
        keyFacts: string,
        customPersona: string,
        isEnglish: boolean,
        topic: string,
        memo: string,
        urls: string[],
        hasFiles: boolean
    ) => {
        let context = `
    Blog Title: "${title}"
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
            context += `\n\n[USER MEMO]: \n"${memo}"\n(Prioritize this instruction.)`;
        }
        if (urls.length > 0) {
            context += `\nSOURCE URLs(For reference only): \n${urls.join('\n')} `;
        }
        if (hasFiles) {
            context += `\n(Refer to attached documents)`;
        }
        return context;
    },

    INTRO: (baseContext: string, outlineSections: string[], title: string, isEnglish: boolean) => `
    ${baseContext}

    Task: Write an engaging ** Introduction ** for this blog post.
      Outline of the whole post: ${outlineSections.join(", ")}

    Instructions:
      ${isEnglish ? '- **TRANSLATION TASK**: Start your response with the English translation of the Blog Title on the first line, prefixed with "TITLE: ". Remove any labels like "(Preview)" or "(미리보기)".' : ''}
      - ** SEO Hook **: ** Start the very first sentence with the exact keyword: "${title}".**
      - ** Value **: Briefly state what the reader will gain.
      - ** Conciseness **: Write about 300 - 400 characters(or 80 - 100 words).
      - Do NOT write any section headers(like ## Introduction).
      - Do NOT use horizontal rules(---).
  `,

    SECTION: (baseContext: string, section: string, outlineSections: string[], isEnglish: boolean) => `
    ${baseContext}

    Task: Write the content for the section: "${section}".
      Context(Full Outline): ${outlineSections.join(", ")}

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
  `,

    CONCLUSION: (baseContext: string, outlineSections: string[]) => `
    ${baseContext}
    
    Task: Write a **Conclusion** and **3-Line Summary**.
    Outline of the whole post: ${outlineSections.join(", ")}
    
    Instructions:
    - Summarize the key takeaways.
    - **Interactive CTA**: Ask a question to encourage comments.
    - End with "## ⚡ 3줄 요약" (Or English equivalent "## ⚡ 3-Line Summary").
    - Do NOT use horizontal rules (---).
  `,

    SOCIAL: (title: string, summary: string) => `
    Create promotional social media posts for: "${title}".
    Summary: "${summary.substring(0, 300)}..."
    
    Generate 3 posts:
    1. **Instagram**: Engaging Caption. Use emojis. Do NOT use "(Slide 1)" markers.
    2. **LinkedIn**: Professional Insight.
    3. **Twitter**: Thread Hook.
    
    Use placeholder [Link] for the URL.
    Output JSON.
    IMPORTANT: All content must be in Korean.
  `,

    IMAGE: (title: string, stylePrompt: string, ratio: string) => `Create a high-quality image for: "${title}". ${stylePrompt} Aspect Ratio: ${ratio}. 
    **CRITICAL INSTRUCTION: NO TEXT.** 
    - Do NOT include any text, letters, numbers, or characters in the image.
    - No signboards, no watermarks, no typography.
    - Pure visual representation only.`,

    SEO_ANALYSIS: (personaInstruction: string, keyword: string, isEnglish: boolean, content: string) => `
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
  `
};

export const PERSONA_INSTRUCTIONS = {
    WITTY: "Role: A Viral Content Editor who loves witty, punchy, and entertaining writing. Criticism should focus on 'boring' parts.",
    PROFESSIONAL: "Role: A Senior Editor at a top-tier journal. Focus on Authority, Trustworthiness, and Clarity. Criticism should focus on 'vague' or 'unsupported' claims.",
    EMOTIONAL: "Role: An Emotional Storyteller. Focus on Empathy, Connection, and Human Touch. Criticism should focus on 'robotic' or 'cold' writing.",
    DEFAULT: "Role: A Best-Selling Copywriter. Focus on Persuasion, Clarity, and Reader Retention."
};
