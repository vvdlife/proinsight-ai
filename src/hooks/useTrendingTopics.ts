import { useState, useEffect, useCallback } from 'react';
import { TrendingTopic } from '../types';
import { getTrendingTopics, clearTrendingCache } from '../services/trendingService';

export const useTrendingTopics = (modelId?: string) => {
    const [suggestions, setSuggestions] = useState<TrendingTopic[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(false);

    // Load trending topics function
    const loadTrendingTopics = async () => {
        setLoadingTrends(true);
        try {
            const topics = await getTrendingTopics(modelId);
            setSuggestions(topics);
        } catch (error) {
            console.error('Failed to load trending topics:', error);
            // Fallback topics are handled in the service
        } finally {
            setLoadingTrends(false);
        }
    };

    // Load on mount
    useEffect(() => {
        loadTrendingTopics();
    }, [modelId]);

    // Manual refresh
    const refreshTrends = async () => {
        clearTrendingCache();
        await loadTrendingTopics();
    };

    return {
        suggestions,
        loadingTrends,
        refreshTrends
    };
};
