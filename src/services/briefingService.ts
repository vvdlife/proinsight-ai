
import { GoogleGenAI } from "@google/genai";
import { DailyBriefing, TechNewsItem } from "../types";
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';

const MODEL_ID = "gemini-2.5-flash";

// Helper to get client securely
const getGenAI = () => {
    const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

    if (!key) {
        throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
    }
    return new GoogleGenAI({ apiKey: key });
};

export const generateDailyBriefing = async (
    targetCompanies: string[] = ["Apple", "Microsoft", "Google (Alphabet)", "Amazon", "Meta", "NVIDIA", "Tesla"]
): Promise<DailyBriefing> => {
    const ai = getGenAI();
    const now = new Date();
    // Context awareness for better search results
    const kstDate = now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
    const usDate = now.toLocaleDateString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric' });

    const companies = targetCompanies;
    const sources = ["Reuters", "Bloomberg", "Wall Street Journal", "TechCrunch", "CNBC", "The Verge"];

    const prompt = `
    Current System Time (KST): ${kstDate}
    Current System Time (US EST): ${usDate}
    
    You are a professional tech news analyst.
    Task: Search for the most important news from the **last 7 days** for these specific companies: ${companies.join(", ")}.
    
    **CRITICAL Validations**:
    1. **CHECK DATES**: verifying the article date is within the last 7 days. **Prioritize the most recent news (today/yesterday)** but include important events from the week if today is quiet.
    2. **REAL LINKS ONLY**: You **MUST** use the exact URL returned by the Google Search tool. **DO NOT** construct, guess, or predict URLs. If you are not 100% sure the URL is valid and from the search result, leave the "url" field as an empty string "".
    3. **NO HALLUCINATIONS**: Only report real, verifiable news.
    
    Constraint 1: Use ONLY reliable US sources: ${sources.join(", ")}.
    Constraint 2: Select only the top 5 most impactful stories total.
    Constraint 4: The output must be a valid JSON object.
    
    **Translation Requirement**:
    Even though the sources are English, **summarize the content in Korean**.
    The "title" should be a translated Korean title.
    The "summary" should be a concise Korean summary (1-2 sentences).
    
    Output JSON format:
    {
        "date": "${kstDate}",
        "marketSummary": "A brief overview of the tech market today in Korean",
        "items": [
            {
                "company": "Company Name",
                "title": "Korean Title",
                "summary": "Korean Summary",
                "source": "Source Name",
                "url": "https://...",
                "impactLevel": "High" | "Medium" | "Low"
            }
        ]
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are a professional tech news analyst. Output valid JSON in Korean. No markdown.",
            },
        });

        const text = response.text || "";
        if (!text) throw new Error("No briefing generated.");

        // Track API usage
        const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
        const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
        trackApiCall(MODEL_ID, promptTokens, completionTokens, 'briefing');

        const data = safeJsonParse<DailyBriefing>(text);

        // Basic validation
        if (!data || !Array.isArray(data.items)) {
            throw new Error("Invalid format returned");
        }

        return { ...data, timestamp: Date.now() };

    } catch (error) {
        console.error("Failed to generate daily briefing:", error);
        throw error;
    }
};
