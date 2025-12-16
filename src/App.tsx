import React, { useState, useCallback, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SparklesIcon, ChevronRightIcon, RefreshIcon, PenIcon, ImageIcon, CopyIcon, TrendIcon, ChartIcon, CodeIcon, LinkIcon, UploadIcon, TrashIcon, FileTextIcon, PlusIcon, MemoIcon } from './components/Icons';
import { generateOutline, generateBlogPostContent, generateBlogImage, generateSocialPosts } from './services/geminiService';
import { AppStep, BlogTone, OutlineData, BlogPost, LoadingState, ImageStyle, UploadedFile, BlogFont, ModelType, TrendingTopic } from './types';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGate } from './components/AuthGate';
import { getApiUsageStats } from './services/apiUsageTracker';
import { getTrendingTopics, clearTrendingCache } from './services/trendingService';

// Lazy Load Heavy Components
const MarkdownRenderer = React.lazy(() => import('./components/MarkdownRenderer').then(module => ({ default: module.MarkdownRenderer })));
const SocialGenerator = React.lazy(() => import('./components/SocialGenerator').then(module => ({ default: module.SocialGenerator })));
const ExportManager = React.lazy(() => import('./components/ExportManager').then(module => ({ default: module.ExportManager })));
const PublishingManager = React.lazy(() => import('./components/PublishingManager').then(module => ({ default: module.PublishingManager })));
const ApiUsageMonitor = React.lazy(() => import('./components/ApiUsageMonitor').then(module => ({ default: module.ApiUsageMonitor })));
const ModelSelector = React.lazy(() => import('./components/ModelSelector').then(module => ({ default: module.ModelSelector })));
const TrendAnalysisWidget = React.lazy(() => import('./components/TrendAnalysisWidget').then(module => ({ default: module.TrendAnalysisWidget })));
import { SeoAnalyzer } from './components/SeoAnalyzer';
import { ThumbnailEditor } from './components/ThumbnailEditor';


