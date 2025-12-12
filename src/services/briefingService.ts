
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
    2. **SOURCE INDEXING**: Do NOT write the URL text yourself. Instead, identify which search result you used (e.g., the 1st result is index 0) and put that integer in \`sourceIndex\`. Leave \`url\` empty.
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
                "sourceIndex": 0,
                "url": "",
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

        // ---------------------------------------------------------
        // URL INJECTION LOGIC (Grounding Metadata)
        // ---------------------------------------------------------
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        console.log("Grounding Chunks:", JSON.stringify(chunks, null, 2)); // Debug log

        const itemsWithRealUrls = data.items.map(item => {
            // If model provided an index, use it to get the REAL url
            if (typeof item.sourceIndex === 'number' && chunks[item.sourceIndex]?.web?.uri) {
                return { ...item, url: chunks[item.sourceIndex].web.uri };
            }

            // Fallback: If no index, try to find a chunk that matches the title text? (Fuzzy)
            // For now, if no index, we leave it empty to avoid 404s.
            if (!item.url || item.url === "https://...") {
                return { ...item, url: "" };
            }

            return item;
        });

        return { ...data, items: itemsWithRealUrls, timestamp: Date.now() };

    } catch (error) {
        console.error("Failed to generate daily briefing:", error);
        throw error;
    }
};
