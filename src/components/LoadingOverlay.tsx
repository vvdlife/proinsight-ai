import React from 'react';
import { SparklesIcon } from './Icons';

interface LoadingOverlayProps {
  isLoading: boolean;
  message: string;
  progress?: number; // 0-100
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message, progress }) => {
  if (!isLoading) return null;

  // Calculate estimated time based on progress
  const getEstimatedTime = () => {
    if (!progress || progress === 0) return '약 1-2분 소요 예상';
    if (progress < 30) return '약 1-2분 남음';
    if (progress < 60) return '약 30초-1분 남음';
    if (progress < 90) return '거의 완료되었습니다';
    return '곧 완료됩니다!';
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-indigo-100 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Icon with rotating animation */}
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-20 animate-ping"></div>
          <SparklesIcon className="w-8 h-8 text-indigo-600 animate-pulse relative z-10" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-800 mb-2">AI 작업 중...</h3>

        {/* Current step message */}
        <p className="text-slate-600 mb-1 font-medium">{message}</p>

        {/* Estimated time */}
        <p className="text-xs text-slate-400 mb-6">{getEstimatedTime()}</p>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            {progress !== undefined ? (
              // Determinate progress bar
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            ) : (
              // Indeterminate progress bar
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
            )}
          </div>
        </div>

        {/* Progress percentage */}
        {progress !== undefined && (
          <p className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</p>
        )}

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