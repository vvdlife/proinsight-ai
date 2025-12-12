import { GoogleGenAI, Type } from "@google/genai";
import { TrendingTopic, TrendingCache, TrendAnalysis } from "../types";
import { trackApiCall, estimateTokens } from './apiUsageTracker';
import { safeJsonParse } from './utils';

const CACHE_KEY = 'proinsight_trending_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const MODEL_ID = "gemini-2.5-flash";

// Helper to get client securely
const getGenAI = () => {
    const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY;

    if (!key) {
        throw new Error("API Key가 없습니다. 설정에서 키를 등록해주세요.");
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
const generateTrendingTopics = async (): Promise<TrendingTopic[]> => {
    try {
        const ai = getGenAI();

        // Get current date for context
        const currentDate = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const prompt = `
      Current Date: ${currentDate}
      
      You are a trend analyst specializing in Korean digital content.
      
      Task: Generate 4 trending blog topics that are currently relevant and popular in Korea.
      
      Requirements:
      1. Topics should be TIMELY and reflect current events, trends, or seasonal interests
      2. Mix different categories: Technology, Economy/Finance, Productivity/Lifestyle, Environment/Society
      3. Each topic should be specific and actionable for blog writing
      4. Topics must be in Korean
      5. Assign appropriate icon names from this list:
         - "TrendIcon" (for trending/viral topics)
         - "ChartIcon" (for economic/financial topics)
         - "CodeIcon" (for tech/productivity topics)
         - "SparklesIcon" (for creative/innovative topics)
      
      Format the output as JSON with this structure:
      [
        { "icon": "TrendIcon", "text": "토픽 제목" },
        ...
      ]
    `;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
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
        trackApiCall(MODEL_ID, promptTokens, completionTokens, 'trending');

        const topics = safeJsonParse<TrendingTopic[]>(text);

        // Validate we got 4 topics
        if (!Array.isArray(topics) || topics.length !== 4) {
            console.warn("Invalid number of topics, using fallback");
            return FALLBACK_TOPICS;
        }

        return topics;
        return topics;
    } catch (error) {
        console.error("Failed to generate trending topics:", error);
        return FALLBACK_TOPICS;
    }
};

/**
 * Analyzes a specific topic for trend insights
 */
export const analyzeTrend = async (topic: string): Promise<TrendAnalysis> => {
    const ai = getGenAI();

    // Default fallback
    const fallback: TrendAnalysis = {
        interestScore: 50,
        reason: "데이터 분석 중...",
        relatedKeywords: ["분석 실패"],
        prediction: "정보를 불러올 수 없습니다."
    };

    try {
        const prompt = `
        Analyze the current search trend and popularity for the keyword: "${topic}" in South Korea.
        
        Provide the following details in JSON format:
        1. "interestScore": A number between 0-100 indicating current popularity/buzz.
        2. "reason": A brief 1-sentence explanation of WHY it is trending now (e.g., specific news, events, seasonality).
        3. "relatedKeywords": Array of 3 related search terms.
        4. "prediction": Short prediction (e.g., "Rising", "Peaked", "Steady").

        Input: ${topic}
        Output JSON:
        `;

        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            },
        });

        const text = response.text || "";
        const data = safeJsonParse<TrendAnalysis>(text);

        if (!data || typeof data.interestScore !== 'number') {
            return fallback;
        }

        return data;

    } catch (error) {
        console.error("Trend Analysis Failed:", error);
        return fallback;
    }
};

/**
 * Gets trending topics from cache or generates new ones
 */
export const getTrendingTopics = async (): Promise<TrendingTopic[]> => {
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
        const topics = await generateTrendingTopics();

        // Save to cache
        const cacheData: TrendingCache = {
            topics,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

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
