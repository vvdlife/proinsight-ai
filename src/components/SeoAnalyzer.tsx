import React from 'react';

interface SeoAnalyzerProps {
    content: string;
    title: string;
    keyword?: string;
}

export const SeoAnalyzer: React.FC<SeoAnalyzerProps> = ({ content, title, keyword }) => {
    // 간단한 분석 로직
    const wordCount = content.replace(/#/g, '').trim().split(/\s+/).length;
    const charCount = content.length;
    const h2Count = (content.match(/^## /gm) || []).length;
    const hasTitleKeyword = keyword ? title.includes(keyword) : true;

    // 점수 계산 (예시 로직)
    let score = 0;
    score += charCount > 1500 ? 40 : (charCount / 1500) * 40; // 분량 점수
    score += h2Count >= 4 ? 30 : (h2Count / 4) * 30; // 구조 점수
    score += hasTitleKeyword ? 30 : 0; // 키워드 점수
    score = Math.min(Math.round(score), 100);

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm h-full">
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
                <CheckItem
                    label="본문 분량"
                    passed={charCount >= 1500}
                    msg={`현재 공백포함 ${charCount}자 (권장 1,500자 이상)`}
                />
                <CheckItem
                    label="문단 구조 (H2)"
                    passed={h2Count >= 4}
                    msg={`소제목 ${h2Count}개 사용됨 (4개 이상 권장)`}
                />
                {keyword && (
                    <CheckItem
                        label="키워드 포함"
                        passed={hasTitleKeyword}
                        msg={hasTitleKeyword ? "제목에 키워드 포함됨" : "제목에 키워드가 없습니다"}
                    />
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
