import React from 'react';
import { SparklesIcon } from './Icons';

interface LoadingOverlayProps {
  isLoading: boolean;
  message: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message, progress = 0 }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl border border-indigo-100 flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300">

        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full shadow-lg shadow-indigo-200 animate-bounce-slight">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Text Content */}
        <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">
          AI가 글을 작성하고 있습니다
        </h3>
        <p className="text-slate-500 text-sm font-medium mb-6 text-center animate-pulse">
          {message}
        </p>

        {/* Simple Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.max(5, progress)}%` }}
          ></div>
        </div>
        <div className="w-full text-right">
          <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>

      </div>
    </div>
  );
};