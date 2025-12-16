import { useState, useMemo, useCallback } from 'react';
import { SeoDiagnosis } from '../types';
import { analyzeSeoDetails } from '../services/geminiService';
import { calculateSeoMetrics, calculateSeoScores, SeoMetrics, SeoScores } from '../utils/seoUtils';

export const useSeoAnalysis = (
    content: string,
    title: string,
    keyword: string = '',
    language: 'ko' | 'en' = 'ko',
    tone: string = 'polite'
) => {
    // 1. Basic Metrics & Regex Logic
    const metrics: SeoMetrics = useMemo(() => {
        return calculateSeoMetrics(content, title, keyword);
    }, [content, title, keyword]);

    // 2. AI Suggestions State
    const [suggestions, setSuggestions] = useState<SeoDiagnosis[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 3. Scoring Logic
    const scores: SeoScores = useMemo(() => {
        return calculateSeoScores(metrics, keyword, suggestions.length);
    }, [metrics, keyword, suggestions.length]);

    // 4. Action: Trigger AI Analysis
    const runDeepAnalysis = useCallback(async () => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeSeoDetails(content, keyword, language, tone);
            setSuggestions(result);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [content, keyword, language, tone]);

    return {
        metrics,
        scores,
        suggestions,
        isAnalyzing,
        error,
        runDeepAnalysis
    };
};
