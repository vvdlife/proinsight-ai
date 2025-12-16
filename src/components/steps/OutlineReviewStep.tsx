import React, { useMemo } from 'react';
import { RefreshIcon, ChevronRightIcon } from '../Icons';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { BlogTone, ImageStyle } from '../../types';
import { useBlogContext } from '../../context/BlogContext';

export const OutlineReviewStep: React.FC = () => {
    const {
        selectedTone, setSelectedTone,
        selectedImageStyle, setSelectedImageStyle,
        outline, setOutline,
        resetAll: onReset,
        isDualMode, setIsDualMode,
        onGenerateFullPost,
        selectedFont
    } = useBlogContext();

    const onUpdateSection = (index: number, value: string) => {
        if (!outline) return;
        const newSections = [...outline.sections];
        newSections[index] = value;
        setOutline({ ...outline, sections: newSections });
    };

    const draftPreview = useMemo(() => {
        if (!outline) return "";
        let draft = `# ${outline.title} \n\n > 이 글은 ** ${selectedTone}** 톤으로 작성될 예정입니다.\n\n`;
        outline.sections.forEach((section, idx) => {
            draft += `## ${idx + 1}. ${section} \n(이 섹션에 대한 상세 내용이 여기에 생성됩니다.관련 데이터와 예시가 포함될 수 있습니다.) \n\n`;
        });
        draft += `## ⚡ 3줄 요약\n - 핵심 포인트 1\n - 핵심 포인트 2\n - 핵심 포인트 3\n`;
        return draft;
    }, [outline, selectedTone]);


    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Editor & Settings */}
                <div className="space-y-6">

                    {/* Tone & Style Settings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">A</span>
                                    글의 톤앤매너
                                </h3>
                                <div className="space-y-2">
                                    {Object.values(BlogTone).map((tone) => (
                                        <button
                                            key={tone}
                                            onClick={() => setSelectedTone(tone)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedTone === tone
                                                ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                                                : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">🎨</span>
                                    이미지 스타일
                                </h3>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                    {Object.values(ImageStyle).map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => setSelectedImageStyle(style)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedImageStyle === style
                                                ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                                                : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Outline Input Editor */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">개요 편집</h2>
                            <button
                                onClick={onReset}
                                className="text-slate-500 hover:text-red-500 text-sm flex items-center gap-1 font-medium"
                            >
                                <RefreshIcon className="w-4 h-4" /> 처음으로
                            </button>
                        </div>

                        <div className="p-6 space-y-6 flex-1">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">제목</label>
                                <input
                                    type="text"
                                    value={outline?.title || ''}
                                    onChange={(e) => outline && setOutline({ ...outline, title: e.target.value })}
                                    className="w-full text-xl font-bold text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-2 transition-colors bg-transparent leading-tight"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">섹션 구성</label>
                                {outline?.sections.map((section, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group">
                                        <span className="text-slate-300 font-bold w-6 text-right text-sm">{idx + 1}</span>
                                        <input
                                            type="text"
                                            value={section}
                                            onChange={(e) => onUpdateSection(idx, e.target.value)}
                                            className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-medium text-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 text-right">
                            <div className="flex items-center gap-2 mb-4 justify-end">
                                <input
                                    type="checkbox"
                                    id="dualMode"
                                    checked={isDualMode}
                                    onChange={(e) => setIsDualMode(e.target.checked)}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <label htmlFor="dualMode" className="text-sm font-medium text-slate-700 cursor-pointer select-none flex items-center gap-1">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded font-bold">New</span>
                                    영문 버전 동시 생성 (Dual Mode)
                                </label>
                            </div>

                            <button
                                onClick={onGenerateFullPost}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-3 ml-auto w-full justify-center"
                            >
                                글 생성하기 <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Draft Preview */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            실시간 구조 미리보기
                        </h2>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto bg-white">
                        <div className="prose prose-slate max-w-none opacity-70">
                            <MarkdownRenderer content={draftPreview} font={selectedFont} />
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 text-center">
                        * 실제 생성될 글의 구조 예시입니다. 내용은 AI가 작성합니다.
                    </div>
                </div>

            </div>
        </div>
    );
};
