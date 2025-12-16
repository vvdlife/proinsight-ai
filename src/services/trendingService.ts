import { GoogleGenAI, Type } from "@google/genai";
import { TrendingTopic, TrendingCache, TrendAnalysis } from "../types";
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';

const CACHE_KEY = 'proinsight_trending_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const MODEL_ID = "gemini-1.5-flash-latest"; // Default (Stable Flash)

// Helper to get client securely
const getGenAI = () => {
    const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

    if (!key) {
        // Return null instead of throwing to avoid crashing background services
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
};

// Fallback topics in case of error
const FALLBACK_TOPICS: TrendingTopic[] = [
    { icon: "TrendIcon", text: "2025년 AI 기술 트렌드 분석" },
    { icon: "ChartIcon", text: "미국 연준 금리 인하와 증시 전망" },
    { icon: "CodeIcon", text: "생산성을 높이는 노션 활용법" },
    { icon: "TrendIcon", text: "지속 가능한 친환경 에너지 기술" },
];

/**
 * Generates trending topics using Gemini API
 */
const generateTrendingTopics = async (modelId: string = MODEL_ID): Promise<TrendingTopic[]> => {
    try {
        const ai = getGenAI();
        if (!ai) {
            console.warn("API Key missing, using fallback topics.");
            return FALLBACK_TOPICS;
        }

        // Get current date for context
        const currentDate = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const prompt = `
  Current Date: ${currentDate}
  
  You are an Elite Investment Analyst for Wall Street & Yeouido.
  
  Task: Identify 4 high-impact market drivers or tech trends that are CRITICAL for investors today.
  
  **SEARCH STRATEGY**:
  - Use 'googleSearch' to find breaking news from the last 24-48 hours.
  - Focus on:
    1. **Big Tech & AI**: (e.g., OpenAI, NVDA, Apple, Samsung Electronics)
    2. **Macro Economy**: (e.g., Fed Rates, Inflation, KOSPI/NASDAQ movements)
    3. **Emerging Tech**: (e.g., Robotics, Blockchain, Quantum)
  
  **Topic Requirements**:
  - MUST be specific (e.g., instead of "AI Trends", use "OpenAI's New Model Sora 2.0 Released").
  - MUST include a specific company name or economic indicator if possible.
  - MUST be in Korean.
  
  Output JSON format:
  [
    { "icon": "TrendIcon", "text": "Specific Topic Title" },
    { "icon": "ChartIcon", "text": "Specific Topic Title" },
    { "icon": "CodeIcon", "text": "Specific Topic Title" },
    { "icon": "SparklesIcon", "text": "Specific Topic Title" }
  ]
`;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are a trend analyst. Generate timely, relevant topics in Korean. Output JSON only.",
            },
        });

        const text = response.text || "";
        if (!text) {
            console.warn("No trending topics generated, using fallback");
            return FALLBACK_TOPICS;
        }

        // Track API usage
        const promptTokens = response.usageMetadata?.promptTokenCount || estimateTokens(prompt);
        const completionTokens = response.usageMetadata?.candidatesTokenCount || estimateTokens(text);
        trackApiCall(modelId, promptTokens, completionTokens, 'trending');

        const topics = safeJsonParse<TrendingTopic[]>(text);

        // Validate we got 4 topics
        if (!Array.isArray(topics) || topics.length !== 4) {
            console.warn("Invalid number of topics, using fallback");
            return FALLBACK_TOPICS;
        }

        return topics;
    } catch (error) {
        console.error("Failed to generate trending topics:", error);
        return FALLBACK_TOPICS;
    }
};

/**
 * Analyzes a specific topic for trend insights
 */
export const analyzeTrend = async (topic: string, modelId: string = MODEL_ID): Promise<TrendAnalysis> => {
    const ai = getGenAI();

    // Default fallback
    const fallback: TrendAnalysis = {
        interestScore: 50,
        reason: "데이터 분석 중...",
        relatedKeywords: ["분석 실패"],
        prediction: "정보를 불러올 수 없습니다."
    };

    try {
        if (!ai) {
            return { ...fallback, reason: "API Key가 설정되지 않았습니다." };
        }

        const prompt = `
        Analyze the current search trend and popularity for the keyword: "${topic}" in South Korea.
        
        Using Google Search results, find out why this topic is trending.
        Then, output ONLY a JSON object with this exact schema:
        {
            "interestScore": number (0-100),
            "reason": "string (1 sentence summary of why it's trending)",
            "relatedKeywords": ["string", "string", "string"],
            "prediction": "string (e.g. Rising, Peaked)"
        }
        
        Do not add any markdown formatting or explanations outside the JSON.
        `;

        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text || "";
        const data = safeJsonParse<TrendAnalysis>(text);

        if (!data || typeof data.interestScore !== 'number') {
            console.warn("Invalid data structure:", data);
            return fallback;
        }

        return data;

    } catch (error) {
        console.error("Trend Analysis Failed:", error);
        return { ...fallback, reason: "일시적인 분석 오류입니다. 잠시 후 다시 시도해주세요." };
    }
};

/**
 * Gets trending topics from cache or generates new ones
 */
export const getTrendingTopics = async (modelId?: string): Promise<TrendingTopic[]> => {
    try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const cacheData: TrendingCache = JSON.parse(cached);
            const now = Date.now();

            // If cache is still valid, return cached topics
            if (now - cacheData.timestamp < CACHE_DURATION) {
                console.log("Using cached trending topics");
                return cacheData.topics;
            }
        }

        // Cache miss or expired - generate new topics
        console.log("Generating new trending topics");
        const topics = await generateTrendingTopics(modelId);

        // Save to cache ONLY if not fallback
        if (JSON.stringify(topics) !== JSON.stringify(FALLBACK_TOPICS)) {
            const cacheData: TrendingCache = {
                topics,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } else {
            console.warn("Skipping cache for fallback topics");
            // Optional: Clear existing cache if it was old? No, logic above handles expiration.
        }

        return topics;
    } catch (error) {
        console.error("Error in getTrendingTopics:", error);
        return FALLBACK_TOPICS;
    }
};

/**
 * Clears the trending topics cache (for manual refresh)
 */
export const clearTrendingCache = (): void => {
    localStorage.removeItem(CACHE_KEY);
};
