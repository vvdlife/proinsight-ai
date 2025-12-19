import { PROMPTS, PERSONA_INSTRUCTIONS } from '../../constants/prompts';
import { FIXED_TEMPLATES } from '../../constants/templates';
import { BlogTone, UploadedFile } from '../../types';

export class PromptBuilder {
    /**
     * Builds the prompt for generating an outline.
     */
    static buildOutlinePrompt(
        topic: string,
        currentDate: string,
        marketContext: string,
        memo: string,
        urls: string[],
        hasFiles: boolean
    ): string {
        let promptText = PROMPTS.OUTLINE(currentDate, topic) + marketContext;

        if (memo && memo.trim()) {
            promptText += `\n\n[USER MEMO]: \n"${memo}"\n(Prioritize this instruction.)`;
        }

        if (urls && urls.length > 0) {
            promptText += `\n\nRefer to these URLs: \n${(urls || []).join('\n')} `;
        }

        if (hasFiles) {
            promptText += `\n\nAnalyze the attached documents as the PRIMARY source.`;
        }

        return promptText;
    }

    /**
     * Builds the base context for blog content generation.
     */
    static buildBaseContext(
        title: string,
        tone: BlogTone,
        language: string,
        keyFacts: string,
        marketContext: string,
        customPersona: string,
        isEnglish: boolean,
        topic: string,
        memo: string,
        urls: string[],
        hasFiles: boolean
    ): string {
        let baseContext = PROMPTS.BASE_CONTEXT(
            title,
            tone,
            language,
            keyFacts + marketContext,
            customPersona,
            isEnglish,
            topic,
            memo,
            urls,
            hasFiles
        );

        // Enforce "Briefing Report Style" for Fixed Topics
        if (FIXED_TEMPLATES[topic]) {
            baseContext += `
      
      **CRITICAL STYLE OVERRIDE (REPORT MODE)**:
      This is a "Daily Market Briefing". You must write in a professional, concise **REPORT STYLE**.
      - **DO NOT** use conversational filler (e.g., "Let's dive in", "In this section").
      - **DO NOT** write long paragraphs.
      - **MUST** use Bullet Points (•) for almost every section.
      - **Structure**:
         1. **Key Data**: Start with the most important numbers/facts.
         2. **Cause**: Why did it move?
         3. **Implication**: What does it mean?
      - Tone: Analyst, Dry, Fact-based, High-density.
      `;
        }

        return baseContext;
    }

    /**
     * Gets the persona instruction based on tone.
     */
    static getPersonaInstruction(tone: string): string {
        let personaInstruction = PERSONA_INSTRUCTIONS.DEFAULT;
        if (tone === 'witty' || tone === 'humorous') {
            personaInstruction = PERSONA_INSTRUCTIONS.WITTY;
        } else if (tone === 'professional' || tone === 'formal') {
            personaInstruction = PERSONA_INSTRUCTIONS.PROFESSIONAL;
        } else if (tone === 'emotional' || tone === 'emphathetic') {
            personaInstruction = PERSONA_INSTRUCTIONS.EMOTIONAL;
        }
        return personaInstruction;
    }

    static buildKeyFactsPrompt(topic: string): string {
        return PROMPTS.KEY_FACTS(topic);
    }

    static buildIntroPrompt(baseContext: string, outlineSections: string[], title: string, isEnglish: boolean): string {
        return PROMPTS.INTRO(baseContext, outlineSections, title, isEnglish);
    }

    static buildSectionPrompt(baseContext: string, section: string, outlineSections: string[], isEnglish: boolean): string {
        return PROMPTS.SECTION(baseContext, section, outlineSections, isEnglish);
    }

    static buildConclusionPrompt(baseContext: string, outlineSections: string[]): string {
        return PROMPTS.CONCLUSION(baseContext, outlineSections);
    }

    static buildSocialPrompt(title: string, summary: string): string {
        return PROMPTS.SOCIAL(title, summary);
    }

    static buildImagePrompt(title: string, style: string, ratio: string): string {
        // Logic to map ImageStyle enum to prompt string can be here or passed in.
        // geminiService had: if (style === ImageStyle.PHOTOREALISTIC) stylePrompt = ...
        // Let's pass the already processed stylePrompt for now, or move that logic here.
        // Moving logic here is better.
        let stylePrompt = `STYLE: ${style}`;
        if (style === '실사 사진 (DSLR)') { // Hardcoded string check from Enum value if we pass Enum directly? 
            // Better to pass the raw string instructions if logic stays in service, or move Enum dependency here.
            // PromptBuilder imports types, so it can use Enum.
            // But let's stick to the prompt structure.
            // PROMPTS.IMAGE takes (title, stylePrompt, ratio).
        }
        return PROMPTS.IMAGE(title, style, ratio);
    }

    static buildSeoAnalysisPrompt(personaInstruction: string, keyword: string, isEnglish: boolean, content: string): string {
        return PROMPTS.SEO_ANALYSIS(personaInstruction, keyword, isEnglish, content);
    }
}
