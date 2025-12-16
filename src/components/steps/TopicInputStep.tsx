import React from 'react';
import { SparklesIcon, RefreshIcon, PenIcon, LinkIcon, UploadIcon, TrashIcon, FileTextIcon, PlusIcon, ImageIcon, CodeIcon, TrendIcon, ChartIcon } from '../Icons';
import { TrendAnalysisWidget } from '../TrendAnalysisWidget';
import { ModelSelector } from '../ModelSelector';
import { TrendingTopic, UploadedFile } from '../../types';
import { useBlogContext } from '../../context/BlogContext';

export const TopicInputStep: React.FC = () => {
    const {
        topic, setTopic,
        onGenerateOutline: onGenerate,
        loadingTrends,
        suggestions,
        refreshTrends: onRefreshTrends,
        selectedModel, setSelectedModel: onModelChange,
        sourceUrls, setSourceUrls,
        sourceFiles, setSourceFiles,
        memo, setMemo
    } = useBlogContext();

    const [newUrl, setNewUrl] = React.useState('');

    const onAddUrl = () => {
        if (newUrl.trim()) {
            setSourceUrls([...sourceUrls, newUrl.trim()]);
            setNewUrl('');
        }
    };

    const onRemoveUrl = (index: number) => {
        setSourceUrls(sourceUrls.filter((_, i) => i !== index));
    };

    const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                alert('PDF, JPG, PNG 파일만 업로드 가능합니다.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('파일 크기는 10MB 이하여야 합니다.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64Data = reader.result.split(',')[1];
                    setSourceFiles([...sourceFiles, {
                        name: file.name,
                        mimeType: file.type,
                        data: base64Data
                    }]);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const onRemoveFile = (index: number) => {
        setSourceFiles(sourceFiles.filter((_, i) => i !== index));
    };

    // Icon mapping helper
    const getIconComponent = (iconName: string) => {
        const iconProps = { className: "w-4 h-4" };
        switch (iconName) {
            case 'TrendIcon': return <TrendIcon {...iconProps} />;
            case 'ChartIcon': return <ChartIcon {...iconProps} />;
            case 'CodeIcon': return <CodeIcon {...iconProps} />;
            case 'SparklesIcon': return <SparklesIcon {...iconProps} />;
            default: return <TrendIcon {...iconProps} />;
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                        ProInsight AI
                    </span>
                    <br />
                    어떤 글을 쓰시겠습니까?
                </h1>
                <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                    키워드만 던져주세요. 또는 PDF, 이미지, URL을 제공하면 AI가 정밀 분석하여 전문적인 글을 완성해 드립니다.
                </p>
            </div>

            {/* Input Section */}
            <div className="relative group mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white rounded-xl shadow-xl p-2 flex items-center">
                    <div className="pl-4 text-slate-400">
                        <PenIcon className="w-6 h-6" />
                    </div>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
                        placeholder="예: 2025년 경제 전망, AI가 바꾸는 미래"
                        className="w-full p-4 text-lg outline-none text-slate-800 placeholder:text-slate-300 bg-transparent font-medium"
                    />
                    <button
                        onClick={onGenerate}
                        disabled={!topic.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        시작하기
                        <SparklesIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Smart Trend Analysis Widget */}
            <React.Suspense fallback={null}>
                <TrendAnalysisWidget topic={topic} />
            </React.Suspense>

            {/* ModelSelector */}
            <React.Suspense fallback={<div>Loading...</div>}>
                <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={onModelChange}
                />
            </React.Suspense>

            {/* Source Materials Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-12 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> 참고 자료 추가 (선택)
                </h3>

                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">웹 페이지 (URL)</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                            />
                            <button
                                onClick={onAddUrl}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {sourceUrls.map((url, idx) => (
                                <li key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded text-slate-600">
                                    <span className="truncate flex-1 mr-2">{url}</span>
                                    <button onClick={() => onRemoveUrl(idx)} className="text-red-400 hover:text-red-600">
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* File Upload */}
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-slate-700">파일 업로드 (PDF/이미지)</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="application/pdf, image/*"
                                    onChange={onFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 cursor-pointer transition-colors bg-slate-50/50"
                                >
                                    <UploadIcon className="w-4 h-4" /> 파일 선택 (10MB 이하)
                                </label>
                            </div>
                            <ul className="space-y-2">
                                {sourceFiles.map((file, idx) => (
                                    <li key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded text-slate-600">
                                        <span className="flex items-center gap-2 truncate flex-1 mr-2">
                                            {file.mimeType.includes('image') ? <ImageIcon className="w-3 h-3 text-pink-500" /> : <FileTextIcon className="w-3 h-3 text-blue-500" />}
                                            {file.name}
                                        </span>
                                        <button onClick={() => onRemoveFile(idx)} className="text-red-400 hover:text-red-600">
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100 p-6 mb-12 shadow-sm">
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CodeIcon className="w-4 h-4 text-indigo-600" /> AI 프롬프트 / 컨텍스트 명령 (Markdown, XML, JSON 지원)
                </h3>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder={`XML, JSON, Markdown 등 구조화된 프롬프트를 입력할 수 있습니다.
  예시:
  <instruction>
  <tone>Professional</tone>
  <focus>Data Analysis</focus>
  </instruction>`}
                        className="relative w-full p-4 h-[160px] text-sm border border-indigo-100 rounded-lg outline-none focus:border-indigo-500 resize-none bg-white/80 focus:bg-white transition-colors text-slate-700 leading-relaxed shadow-sm font-mono"
                    />
                </div>
            </div>

            {/* Suggestions Chips */}
            <div className="mb-12">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        🔥 지금 뜨는 주제 추천
                    </p>
                    <button
                        onClick={onRefreshTrends}
                        disabled={loadingTrends}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        title="새로운 주제 추천받기"
                    >
                        <RefreshIcon className={`w-4 h-4 ${loadingTrends ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>
                </div>
                {loadingTrends ? (
                    <div className="flex flex-wrap justify-center gap-3">
                        {[...Array(4)].map((_, idx) => (
                            <div
                                key={idx}
                                className="h-10 w-48 bg-slate-100 rounded-full animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-3">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setTopic(item.text);
                                    // Auto-start outline generation after state update
                                    setTimeout(() => onGenerate(), 100);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium shadow-sm"
                            >
                                {getIconComponent(item.icon)}
                                {item.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Features Info */}
            <div className="grid grid-cols-3 gap-4 text-center border-t border-slate-100 pt-8">
                <div>
                    <div className="font-bold text-slate-800 mb-1">⚡ 1분 완성</div>
                    <div className="text-xs text-slate-400">개요부터 본문까지</div>
                </div>
                <div>
                    <div className="font-bold text-slate-800 mb-1">🎨 고품질 이미지</div>
                    <div className="text-xs text-slate-400">4K 해상도 자동 생성</div>
                </div>
                <div>
                    <div className="font-bold text-slate-800 mb-1">📚 자료 분석</div>
                    <div className="text-xs text-slate-400">PDF/URL/메모 통합 분석</div>
                </div>
            </div>
        </div >
    );
};
