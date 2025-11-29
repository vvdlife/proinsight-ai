import React from 'react';
import { AppStep } from '../types';
import { CheckIcon } from './Icons';

interface StepWizardProps {
  currentStep: AppStep;
}

const steps = [
  { id: AppStep.TOPIC_INPUT, label: '주제 선정' },
  { id: AppStep.OUTLINE_REVIEW, label: '개요 검토' },
  { id: AppStep.FINAL_RESULT, label: '글 생성' },
];

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="relative flex justify-between">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0 rounded"></div>
        
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : isCurrent 
                      ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg scale-110' 
                      : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              <span 
                className={`mt-2 text-sm font-medium transition-colors ${
                  isCurrent ? 'text-indigo-800' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};