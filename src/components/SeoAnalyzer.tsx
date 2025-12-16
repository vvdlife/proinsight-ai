import React, { useState } from 'react';
import { RefreshIcon, ChartIcon, CheckIcon, CopyIcon, ChevronRightIcon } from './Icons'; // Ensure Icons check

interface SeoAnalyzerProps {
    content: string;
    title: string;
    keyword?: string;
    language?: 'ko' | 'en';
    onHighlight?: (text: string) => void;
}

export const SeoAnalyzer: React.FC<SeoAnalyzerProps> = ({ content, title, keyword, language = 'ko', onHighlight }) => {
    // 1. Basic Metrics
    const wordCount = content.replace(/#/g, '').trim().split(/\s+/).length;
    const charCount = content.replace(/\s/g, '').length;
    const h2Count = (content.match(/^## /gm) || []).length;

    // ... (metrics calculation) ...

    // 2. Keyword Analysis
    let keywordCount = 0;
    let keywordDensity = 0;
    let inTitle = false;
    let inFirstPara = false;

    if (keyword) {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        keywordCount = matches ? matches.length : 0;
        keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;
        inTitle = title.includes(keyword);

        // Check first 200 characters (approx first paragraph)
        const firstPara = content.slice(0, 300);
        inFirstPara = firstPara.includes(keyword);
    }

    // 3. Structural Analysis
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    const imageCount = (content.match(/!\[.*?\]\(.*?\)/g) || []).length;

    // 4. Scoring Logic (Weighted)
    let score = 0;
    // Length (30pts) - Ideal: 1500 ~ 5000 characters
    if (charCount >= 1500 && charCount <= 5000) {
        score += 30;
    } else if (charCount < 1500) {
        score += (charCount / 1500) * 30; // Partial score
    } else {
        score += 25; // Slight penalty for being too long (> 5000)
    }

    // Structure (20pts)
    score += Math.min((h2Count / 4) * 10, 10); // Max 10 for Headers
    score += Math.min((imageCount / 2) * 5, 5); // Max 5 for Images
    score += Math.min((linkCount / 2) * 5, 5);  // Max 5 for Links

    // Keyword (50pts)
    if (keyword) {
        if (inTitle) score += 15;
        if (inFirstPara) score += 15;

        // Density Score (Ideal: 0.5% - 3.0%)
        if (keywordDensity >= 0.5 && keywordDensity <= 3.0) score += 20;
        else if (keywordDensity > 0 && keywordDensity < 0.5) score += 10; // Too low
        else if (keywordDensity > 3.0) score += 10; // Too high
    } else {
        // If no keyword, distribute points to structure
        score += 20;
        score = Math.min(score * 1.5, 100); // Boost other scores
    }

    score = Math.min(Math.round(score), 100);

    const [detailsOpen, setDetailsOpen] = useState(false);

    // Diagnosis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<import('../types').SeoDiagnosis[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleDeepAnalysis = async () => {
        setIsAnalyzing(true);
        setShowSuggestions(true);
        try {
            const { analyzeSeoDetails } = await import('../services/geminiService');
            const result = await analyzeSeoDetails(content, keyword || '', language as 'ko' | 'en');
            setSuggestions(result);
        } catch (e) {
            console.error(e);
            alert("분석 중 오류가 발생했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                📊 SEO 분석 리포트
            </h3>

            <div className="flex items-center gap-4 mb-6">
                <div className={`w - 16 h - 16 rounded - full flex items - center justify - center text - 2xl font - bold border - 4 ${score >= 80 ? 'border-green-500 text-green-600 bg-green-50' :
                    score >= 50 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                        'border-red-500 text-red-600 bg-red-50'
                    } `}>
                    {score}
                </div>
                <div>
                    <div className="text-sm font-medium text-slate-500">SEO Score</div>
                    <div className="text-lg font-bold text-slate-800">
                        {score >= 80 ? '훌륭합니다! 🚀' : score >= 50 ? '조금 더 보완해봐요 🤔' : '내용이 부족해요 😅'}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <CheckItem
                    label="제목 매력도"
                    passed={title.length > 10 && title.length < 50}
                    msg={title.length > 50 ? "제목이 너무 깁니다" : "적절한 길이입니다"}
                />

                {keyword ? (
                    <>
                        <CheckItem
                            label="키워드 사용 (제목)"
                            passed={inTitle}
                            msg={inTitle ? "제목에 키워드가 포함됨" : "제목에 키워드가 없습니다"}
                        />
                        <CheckItem
                            label="키워드 사용 (첫 문단)"
                            passed={inFirstPara}
                            msg={inFirstPara ? "첫 문단에 키워드 배치됨 (Excellent)" : "첫 부분에 키워드를 넣어주세요"}
                        />
                        <CheckItem
                            label={`키워드 밀도(${keywordDensity.toFixed(1)} %)`}
                            passed={keywordDensity >= 0.5 && keywordDensity <= 3.0}
                            msg={keywordDensity < 0.5 ? "키워드를 더 자주 사용하세요" : keywordDensity > 3.0 ? "키워드가 너무 과도합니다 (어뷰징 주의)" : "아주 적절한 비율입니다 (0.5~3%)"}
                        />
                    </>
                ) : (
                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg text-sm mb-2">
                        💡 주제(키워드)를 입력하면 더 정밀한 분석이 가능합니다.
                    </div>
                )}

                <button
                    onClick={() => setDetailsOpen(!detailsOpen)}
                    className="w-full text-center text-xs text-slate-400 py-2 hover:text-slate-600 border-t border-slate-100 mt-2"
                >
                    {detailsOpen ? '간략히 보기 ▲' : '상세 분석 더보기 ▼'}
                </button>

                {detailsOpen && (
                    <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <CheckItem
                            label="본문 분량 (1,500~5,000자)"
                            passed={charCount >= 1500 && charCount <= 5000}
                            msg={charCount < 1500 ? `현재 ${charCount} 자(조금 더 길게 작성해보세요)` : charCount > 5000 ? `현재 ${charCount} 자(너무 깁니다, 가독성을 위해 분할 고려)` : `현재 ${charCount} 자(적절합니다)`}
                        />
                        <CheckItem
                            label="문단 구조 (H2)"
                            passed={h2Count >= 4}
                            msg={`소제목 ${h2Count} 개(4개 이상 권장)`}
                        />
                        <CheckItem
                            label="이미지 활용"
                            passed={imageCount >= 1}
                            msg={`이미지 ${imageCount} 개(가독성 향상)`}
                        />
                        <CheckItem
                            label="링크 활용"
                            passed={linkCount >= 1}
                            msg={`링크 ${linkCount} 개(체류시간 증대)`}
                        />
                    </div>
                )}

                {/* AI Deep Analysis Section */}
                <div className="pt-4 mt-2 border-t border-slate-100">
                    {!showSuggestions ? (
                        <button
                            onClick={handleDeepAnalysis}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <span>🤖 AI 심층 진단 & 수정 제안</span>
                        </button>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                                    💡 AI 수정 제안
                                </h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeepAnalysis}
                                        className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"
                                        title="현재 내용으로 다시 분석"
                                    >
                                        <RefreshIcon className="w-3 h-3" /> 재분석
                                    </button>
                                    <button onClick={() => setShowSuggestions(false)} className="text-xs text-slate-400 hover:text-slate-600">닫기</button>
                                </div>
                            </div>

                            {isAnalyzing ? (
                                <div className="p-4 bg-slate-50 rounded-xl text-center">
                                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <p className="text-xs text-slate-500">콘텐츠를 정밀 분석 중입니다...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {suggestions.length > 0 ? suggestions.map((item, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                                                <span className="font-bold shrink-0 text-red-400">문제점:</span>
                                                <span>{item.issue}</span>
                                            </div>
                                            <div className="flex gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                                                <span className="font-bold shrink-0 text-slate-400">원문:</span>
                                                <span
                                                    className={`italic ${onHighlight ? "cursor-pointer hover:bg-yellow-100 hover:text-slate-900 transition-colors border-b border-dashed border-slate-300" : ""} `}
                                                    onClick={() => onHighlight && onHighlight(item.original)}
                                                    title={onHighlight ? "클릭하여 에디터에서 원문 찾기" : undefined}
                                                >
                                                    "{item.original}"
                                                </span>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-indigo-600">💡 개선 제안:</span>
                                                </div>
                                                <p className="mb-2 text-indigo-900">{item.suggestion}</p>

                                                {item.rewrite && (
                                                    <div className="mt-3 pt-3 border-t border-indigo-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-indigo-500">✨ 이렇게 바꿔보세요 (예시):</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(item.rewrite || '');
                                                                    alert("수정 제안이 복사되었습니다!");
                                                                }}
                                                                className="flex items-center gap-1 text-[10px] bg-white text-indigo-600 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                                                            >
                                                                복사하기
                                                            </button>
                                                        </div>
                                                        <div className="bg-white p-2 rounded text-slate-700 italic text-xs border border-indigo-100">
                                                            "{item.rewrite}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center p-3">
                                            <span className="text-2xl">🎉</span>
                                            <p className="text-xs text-slate-500 mt-1">완벽합니다! 특별한 문제점이 발견되지 않았습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CheckItem = ({ label, passed, msg }: { label: string, passed: boolean, msg: string }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-sm">
        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${passed ? 'bg-green-500' : 'bg-slate-300'}`}>
            {passed ? '✓' : '!'}
        </div>
        <div>
            <div className={`font-bold ${passed ? 'text-slate-700' : 'text-slate-500'}`}>{label}</div>
            <div className="text-xs text-slate-400 mt-1">{msg}</div>
        </div>
    </div>
);
