import { ApiUsageStats, ApiCallRecord } from '../types';

const STORAGE_KEY = 'proinsight_api_usage';

// Initialize or load usage stats from localStorage
export const getApiUsageStats = (): ApiUsageStats => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to load API usage stats:', error);
    }

    // Return default empty stats
    return {
        totalCalls: 0,
        totalTokens: 0,
        estimatedCost: 0,
        lastUpdated: Date.now(),
        callHistory: [],
        monthlyUsage: {},
    };
};

// Save usage stats to localStorage
export const saveApiUsageStats = (stats: ApiUsageStats): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
        console.error('Failed to save API usage stats:', error);
    }
};

// Pricing table (per 1K tokens)
const PRICING = {
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
    'gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
} as const;

// Calculate cost for a call
const calculateCost = (
    modelId: string,
    promptTokens: number,
    completionTokens: number
): number => {
    const pricing = PRICING[modelId as keyof typeof PRICING] || PRICING['gemini-1.5-flash'];
    return (promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output;
};

// Track an API call
export const trackApiCall = (
    modelId: string,
    promptTokens: number,
    completionTokens: number,
    operation: string
): void => {
    const stats = getApiUsageStats();
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost(modelId, promptTokens, completionTokens);

    // Create call record
    const callRecord: ApiCallRecord = {
        timestamp: Date.now(),
        modelId,
        promptTokens,
        completionTokens,
        totalTokens,
        operation,
    };

    // Update overall stats
    stats.totalCalls += 1;
    stats.totalTokens += totalTokens;
    stats.estimatedCost += cost;
    stats.lastUpdated = Date.now();

    // Add to call history (keep last 100)
    stats.callHistory.unshift(callRecord);
    if (stats.callHistory.length > 100) {
        stats.callHistory = stats.callHistory.slice(0, 100);
    }

    // Update monthly usage
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!stats.monthlyUsage[yearMonth]) {
        stats.monthlyUsage[yearMonth] = { calls: 0, tokens: 0, cost: 0 };
    }
    stats.monthlyUsage[yearMonth].calls += 1;
    stats.monthlyUsage[yearMonth].tokens += totalTokens;
    stats.monthlyUsage[yearMonth].cost += cost;

    // Save to localStorage
    saveApiUsageStats(stats);
};

// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
// This is used when actual token count is not available from API response
export const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
};
