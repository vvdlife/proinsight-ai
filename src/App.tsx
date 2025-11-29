import React, { useState, useEffect, useCallback } from 'react';
import { StepWizard } from './components/StepWizard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SparklesIcon, ChevronRightIcon, RefreshIcon, PenIcon, ImageIcon, CopyIcon } from './components/Icons';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { generateOutline, generateBlogPostContent, generateBlogImage } from './services/geminiService';
import { AppStep, BlogTone, OutlineData, BlogPost, LoadingState } from './types';
import { AuthGate } from './components/AuthGate';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App State
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.TOPIC_INPUT);
  const [topic, setTopic] = useState('');
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [selectedTone, setSelectedTone] = useState<BlogTone>(BlogTone.PROFESSIONAL);
  const [finalPost, setFinalPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });

  // Cleanup old local storage data on mount to prevent quota errors
  useEffect(() => {
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

    setLoading({ isLoading: true, message: '블로그 본문을 작성하고 이미지를 생성 중입니다...' });
    try {
      // Run both generations in parallel for efficiency
      const [content, imageUrl] = await Promise.all([
        generateBlogPostContent(outline, selectedTone),
        generateBlogImage(outline.title)
      ]);

      setFinalPost({
        title: outline.title,
        content,
        imageUrl
      });
      setCurrentStep(AppStep.FINAL_RESULT);
    } catch (error) {
      alert('글 작성 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  }, [outline, selectedTone]);

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

  // If not authenticated (Access Code check), show Auth Gate
  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Render Steps
  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.TOPIC_INPUT:
        return (
          <div className="max-w-xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              어떤 글을 쓰고 싶으신가요?
            </h1>
            <p className="text-slate-500 mb-10 text-lg">
              키워드만 입력하세요. 구조 잡기부터 이미지 생성까지 AI가 도와드립니다.
            </p>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white rounded-xl shadow-lg p-2 flex items-center">
                <div className="pl-4 text-slate-400">
                  <PenIcon className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateOutline()}
                  placeholder="예: 초보자를 위한 실내 식물 키우기 팁"
                  className="w-full p-4 text-lg outline-none text-slate-800 placeholder:text-slate-300 bg-transparent"
                />
                <button
                  onClick={handleGenerateOutline}
                  disabled={!topic.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  시작하기
                  <SparklesIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center gap-4 text-sm text-slate-400">
              <span>✨ 자동 개요 생성</span>
              <span>•</span>
              <span>🎨 AI 이미지 제작</span>
              <span>•</span>
              <span>✍️ SEO 최적화 글쓰기</span>
            </div>
          </div>
        );

      case AppStep.OUTLINE_REVIEW:
        return (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Settings */}
              <div className="md:col-span-1 space-y-6">
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
                
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    💡 <strong>팁:</strong> 오른쪽 개요를 수정하면 더 정확한 글이 생성됩니다. 섹션을 추가하거나 불필요한 내용을 삭제해보세요.
                  </p>
                </div>
              </div>

              {/* Right Column: Outline Editor */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-800">개요 편집</h2>
                  <button 
                    onClick={handleReset}
                    className="text-slate-500 hover:text-red-500 text-sm flex items-center gap-1"
                  >
                    <RefreshIcon className="w-4 h-4" /> 처음으로
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">제목</label>
                    <input 
                      type="text" 
                      value={outline?.title || ''}
                      onChange={(e) => outline && setOutline({ ...outline, title: e.target.value })}
                      className="w-full text-xl font-bold text-slate-900 border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-2 transition-colors bg-transparent"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">섹션 구성</label>
                    {outline?.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <span className="text-slate-300 font-bold w-4">{idx + 1}</span>
                        <input
                          type="text"
                          value={section}
                          onChange={(e) => handleUpdateOutlineSection(idx, e.target.value)}
                          className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-200 text-right">
                  <button
                    onClick={handleGenerateFullPost}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2 ml-auto"
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
                <button 
                  onClick={copyToClipboard}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
                >
                    <CopyIcon className="w-4 h-4"/> 복사하기
                </button>
             </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                {finalPost?.imageUrl ? (
                    <div className="w-full h-80 bg-slate-100 overflow-hidden relative group">
                        <img 
                            src={finalPost.imageUrl} 
                            alt={finalPost.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                         <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3 text-yellow-400" /> AI Generated Image
                        </div>
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
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <PenIcon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 tracking-tight">ProInsight AI</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-slate-500 hidden sm:block">
                      Powered by Gemini 2.5
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
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