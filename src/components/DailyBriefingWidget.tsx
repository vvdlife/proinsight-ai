
import React, { useState } from 'react';
import { DailyBriefing } from '../types';
import { generateDailyBriefing } from '../services/briefingService';
import { SparklesIcon, ChartIcon, CopyIcon, RefreshIcon, CheckIcon } from './Icons';

export const DailyBriefingWidget: React.FC = () => {
    const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await generateDailyBriefing();
            setBriefing(result);
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!briefing) return;

        const text = `
📅 ${briefing.date} 미국 빅테크 데일리 브리핑

📊 오늘 시장 요약
${briefing.marketSummary}

💡 주요 뉴스
${briefing.items.map((item, i) => `
${i + 1}. [${item.company}] ${item.title}
   - ${item.summary}
   - 출처: ${item.source}
`).join('')}
        `.trim();

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mt-8 w-full max-w-3xl mx-auto">
            {!briefing && !loading && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ChartIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <span className="text-3xl">🇺🇸</span> 미국 빅테크 데일리 브리핑
                        </h2>
                        <p className="text-slate-300 mb-6 max-w-lg">
                            신뢰할 수 있는 미국 현지 언론사(Reuters, Bloomberg 등)의 <br />
                            빅테크 기업 관련 뉴스를 실시간으로 수집하고 요약합니다.
                        </p>
                        <button
                            onClick={handleGenerate}
                            className="py-3 px-6 bg-white text-slate-900 rounded-lg font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg"
                        >
                            <SparklesIcon className="w-5 h-5 text-indigo-600" />
                            오늘의 브리핑 생성하기
                        </button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="w-full py-12 bg-white border border-slate-100 rounded-xl flex flex-col items-center justify-center gap-4 animate-pulse shadow-sm">
                    <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                        <div className="text-slate-800 font-bold mb-1">미국 현지 뉴스 분석 중...</div>
                        <div className="text-sm text-slate-500">Reuters, Bloomberg, WSJ 등 주요 언론사를 스캔하고 있습니다.</div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 mb-4">
                    <div className="font-bold">오류 발생:</div>
                    <div>브리핑 생성에 실패했습니다. 잠시 후 다시 시도해주세요.</div>
                    <button onClick={handleGenerate} className="ml-auto p-1 bg-white rounded-md border border-red-200 hover:bg-red-50">
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {briefing && !loading && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                        <div>
                            <div className="text-indigo-300 font-bold text-sm tracking-widest uppercase mb-1">Daily Tech Briefing</div>
                            <h2 className="text-2xl font-bold">{briefing.date}</h2>
                        </div>
                        <div className="flex gap-2 items-center">
                            {briefing.timestamp && (
                                <span className="text-xs text-slate-400 mr-2">
                                    {new Date(briefing.timestamp).toLocaleTimeString()} 업데이트
                                </span>
                            )}
                            <button
                                onClick={handleGenerate}
                                className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
                                title="재생성"
                            >
                                <RefreshIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCopy}
                                className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors text-white flex items-center gap-2"
                            >
                                {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                                <span className="text-sm font-bold">{copied ? "복사됨" : "복사하기"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Market Summary */}
                    <div className="p-6 bg-slate-50 border-b border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <ChartIcon className="w-4 h-4" /> 시장 요약
                        </h3>
                        <p className="text-slate-800 font-medium leading-relaxed">{briefing.marketSummary}</p>
                    </div>

                    {/* News Items */}
                    <div className="divide-y divide-slate-100">
                        {briefing.items.map((item, index) => (
                            <div key={index} className="p-6 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wide">
                                        {item.company}
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                        by {item.source}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-indigo-300 decoration-2 underline-offset-2">
                                        {item.title}
                                    </a>
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                    {item.summary}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
