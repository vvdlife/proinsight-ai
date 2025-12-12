import React, { useState } from 'react';
import { TrendAnalysis } from '../types';
import { analyzeTrend } from '../services/trendingService';
import { SparklesIcon, ChartIcon, TrendIcon } from './Icons';

interface TrendAnalysisWidgetProps {
    topic: string;
}

export const TrendAnalysisWidget: React.FC<TrendAnalysisWidgetProps> = ({ topic }) => {
    const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const handleAnalyze = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setError(false);
        try {
            const result = await analyzeTrend(topic);
            setAnalysis(result);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!topic) return null;

    return (
        <div className="mt-6 w-full max-w-2xl mx-auto">
            {!analysis && !loading && (
                <button
                    onClick={handleAnalyze}
                    className="w-full py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl text-indigo-700 font-bold text-sm flex items-center justify-center gap-2 hover:shadow-md transition-all group"
                >
                    <SparklesIcon className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    "{topic}" 스마트 트렌드 분석하기 (Beta)
                </button>
            )}

            {loading && (
                <div className="w-full py-6 bg-white border border-slate-100 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-xs text-slate-400 font-medium">Gemini가 실시간 검색 트렌드를 분석 중입니다...</div>
                </div>
            )}

            {analysis && !loading && (
                <div className="bg-white rounded-xl border border-indigo-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-indigo-50/50 px-6 py-4 flex justify-between items-center border-b border-indigo-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <TrendIcon className="w-5 h-5 text-indigo-600" />
                            트렌드 인사이트
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${analysis.interestScore > 70 ? 'bg-red-100 text-red-600' :
                                    analysis.interestScore > 40 ? 'bg-yellow-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                }`}>
                                관심도 {analysis.interestScore}
                            </span>
                            <span className="text-xs font-bold text-slate-400">|</span>
                            <span className="text-xs font-bold text-indigo-600">{analysis.prediction}</span>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">상승 이유</div>
                                <p className="text-slate-700 font-medium leading-relaxed">
                                    {analysis.reason}
                                </p>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">연관 키워드</div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.relatedKeywords.map((k, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600">
                                            #{k}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between border-l border-slate-100 pl-6 border-dashed">
                            <div className="text-center md:text-left">
                                <div className="text-xs text-slate-400 mb-1">구글 트렌드</div>
                                <a
                                    href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(topic)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                                >
                                    <ChartIcon className="w-4 h-4" /> 그래프 보기
                                </a>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 md:border-0 md:mt-0 md:pt-0">
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                                    <div
                                        style={{ width: `${analysis.interestScore}%` }}
                                        className={`h-full rounded-full transition-all duration-1000 ${analysis.interestScore > 70 ? 'bg-red-500' :
                                                analysis.interestScore > 40 ? 'bg-amber-400' : 'bg-slate-400'
                                            }`}
                                    ></div>
                                </div>
                                <div className="text-right text-[10px] text-slate-400">화제성 지수</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
