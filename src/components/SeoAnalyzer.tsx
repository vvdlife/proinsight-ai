import React, { useState } from 'react';
import { RefreshIcon, ChartIcon, CheckIcon, CopyIcon, ChevronRightIcon } from './Icons';
import { useSeoAnalysis } from '../hooks/useSeoAnalysis';

interface SeoAnalyzerProps {
  content: string;
  title: string;
  keyword?: string;
  language?: 'ko' | 'en';
  tone?: string;
  onHighlight?: (text: string) => void;
}

export const SeoAnalyzer: React.FC<SeoAnalyzerProps> = ({
  content,
  title,
  keyword = '',
  language = 'ko',
  tone = 'polite',
  onHighlight,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { metrics, scores, suggestions, isAnalyzing, runDeepAnalysis } = useSeoAnalysis(
    content,
    title,
    keyword,
    language,
    tone,
  );

  const handleDeepAnalysis = async () => {
    setShowSuggestions(true);
    await runDeepAnalysis();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">📊 SEO 분석 리포트</span>
        <button
          onClick={handleDeepAnalysis}
          className="text-xs flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded transition-colors border border-transparent hover:border-indigo-100"
          title="현재 본문 내용으로 점수 다시 계산"
        >
          <RefreshIcon className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? '분석 중...' : '점수 재계산'}
        </button>
      </h3>

      <div className="flex items-center gap-6 mb-6">
        <div
          className={`w-20 h-20 shrink-0 rounded-full flex items-center justify-center text-3xl font-bold border-4 ${
            scores.total >= 80
              ? 'border-green-500 text-green-600 bg-green-50'
              : scores.total >= 50
                ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                : 'border-red-500 text-red-600 bg-red-50'
          }`}
        >
          {scores.total}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div className="flex justify-between border-b pb-1">
            <span>분량 ({scores.length}/20)</span>
            <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-blue-400 h-full"
                style={{ width: `${(scores.length / 20) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span>구조 ({scores.structure}/20)</span>
            <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-purple-400 h-full"
                style={{ width: `${(scores.structure / 20) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span>키워드 ({scores.keyword}/40)</span>
            <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-green-400 h-full"
                style={{ width: `${(scores.keyword / 40) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between border-b pb-1">
            <span>품질 ({scores.quality}/20)</span>
            <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-full"
                style={{ width: `${(scores.quality / 20) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <CheckItem
          label="제목 매력도"
          passed={title.length > 10 && title.length < 50}
          msg={title.length > 50 ? '제목이 너무 깁니다' : '적절한 길이입니다 (10~50자)'}
        />
        {keyword ? (
          <>
            <CheckItem
              label="키워드 사용 (제목)"
              passed={metrics.inTitle}
              msg={metrics.inTitle ? '제목에 키워드가 포함됨 (+15점)' : '제목에 키워드가 없습니다'}
            />
            <CheckItem
              label="키워드 사용 (첫 문단)"
              passed={metrics.inFirstPara}
              msg={
                metrics.inFirstPara
                  ? '첫 문단에 키워드 배치됨 (+10점)'
                  : '첫 부분에 키워드를 넣어주세요'
              }
            />
            <CheckItem
              label={`키워드 밀도(${metrics.keywordDensity.toFixed(1)} %)`}
              passed={metrics.keywordDensity >= 0.5 && metrics.keywordDensity <= 3.0}
              msg={
                metrics.keywordDensity < 0.5
                  ? '키워드를 더 자주 사용하세요'
                  : metrics.keywordDensity > 3.0
                    ? '키워드가 너무 과도합니다'
                    : '아주 적절한 비율입니다'
              }
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
              passed={metrics.charCount >= 1500 && metrics.charCount <= 5000}
              msg={`${metrics.charCount}자 / 1500자 이상 권장`}
            />
            <CheckItem
              label="문단 구조 (H2)"
              passed={metrics.h2Count >= 3}
              msg={`소제목 ${metrics.h2Count}개 (3개 이상 권장)`}
            />
            <CheckItem
              label="이미지 활용"
              passed={metrics.imageCount >= 1}
              msg={`이미지 ${metrics.imageCount}개 (1개 이상 권장)`}
            />
            <CheckItem
              label="링크 활용"
              passed={metrics.linkCount >= 1}
              msg={`링크 ${metrics.linkCount}개 (1개 이상 권장)`}
            />
          </div>
        )}{' '}
      </div>
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
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  닫기
                </button>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">콘텐츠를 정밀 분석 중입니다...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                        <span className="font-bold shrink-0 text-red-400">문제점:</span>
                        <span>{item.issue}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500 bg-white p-2 rounded border border-slate-100">
                        <span className="font-bold shrink-0 text-slate-400">원문:</span>
                        <span
                          className={`italic ${onHighlight ? 'cursor-pointer hover:bg-yellow-100 hover:text-slate-900 transition-colors border-b border-dashed border-slate-300' : ''} `}
                          onClick={() => onHighlight && onHighlight(item.original)}
                          title={onHighlight ? '클릭하여 에디터에서 원문 찾기' : undefined}
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
                              <span className="text-xs font-bold text-indigo-500">
                                ✨ 이렇게 바꿔보세요 (예시):
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.rewrite || '');
                                  alert('수정 제안이 복사되었습니다!');
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
                  ))
                ) : (
                  <div className="text-center p-3">
                    <span className="text-2xl">🎉</span>
                    <p className="text-xs text-slate-500 mt-1">
                      완벽합니다! 특별한 문제점이 발견되지 않았습니다.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CheckItem = ({ label, passed, msg }: { label: string; passed: boolean; msg: string }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg text-sm">
    <div
      className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${passed ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      {passed ? '✓' : '!'}
    </div>
    <div>
      <div className={`font-bold ${passed ? 'text-slate-700' : 'text-slate-500'}`}>{label}</div>
      <div className="text-xs text-slate-400 mt-1">{msg}</div>
    </div>
  </div>
);
