import React from 'react';
import { SparklesIcon } from './Icons';

interface LoadingOverlayProps {
  isLoading: boolean;
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-indigo-100 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full mb-6">
            <SparklesIcon className="w-8 h-8 text-indigo-600 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">AI 작업 중...</h3>
        <p className="text-slate-600">{message}</p>
        <div className="mt-6 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
        </div>
        <style>{`
            @keyframes loading {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(200%); }
            }
        `}</style>
      </div>
    </div>
  );
};