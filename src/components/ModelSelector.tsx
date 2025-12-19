import React from 'react';
import { ModelType } from '../types';

interface ModelSelectorProps {
    selectedModel: ModelType;
    onModelChange: (model: ModelType) => void;
}

interface ModelInfo {
    id: ModelType;
    name: string;
    description: string;
    speed: string;
    quality: string;
    cost: string;
    badge?: string;
}

const MODELS: ModelInfo[] = [
    {
        id: ModelType.PRO_3_0,
        name: 'Gemini 3.0 Pro',
        description: '최신 3.0 엔진, 최고 성능 (Main)',
        speed: '보통',
        quality: 'SOTA',
        cost: '높음',
        badge: '👑 BEST'
    },
    {
        id: ModelType.FLASH_3_0,
        name: 'Gemini 3.0 Flash',
        description: '3.0 기반 초고속 모델 (Light)',
        speed: '매우 빠름',
        quality: '매우 높음',
        cost: '낮음',
        badge: '⚡ NEW'
    }
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 모델 선택
                </h3>
                <p className="text-purple-100 text-sm mt-1">용도에 맞는 Gemini 모델을 선택하세요</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MODELS.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => onModelChange(model.id)}
                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${selectedModel === model.id
                                ? 'border-purple-500 bg-purple-50 shadow-lg'
                                : 'border-slate-200 hover:border-purple-300 hover:shadow-md'
                                }`}
                        >
                            {/* Badge */}
                            {model.badge && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                    {model.badge}
                                </div>
                            )}

                            {/* Model Name */}
                            <div className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                {selectedModel === model.id && (
                                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {model.name}
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-600 mb-3">{model.description}</p>

                            {/* Stats */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">속도:</span>
                                    <span className="font-medium text-slate-700">{model.speed}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">품질:</span>
                                    <span className="font-medium text-slate-700">{model.quality}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">비용:</span>
                                    <span className="font-medium text-slate-700">{model.cost}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Info Note */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-xs text-blue-700">
                            <div className="font-semibold mb-1">💡 모델 선택 가이드</div>
                            <ul className="space-y-1 ml-2">
                                <li>• <strong>3.0 Pro</strong>: 최고 성능, 복잡한 추론 및 전문적인 글쓰기 (SOTA)</li>
                                <li>• <strong>3.0 Flash</strong>: 빠르고 효율적인 블로그 생성 (기본 권장)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
