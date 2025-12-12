
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

    // Official Newsroom/Blog Mapping
    const officialSources = [
        "apple.com/newsroom",
        "news.microsoft.com",
        "blogs.microsoft.com",
        "blog.google",
        "aboutamazon.com/news",
        "about.fb.com/news",
        "nvidianews.nvidia.com",
        "blogs.nvidia.com",
        "tesla.com/blog",
        "ir.tesla.com"
    ];

    const prompt = `
    Current System Time (KST): ${kstDate}
    Current System Time (US EST): ${usDate}
    
    You are a professional tech news analyst.
    Task: Search for the most important news from the **last 7 days** for these specific companies: ${companies.join(", ")}.
    
    **CRITICAL INSTRUCTIONS**:
    1. **Search**: Use the Google Search tool. **YOU MUST SEARCH ONLY OFFICIAL SOURCES**.
       - Search Query Example: "Apple AI news site:apple.com/newsroom", "Google Gemini update site:blog.google"
    2. **Filter**: select top 5 most impactful news.
    3. **Output Format**: Do NOT output JSON. Output a structured text block for each news item exactly like this:
    
    [[ITEM]]
    COMPANY: <Company Name>
    SOURCE: <Official Blog/Newsroom Name>
    URL: <Exact Source URL from the official domain>
    TITLE: <Translated Korean Title>
    SUMMARY: <Translated Korean Summary (1-2 sentences)>
    IMPACT: <High/Medium/Low>
    [[ENDITEM]]
    
    **RULES**:
    - **SOURCE TRUTH**: IGNORE 3rd party media (Reuters, Bloomberg, etc.). **ONLY** report news found on the companies' **Official Blogs, Newsrooms, or IR pages**.
    - **URL**: Copy the 'link' from the official domain EXACTLY.
    - **Freshness**: Only include news from the last 7 days.
    - **Market Summary**: At the very end, add a section called "[[MARKET_SUMMARY]]" followed by a brief 2-3 sentence Korean summary of the overall tech market.
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                // We ask for text now, not JSON
                systemInstruction: "You are a tech reporter. Be precise with URLs.",
            },
        });

        const text = response.text || "";
        if (!text) throw new Error("No briefing generated.");

        // Track API usage
        const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
        const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
        trackApiCall(MODEL_ID, promptTokens, completionTokens, 'briefing');

        // Parse the Text Output
        const items: TechNewsItem[] = [];
        const itemBlocks = text.split('[[ITEM]]').slice(1); // Skip first empty split

        for (const block of itemBlocks) {
            const companyMatch = block.match(/COMPANY:\s*(.+)/);
            const sourceMatch = block.match(/SOURCE:\s*(.+)/);
            const urlMatch = block.match(/URL:\s*(.+)/);
            const titleMatch = block.match(/TITLE:\s*(.+)/);
            const summaryMatch = block.match(/SUMMARY:\s*(.+)/);
            const impactMatch = block.match(/IMPACT:\s*(.+)/);

            if (titleMatch && summaryMatch) {
                // Clean up URL: remove markdown formatting if any (e.g. [Link](...))
                let rawUrl = urlMatch ? urlMatch[1].trim() : "";
                // Remove trailing specific characters if model added them
                rawUrl = rawUrl.replace(/\]$/, '').replace(/\)$/, '');

                items.push({
                    company: companyMatch ? companyMatch[1].trim() : "Tech",
                    source: sourceMatch ? sourceMatch[1].trim() : "News",
                    url: rawUrl,
                    title: titleMatch ? titleMatch[1].trim() : "뉴스",
                    summary: summaryMatch ? summaryMatch[1].trim() : "요약 없음",
                    impactLevel: (impactMatch && ["High", "Medium", "Low"].includes(impactMatch[1].trim()))
                        ? impactMatch[1].trim() as any
                        : "Medium"
                });
            }
        }

        // Parse Market Summary
        let marketSummary = "오늘의 시장 요약을 불러오지 못했습니다.";
        const summarySplit = text.split('[[MARKET_SUMMARY]]');
        if (summarySplit.length > 1) {
            marketSummary = summarySplit[1].trim();
        }

        if (items.length === 0) {
            console.error("Parsed text failed:", text);
            throw new Error("Failed to parse any news items from response.");
        }

        return {
            date: kstDate,
            items: items,
            marketSummary: marketSummary,
            timestamp: Date.now()
        };

    } catch (error) {
        console.error("Failed to generate daily briefing:", error);
        throw error;
    }
};
