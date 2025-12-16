import React, { useState } from 'react';

interface SeoAnalyzerProps {
    content: string;
    title: string;
    keyword?: string;
}

export const SeoAnalyzer: React.FC<SeoAnalyzerProps> = ({ content, title, keyword }) => {
    // 1. Basic Metrics
    const wordCount = content.replace(/#/g, '').trim().split(/\s+/).length;
    const charCount = content.replace(/\s/g, '').length;
    const h2Count = (content.match(/^## /gm) || []).length;

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
    // Length (30pts)
    score += Math.min((charCount / 1500) * 30, 30);

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

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                📊 SEO 분석 리포트
            </h3>

            <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${score >= 80 ? 'border-green-500 text-green-600 bg-green-50' :
                    score >= 50 ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                        'border-red-500 text-red-600 bg-red-50'
                    }`}>
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
                            label={`키워드 밀도 (${keywordDensity.toFixed(1)}%)`}
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
                            label="본문 분량"
                            passed={charCount >= 1500}
                            msg={`공백제외 ${charCount}자 (권장 1,500자 이상)`}
                        />
                        <CheckItem
                            label="문단 구조 (H2)"
                            passed={h2Count >= 4}
                            msg={`소제목 ${h2Count}개 (4개 이상 권장)`}
                        />
                        <CheckItem
                            label="이미지 활용"
                            passed={imageCount >= 1}
                            msg={`이미지 ${imageCount}개 (가독성 향상)`}
                        />
                        <CheckItem
                            label="링크 활용"
                            passed={linkCount >= 1}
                            msg={`링크 ${linkCount}개 (체류시간 증대)`}
                        />
                    </div>
                )}
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
