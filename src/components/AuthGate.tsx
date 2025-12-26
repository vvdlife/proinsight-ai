import React, { useState, useEffect } from 'react';
import { TrendIcon, ImageIcon, SparklesIcon, ChartIcon, CheckIcon } from './Icons';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Use import.meta.env for Vite environment variables
  const REQUIRED_ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE;

  // Fix scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!REQUIRED_ACCESS_CODE) {
      setError('系统 설정 오류: 관리자 액세스 코드가 설정되지 않았습니다.');
      return;
    }

    const savedCode = localStorage.getItem('proinsight_access_code');
    const isCodeValid = savedCode === REQUIRED_ACCESS_CODE;
    const savedKey =
      sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key');
    const isKeyValid = !!savedKey;

    if (isCodeValid && isKeyValid) {
      onAuthenticated();
    } else if (isCodeValid && !isKeyValid) {
      setStep(1);
    }
  }, [onAuthenticated, REQUIRED_ACCESS_CODE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 0) {
      if (!REQUIRED_ACCESS_CODE) return;
      if (inputValue === REQUIRED_ACCESS_CODE) {
        localStorage.setItem('proinsight_access_code', inputValue);
        setStep(1);
        setInputValue('');
      } else {
        setError('액세스 코드가 올바르지 않습니다.');
      }
    } else {
      if (inputValue.startsWith('AIza') && inputValue.length > 20) {
        sessionStorage.setItem('proinsight_api_key', inputValue);
        onAuthenticated();
      } else {
        setError('유효하지 않은 API Key 형식입니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-pretendard">
      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="ProInsight AI Logo"
              className="w-8 h-8 rounded-lg shadow-sm object-cover"
            />
            <span className="font-bold text-xl text-slate-900 tracking-tight">ProInsight AI</span>
          </div>
          <div className="text-sm font-medium text-slate-500">Professional Analytics Platform</div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              데이터가{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                통찰력
              </span>
              이 되는 순간
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Google Gemini 기반의 강력한 AI 엔진으로 복잡한 데이터를 심층 분석하고, 전문적인 블로그
              포스트와 시각 자료를 단 1분 만에 생성하세요.
            </p>

            <div className="space-y-4 pt-4">
              {[
                '최신 트렌드 실시간 분석 및 반영',
                'SEO 최적화된 고품질 아티클 작성',
                '데이터 시각화 및 4K 이미지 자동 생성',
                '다국어(영문/국문) 동시 지원',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CheckIcon className="w-4 h-4" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Auth Card */}
          <div className="relative">
            {/* Decoration BG */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse"></div>

            <div className="relative bg-white p-8 lg:p-10 rounded-2xl shadow-2xl border border-slate-100">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-4 shadow-lg shadow-indigo-200">
                  {step === 0 ? '🔒' : '🔑'}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {step === 0 ? '플랫폼 접속' : 'API Key 연동'}
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                  {step === 0
                    ? '배포된 액세스 코드로 접속하세요.'
                    : 'Google AI Studio 키를 입력하여 시작합니다.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type={step === 0 ? 'password' : 'text'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={step === 0 ? 'Access Code 입력' : 'AIza...'}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg flex items-center gap-2">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5"
                >
                  {step === 0 ? '접속하기' : 'ProInsight 시작하기'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-400">Secure Access • End-to-End Encryption</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid (Footer area) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 border-t border-slate-100 pt-16">
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <TrendIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Trend Analysis</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              구글 및 소셜 미디어 트렌드를 실시간으로 분석하여 가장 핫한 주제를 제안합니다.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-lg flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Generative Visuals</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              텍스트 내용에 가장 적합한 고해상도 이미지를 AI가 자동으로 생성합니다.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-lg flex items-center justify-center mb-4">
              <ChartIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Data Insight</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              업로드된 PDF 및 문서 데이터를 심층 분석하여 전문가 수준의 인사이트를 도출합니다.
            </p>
          </div>
        </div>

        <footer className="mt-20 text-center text-slate-400 text-sm py-8">
          © 2025 ProInsight AI. All rights reserved.
        </footer>
      </main>
    </div>
  );
};
