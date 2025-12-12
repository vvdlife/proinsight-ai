import React, { useEffect, useState } from 'react';
import { SparklesIcon, CheckIcon } from './Icons';

interface LoadingOverlayProps {
  isLoading: boolean;
  message: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message, progress = 0 }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Map progress to steps for better feedback
  useEffect(() => {
    if (progress < 30) setCurrentStep(0);      // Analyzing
    else if (progress < 80) setCurrentStep(1); // Drafting
    else setCurrentStep(2);                    // Polishing
  }, [progress]);

  if (!isLoading) return null;

  const steps = [
    { label: '자료 수집 및 심층 분석', desc: 'Gemini가 문맥을 파악하고 있습니다' },
    { label: '블로그 초안 구조화', desc: '논리적인 흐름을 설계합니다' },
    { label: '콘텐츠 생성 및 최적화', desc: '스타일을 입히고 마무리를 합니다' }
  ];

  return (
    <div className="fixed inset-0 bg-surface-bg/90 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-500">
      <div className="w-full max-w-lg bg-surface p-8 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-full mb-4 ring-4 ring-primary-50/50">
            <SparklesIcon className="w-8 h-8 text-primary-600 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-trust-dark mb-2">AI가 글을 작성하고 있습니다</h3>
          <p className="text-slate-500 text-sm">{message}</p>
        </div>

        {/* Vertical Steps - Fixed Alignment */}
        <div className="relative space-y-8 pl-6 my-8">
          {/* Connecting Line - Aligned to center of 40px circle (20px) + pl-6 (24px) = 44px center. Left: 43px */}
          <div className="absolute left-[43px] top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>

          {steps.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div key={idx} className={`flex items-center gap-5 transition-all duration-500 ${isCurrent ? 'opacity-100 translate-x-0' : isCompleted ? 'opacity-60' : 'opacity-40 translate-x-1'}`}>
                {/* Status Indicator */}
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-[2.5px] transition-colors duration-300 bg-surface z-10 box-border
                  ${isCompleted ? 'border-primary-600 bg-primary-600' : isCurrent ? 'border-primary-600 ring-4 ring-primary-50' : 'border-slate-200'}
                `}>
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 bg-primary-600 rounded-full animate-ping" />
                  ) : (
                    <div className="w-2 h-2 bg-slate-200 rounded-full" />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex-1 pt-0.5">
                  <h4 className={`text-base font-bold leading-none mb-1.5 ${isCurrent ? 'text-primary-700' : 'text-slate-700'}`}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-tight">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar (Bottom) */}
        <div className="mt-8">
          <div className="flex justify-between items-center text-xs font-bold text-primary-600 mb-2">
            <span>진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.max(5, progress)}%` }}
            ></div>
          </div>
        </div>

      </div>
    </div>
  );
};