const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showApiMonitor, setShowApiMonitor] = useState(false);

  // App State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TOPIC_INPUT);
  const [topic, setTopic] = useState('');

  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [selectedTone, setSelectedTone] = useState<BlogTone>(BlogTone.PROFESSIONAL);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyle>(ImageStyle.PHOTOREALISTIC);
  const [selectedFont, setSelectedFont] = useState<BlogFont>(BlogFont.PRETENDARD);
  const [finalPost, setFinalPost] = useState<BlogPost | null>(null);
  const [finalPostEn, setFinalPostEn] = useState<BlogPost | null>(null); // English Version
  const [activeLang, setActiveLang] = useState<'ko' | 'en'>('ko'); // Tab
  const [isDualMode, setIsDualMode] = useState(false); // Checkbox
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '', progress: 0 });
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH_2_5);

  // Source Material State
  const [sourceUrls, setSourceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [sourceFiles, setSourceFiles] = useState<UploadedFile[]>([]);
  const [memo, setMemo] = useState('');

  // Trending Topics State
  const [suggestions, setSuggestions] = useState<TrendingTopic[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);

  // Cleanup old local storage data on mount - REMOVED to persist history
  // useEffect(() => {
  //   const keysToRemove = [
  //     'blogflow_autosave_draft',
  //     'blogflow_history',
  //     'proinsight_autosave_draft',
  //     'proinsight_history'
  //   ];
  //   keysToRemove.forEach(key => localStorage.removeItem(key));
  // }, []);

  // History State
  const [history, setHistory] = useState<{ id: string, date: string, topic: string, finalPost: BlogPost, outline: OutlineData }[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load History on Mount
  useEffect(() => {
    const saved = localStorage.getItem('proinsight_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save to History when finalPost changes
  useEffect(() => {
    if (finalPost && outline) {
      const newItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        topic: outline.title,
        finalPost,
        outline
      };

      setHistory(prev => {
        // Avoid duplicates (simple check by topic + content length)
        const exists = prev.find(p => p.topic === newItem.topic && p.finalPost.content.length === newItem.finalPost.content.length);
        if (exists) return prev;

        const updated = [newItem, ...prev].slice(0, 5); // Reduce to 5 items to save space

        try {
          localStorage.setItem('proinsight_history', JSON.stringify(updated));
        } catch (e) {
          console.warn("LocalStorage Quota Exceeded. Attempting to save without heavy images...");
          // Fallback: Remove images from all items to recover space
          const safeHistory = updated.map(item => ({
            ...item,
            finalPost: { ...item.finalPost, images: [] }
          }));
          try {
            localStorage.setItem('proinsight_history', JSON.stringify(safeHistory));
          } catch (retryError) {
            console.error("Failed to save history even after compression", retryError);
          }
        }
        return updated;
      });
    }
  }, [finalPost, outline]);

  const loadFromHistory = (item: any) => {
    setOutline(item.outline);
    setFinalPost(item.finalPost);
    setCurrentStep(AppStep.FINAL_RESULT);
    setIsHistoryOpen(false);
  };


  // Load trending topics on mount
  useEffect(() => {
    loadTrendingTopics();
  }, []);

  // Load trending topics function (can be called manually)
  const loadTrendingTopics = async () => {
    setLoadingTrends(true);
    try {
      const topics = await getTrendingTopics();
      setSuggestions(topics);
    } catch (error) {
      console.error('Failed to load trending topics:', error);
      // Fallback topics are already handled in the service
    } finally {
      setLoadingTrends(false);
    }
  };

  // Manually refresh trending topics (ignores cache)
  const handleRefreshTrends = async () => {
    clearTrendingCache();
    await loadTrendingTopics();
  };

  // Check API Key Helper
  const hasApiKey = () => {
    return !!(sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || (import.meta as any).env.VITE_API_KEY);
  };

  // Handlers for Sources
  const handleAddUrl = () => {
    if (newUrl.trim()) {
      setSourceUrls([...sourceUrls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setSourceUrls(sourceUrls.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Allow PDF and Images
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('PDF, JPG, PNG 파일만 업로드 가능합니다.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Extract base64 part
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

  const handleRemoveFile = (index: number) => {
    setSourceFiles(sourceFiles.filter((_, i) => i !== index));
  };

  // Handlers
  const handleGenerateOutline = useCallback(async () => {
    // 1. API Key Validation
    if (!hasApiKey()) {
      alert("⚠️ API Key가 설정되지 않았습니다.\n설정 창에서 키를 먼저 등록해주세요.");
      setIsSettingsOpen(true);
      return;
    }

    if (!topic.trim()) return;

    setLoading({ isLoading: true, message: 'Gemini가 자료를 분석하고 개요를 작성하고 있습니다...', progress: 50 });
    try {
      // Pass memo to generateOutline
      const data = await generateOutline(topic, sourceFiles, sourceUrls, memo);
      setOutline(data);
      setCurrentStep(AppStep.OUTLINE_REVIEW);
    } catch (error: any) {
      console.error(error);
      const msg = error?.message || '';
      if (msg.includes('API Key')) {
        alert("API Key 오류입니다. 키를 확인해주세요.");
        setIsSettingsOpen(true);
      } else {
        alert(`개요 생성 실패: ${msg}\n다시 시도해주세요.`);
      }
    } finally {
      setLoading({ isLoading: false, message: '', progress: 0 });
    }
  }, [topic, sourceFiles, sourceUrls, memo]);

  const handleUpdateOutlineSection = (index: number, value: string) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[index] = value;
    setOutline({ ...outline, sections: newSections });
  };

  const handleGenerateFullPost = useCallback(async () => {
    // 1. API Key Validation
    if (!hasApiKey()) {
      alert("⚠️ API Key가 설정되지 않았습니다.\n설정 창에서 키를 먼저 등록해주세요.");
      setIsSettingsOpen(true);
      return;
    }

    if (!outline) return;

    setLoading({ isLoading: true, message: '블로그 본문을 작성하고 있습니다...', progress: 10 });
    try {
      // 1. Generate Content and Image in parallel
      setLoading({ isLoading: true, message: '블로그 본문을 작성하고 있습니다...', progress: 30 });

      const contentPromise = generateBlogPostContent(outline, selectedTone, sourceFiles, sourceUrls, memo, 'Korean');
      const imagePromise = (async () => {
        setLoading({ isLoading: true, message: '썸네일 이미지를 생성하고 있습니다...', progress: 60 });
        return await generateBlogImage(outline.title, selectedImageStyle);
      })();

      // Dual Mode: Generate English content if enabled
      let contentEnPromise: Promise<{ content: string; title: string }> = Promise.resolve({ content: '', title: '' });
      if (isDualMode) {
        contentEnPromise = generateBlogPostContent(outline, selectedTone, sourceFiles, sourceUrls, memo, 'English');
      }

      const [postData, imageUrl, postDataEn] = await Promise.all([
        contentPromise,
        imagePromise,
        contentEnPromise
      ]);

      // 2. Generate Social Posts (Based on Korean content)
      setLoading({ isLoading: true, message: '소셜 미디어 포스트를 생성하고 있습니다...', progress: 85 });
      const summary = postData.content.substring(0, 500);
      const socialPosts = await generateSocialPosts(outline.title, summary, selectedImageStyle);

      setFinalPost({
        title: postData.title,
        content: postData.content,
        images: imageUrl ? [imageUrl] : [],
        socialPosts
      });

      if (isDualMode && postDataEn.content) {
        setFinalPostEn({
          title: postDataEn.title, // Use the translated title from AI
          content: postDataEn.content,
          images: imageUrl ? [imageUrl] : [], // Share same image
          socialPosts: []
        });
      } else {
        setFinalPostEn(null);
      }
      setActiveLang('ko');
      setCurrentStep(AppStep.FINAL_RESULT);
    } catch (error: any) {
      console.error(error);
      alert(`글 작성 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setLoading({ isLoading: false, message: '', progress: 0 });
    }
  }, [outline, selectedTone, selectedImageStyle, sourceFiles, sourceUrls, memo, isDualMode]);

  const handleReset = () => {
    setCurrentStep(AppStep.TOPIC_INPUT);
    setTopic('');
    setOutline(null);
    setFinalPost(null);
    setSourceFiles([]);
    setSourceUrls([]);
    setMemo('');
  };

  const copyToClipboard = () => {
    if (!finalPost) return;
    const textToCopy = `# ${finalPost.title}\n\n${finalPost.content}`;
    navigator.clipboard.writeText(textToCopy);
    alert("클립보드에 복사되었습니다!");
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

  // Generate Draft Preview content based on outline
  const getDraftPreview = () => {
    if (!outline) return "";
    let draft = `# ${outline.title}\n\n> 이 글은 **${selectedTone}** 톤으로 작성될 예정입니다.\n\n`;
    outline.sections.forEach((section, idx) => {
      draft += `## ${idx + 1}. ${section}\n(이 섹션에 대한 상세 내용이 여기에 생성됩니다. 관련 데이터와 예시가 포함될 수 있습니다.)\n\n`;
    });
    draft += `## ⚡ 3줄 요약\n- 핵심 포인트 1\n- 핵심 포인트 2\n- 핵심 포인트 3\n`;
    return draft;
  };

  // If not authenticated, show Auth Gate
  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Render Steps
  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.TOPIC_INPUT:
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
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateOutline()}
                  placeholder="예: 2025년 경제 전망, AI가 바꾸는 미래"
                  className="w-full p-4 text-lg outline-none text-slate-800 placeholder:text-slate-300 bg-transparent font-medium"
                />
                <button
                  onClick={handleGenerateOutline}
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
                onModelChange={setSelectedModel}
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
                      onClick={handleAddUrl}
                      className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {sourceUrls.map((url, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded text-slate-600">
                        <span className="truncate flex-1 mr-2">{url}</span>
                        <button onClick={() => handleRemoveUrl(idx)} className="text-red-400 hover:text-red-600">
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
                        onChange={handleFileUpload}
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
                          <button onClick={() => handleRemoveFile(idx)} className="text-red-400 hover:text-red-600">
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Memo Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">직접 입력 (메모)</label>
                    <div className="relative">
                      <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="핵심 키워드, 포함할 내용, 혹은 나만의 아이디어를 자유롭게 적어주세요."
                        className="w-full p-3 h-[100px] text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 resize-none bg-slate-50 focus:bg-white transition-colors"
                      />

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions Chips */}
            <div className="mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  🔥 지금 뜨는 주제 추천
                </p>
                <button
                  onClick={handleRefreshTrends}
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
                        setTimeout(() => handleGenerateOutline(), 100);
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

      case AppStep.OUTLINE_REVIEW:
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
                        <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-xs">🎨</span>
                        이미지 스타일
                      </h3>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.values(ImageStyle).map((style) => (
                          <button
                            key={style}
                            onClick={() => setSelectedImageStyle(style)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedImageStyle === style
                              ? 'bg-pink-50 border-2 border-pink-500 text-pink-700'
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
                      onClick={handleReset}
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
                            onChange={(e) => handleUpdateOutlineSection(idx, e.target.value)}
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
                      onClick={handleGenerateFullPost}
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
                    <MarkdownRenderer content={getDraftPreview()} font={selectedFont} />
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 text-center">
                  * 실제 생성될 글의 구조 예시입니다. 내용은 AI가 작성합니다.
                </div>
              </div>

            </div>
          </div>
        );

      case AppStep.FINAL_RESULT:
        return (
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" /> 새 글 쓰기
              </button>

              {/* Font Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">글꼴:</span>
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value as BlogFont)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500"
                >
                  {Object.values(BlogFont).map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={copyToClipboard}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
              >
                <CopyIcon className="w-4 h-4" /> 복사하기
              </button>
            </div>

            {/* Tabs for Dual Mode */}
            {finalPostEn && (
              <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
                  <button
                    onClick={() => setActiveLang('ko')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeLang === 'ko'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    🇰🇷 한국어 (Korean)
                  </button>
                  <button
                    onClick={() => setActiveLang('en')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeLang === 'en'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-50'
                      }`}
                  >
                    🇺🇸 English (Global)
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 왼쪽: 본문 영역 (2/3 차지) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                  <div className="p-10 md:p-14">
                    <h1 className={`text-4xl font-extrabold text-slate-900 mb-8 leading-tight`}>
                      {activeLang === 'ko' ? finalPost?.title : finalPostEn?.title}
                    </h1>
                    <MarkdownRenderer
                      content={activeLang === 'ko' ? (finalPost?.content || '') : (finalPostEn?.content || '')}
                      font={selectedFont}
                    />
                  </div>
                </div>

                {/* 소셜 포스트 */}
                {activeLang === 'ko' && finalPost?.socialPosts && <SocialGenerator posts={finalPost.socialPosts} />}

                <div className="mt-8 border-t border-slate-100 pt-8">
                  {(activeLang === 'ko' ? finalPost : finalPostEn) && (
                    <ExportManager post={activeLang === 'ko' ? finalPost! : finalPostEn!} />
                  )}
                  {(activeLang === 'ko' ? finalPost : finalPostEn) && (
                    <PublishingManager
                      post={activeLang === 'ko' ? finalPost! : finalPostEn!}
                      isAuthenticated={isAuthenticated}
                    />
                  )}
                </div>
              </div>

              {/* 오른쪽: 사이드바 영역 (1/3 차지) */}
              <div className="space-y-6">

                {/* [NEW] 1. SEO 분석기 */}
                <SeoAnalyzer
                  title={activeLang === 'ko' ? finalPost?.title || '' : finalPostEn?.title || ''}
                  content={activeLang === 'ko' ? finalPost?.content || '' : finalPostEn?.content || ''}
                  keyword={topic} // 검색했던 주제를 키워드로 간주
                />

                {/* [NEW] 2. 썸네일 에디터 */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    🎨 썸네일 편집 (BETA)
                  </h3>
                  {finalPost?.images && finalPost.images.length > 0 ? (
                    <ThumbnailEditor
                      originalImage={finalPost.images[0]}
                      defaultText={finalPost.title}
                    />
                  ) : (
                    <div className="text-center text-slate-400 py-10 bg-slate-50 rounded-lg">
                      이미지가 없습니다.
                    </div>
                  )}
                </div>

                {/* API 사용량 */}
                <React.Suspense fallback={<div>Loading...</div>}>
                  <ApiUsageMonitor usage={getApiUsageStats()} />
                </React.Suspense>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8FAFC]">
        <LoadingOverlay isLoading={loading.isLoading} message={loading.message} progress={loading.progress} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <button onClick={handleReset} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none">
              <img src="/icon-192.png" alt="ProInsight AI" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
              <span className="font-bold text-xl text-slate-900 tracking-tight">ProInsight AI</span>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1"
                title="히스토리"
              >
                <RefreshIcon className="w-5 h-5" />
                <span className="text-xs font-bold hidden md:inline">History</span>
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                title="설정"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
        </header>

        {/* History Drawer */}
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)}></div>
            <div className="relative w-80 bg-white shadow-2xl h-full p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg text-slate-800">🕒 작업 히스토리</h2>
                <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <TrashIcon className="w-5 h-5 rotate-45" /> {/* Use X icon if available or rotate trash/plus */}
                </button>
              </div>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-10">
                    저장된 작업이 없습니다.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} onClick={() => loadFromHistory(item)} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500 cursor-pointer transition-all group">
                      <div className="text-xs text-indigo-600 font-bold mb-1">{item.date}</div>
                      <div className="font-bold text-slate-800 text-sm line-clamp-2 mb-2">{item.topic}</div>
                      <div className="text-xs text-slate-400 group-hover:text-indigo-500">클릭하여 불러오기 →</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          {/* Steps Indicator */}
          <StepWizard currentStep={currentStep} />

          {/* Step Views */}
          <React.Suspense fallback={<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
            {renderStepContent()}
          </React.Suspense>
        </main>
      </div >
    </ErrorBoundary >
  );
};

export default App;
