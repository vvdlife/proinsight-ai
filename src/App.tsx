import React, { useState } from 'react';
import { StepWizard } from './components/StepWizard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RefreshIcon, TrashIcon } from './components/Icons'; // TrashIcon was used as close button or maybe I should use XIcon
import { AppStep } from './types';
import { SettingsModal } from './components/SettingsModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGate } from './components/AuthGate';
import { TopicInputStep } from './components/steps/TopicInputStep';
import { OutlineReviewStep } from './components/steps/OutlineReviewStep';
import { FinalResultStep } from './components/steps/FinalResultStep';
import { useBlogContext } from './context/BlogContext';

const App: React.FC = () => {
  // Global Context
  const {
    currentStep,
    loading,
    resetAll: handleReset,
    history,
    isHistoryOpen,
    setIsHistoryOpen,
    loadFromHistory
  } = useBlogContext();

  // App-Shell State (Auth, Settings)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // If not authenticated, show Auth Gate
  if (!isAuthenticated) {
    return <AuthGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Render Steps
  const renderStepContent = () => {
    switch (currentStep) {
      case AppStep.TOPIC_INPUT:
        return <TopicInputStep />;
      case AppStep.OUTLINE_REVIEW:
        return <OutlineReviewStep />;
      case AppStep.FINAL_RESULT:
        return <FinalResultStep />;
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
                  <TrashIcon className="w-5 h-5 rotate-45" />
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
          <div className="animate-in fade-in duration-500">
            {renderStepContent()}
          </div>
        </main>
      </div >
    </ErrorBoundary >
  );
};

export default App;
