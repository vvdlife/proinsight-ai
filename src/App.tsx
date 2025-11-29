import React, { useState, useCallback } from 'react';
import { StepWizard } from './components/StepWizard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SparklesIcon, ChevronRightIcon, RefreshIcon, PenIcon, ImageIcon, CopyIcon, TrendIcon, ChartIcon, CodeIcon } from './components/Icons';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { generateOutline, generateBlogPostContent, generateBlogImage, generateSocialPosts } from './services/geminiService';
import { AppStep, BlogTone, OutlineData, BlogPost, LoadingState, ImageStyle } from './types';
import { AuthGate } from './components/AuthGate';
import { SettingsModal } from './components/SettingsModal';
import { SocialGenerator } from './components/SocialGenerator';
import { ExportManager } from './components/ExportManager';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TOPIC_INPUT);
  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [selectedTone, setSelectedTone] = useState<BlogTone>(BlogTone.PROFESSIONAL);
  const [selectedImageStyle, setSelectedImageStyle] = useState<ImageStyle>(ImageStyle.PHOTOREALISTIC);
  const [finalPost, setFinalPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });

  // Cleanup old local storage data on mount
  React.useEffect(() => {
    const keysToRemove = [
      'blogflow_autosave_draft', 
      'blogflow_history', 
      'proinsight_autosave_draft', 
      'proinsight_history'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);

  // Handlers
  const handleGenerateOutline = useCallback(async () => {
    if (!topic.trim()) return;
    
    setLoading({ isLoading: true, message: 'Gemini가 주제를 분석하고 개요를 작성하고 있습니다...' });
    try {
      const data = await generateOutline(topic);
      setOutline(data);
      setCurrentStep(AppStep.OUTLINE_REVIEW);
    } catch (error) {
      alert('개요 생성에 실패했습니다. API Key를 확인하거나 다시 시도해주세요.');
      console.error(error);
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  }, [topic]);

  const handleUpdateOutlineSection = (index: number, value: string) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    newSections[index] = value;
    setOutline({ ...outline, sections: newSections });
  };

  const handleGenerateFullPost = useCallback(async () => {
    if (!outline) return;

    setLoading({ isLoading: true, message: '블로그 본문과 이미지를 생성 중입니다...' });
    try {
      // 1. Generate Content and Image in parallel
      const [content, imageUrl] = await Promise.all([
        generateBlogPostContent(outline, selectedTone),
        generateBlogImage(outline.title, selectedImageStyle)
      ]);

      // 2. Generate Social Posts
      const summary = content.substring(0, 500);
      const socialPosts = await generateSocialPosts(outline.title, summary);

      setFinalPost({
        title: outline.title,
        content,
        images: imageUrl ? [imageUrl] : [],
        socialPosts
      });
      setCurrentStep(AppStep.FINAL_RESULT);
    } catch (error) {
      alert('글 작성 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  }, [outline, selectedTone, selectedImageStyle]);

  const handleReset = () => {
    setCurrentStep(AppStep.TOPIC_INPUT);
    setTopic('');
    setOutline(null);
    setFinalPost(null);
  };

  const copyToClipboard = () => {
     if(!finalPost) return;
     const textToCopy = `# ${finalPost.title}\n\n${finalPost.content}`;
     navigator.clipboard.writeText(textToCopy);
     alert("클립보드에 복사되었습니다!");
  };

  // Quick suggestions
  const suggestions = [
    { icon: <TrendIcon className="w-4 h-4" />, text: "2025년 AI 기술 트렌드 분석" },
    { icon: <ChartIcon className="w-4 h-4" />, text: "미국 연준 금리 인하와 증시 전망" },
    { icon: <CodeIcon className="w-4 h-4" />, text: "생산성을 높이는 노션 활용법" },
    { icon: <TrendIcon className="w-4 h-4" />, text: "지속 가능한 친환경 에너지 기술" },
  ];

  // If not authenticated, show Auth Gate
  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Render Steps
  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.TOPIC_INPUT:
        return (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                  ProInsight AI
                </span>
                <br />
                어떤 글을 쓰시겠습니까?
              </h1>
              <p className="text-slate-500 text-lg max-w-lg mx-auto leading-relaxed">
                키워드만 던져주세요. 심층 분석 개요, 고품질 이미지, SNS 홍보글까지 
                AI가 단 1분 만에 완성해 드립니다.
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
            
            {/* Suggestions Chips */}
            <div className="mb-12">
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                🔥 지금 뜨는 주제 추천
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTopic(item.text)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-sm font-medium shadow-sm"
                  >
                    {item.icon}
                    {item.text}
                  </button>
                ))}
              </div>
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
                 <div className="font-bold text-slate-800 mb-1">📱 SNS 홍보</div>
                 <div className="text-xs text-slate-400">인스타/링크드인용</div>
              </div>
            </div>
          </div>
        );

      case AppStep.OUTLINE_REVIEW:
        return (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left Column: Settings */}
              <div className="md:col-span-4 space-y-6">
                
                {/* Tone Selector */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">A</span>
                    글의 톤앤매너
                  </h3>
                  <div className="space-y-2">
                    {Object.values(BlogTone).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedTone === tone
                            ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                            : 'bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Style Selector */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-sm">🎨</span>
                    이미지 스타일
                  </h3>
                  <div className="space-y-2">
                    {Object.values(ImageStyle).map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedImageStyle(style)}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          selectedImageStyle === style
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

              {/* Right Column: Outline Editor */}
              <div className="md:col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-800">개요 편집</h2>
                  <button 
                    onClick={handleReset}
                    className="text-slate-500 hover:text-red-500 text-sm flex items-center gap-1 font-medium"
                  >
                    <RefreshIcon className="w-4 h-4" /> 처음으로
                  </button>
                </div>
                
                <div className="p-8 space-y-6 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">제목</label>
                    <input 
                      type="text" 
                      value={outline?.title || ''}
                      onChange={(e) => outline && setOutline({ ...outline, title: e.target.value })}
                      className="w-full text-2xl font-bold text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-2 transition-colors bg-transparent leading-tight"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">섹션 구성</label>
                    {outline?.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-4 group">
                        <span className="text-slate-300 font-bold w-6 text-right text-lg">{idx + 1}</span>
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => handleUpdateOutlineSection(idx, e.target.value)}
                          className="flex-1 p-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700 font-medium"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 text-right">
                  <button
                    onClick={handleGenerateFullPost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-3 ml-auto"
                  >
                    글 생성하기 <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case AppStep.FINAL_RESULT:
        return (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
             <div className="flex justify-between items-center mb-6">
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm flex items-center gap-2"
                >
                    <RefreshIcon className="w-4 h-4" /> 새 글 쓰기
                </button>
             </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                {/* Image Section */}
                {finalPost?.images && finalPost.images.length > 0 ? (
                    <div className="w-full bg-slate-100">
                      {finalPost.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img 
                              src={img} 
                              alt={`${finalPost.title} - ${idx + 1}`} 
                              className="w-full h-auto max-h-[500px] object-cover"
                          />
                          <a 
                            href={img} 
                            download={`proinsight-image-${idx+1}.png`}
                            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <CopyIcon className="w-4 h-4" /> 이미지 다운로드
                          </a>
                        </div>
                      ))}
                    </div>
                ) : (
                    <div className="w-full h-48 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-b">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50"/>
                        <span>이미지를 생성하지 못했습니다</span>
                    </div>
                )}
                
                <div className="p-10 md:p-14">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
                        {finalPost?.title}
                    </h1>
                    
                    <div className="prose prose-lg prose-indigo max-w-none text-slate-700">
                        {finalPost?.content && <MarkdownRenderer content={finalPost.content} />}
                    </div>
                </div>
            </div>
            
            {/* Export Manager (Naver/Tistory Copy) */}
            {finalPost && <ExportManager post={finalPost} />}
            
            {/* Social Generator Section */}
            {finalPost?.socialPosts && <SocialGenerator posts={finalPost.socialPosts} />}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        <LoadingOverlay isLoading={loading.isLoading} message={loading.message} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <button onClick={handleReset} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <PenIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">ProInsight AI</span>
                </button>
                <div className="flex items-center gap-4">
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-12">
            {/* Steps Indicator */}
            <StepWizard currentStep={currentStep} />
            
            {/* Step Views */}
            {renderStepContent()}
        </main>
    </div>
  );
};

export default App;