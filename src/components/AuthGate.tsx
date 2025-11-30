import React, { useState, useEffect } from 'react';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  // Step 0: Access Code, Step 1: API Key
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Use type assertion to handle ImportMeta typing issue
  const REQUIRED_ACCESS_CODE = (import.meta as any).env.VITE_ACCESS_CODE;

  useEffect(() => {
    // 1. Check Access Code
    const savedCode = localStorage.getItem('proinsight_access_code');
    const isCodeValid = !REQUIRED_ACCESS_CODE || savedCode === REQUIRED_ACCESS_CODE;

    // 2. Check API Key
    const savedKey = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key');
    const isKeyValid = !!savedKey;

    if (isCodeValid && isKeyValid) {
      onAuthenticated();
    } else if (isCodeValid && !isKeyValid) {
      setStep(1); // Skip to API Key input if code is already valid
    }
  }, [onAuthenticated, REQUIRED_ACCESS_CODE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 0) {
      // Validate Access Code
      if (!REQUIRED_ACCESS_CODE || inputValue === REQUIRED_ACCESS_CODE) {
        if (REQUIRED_ACCESS_CODE) {
            localStorage.setItem('proinsight_access_code', inputValue);
        }
        setStep(1);
        setInputValue('');
      } else {
        setError('액세스 코드가 올바르지 않습니다.');
      }
    } else {
      // Validate & Save API Key
      if (inputValue.startsWith('AIza') && inputValue.length > 20) {
        sessionStorage.setItem('proinsight_api_key', inputValue);
        onAuthenticated();
      } else {
        setError('유효하지 않은 API Key 형식입니다. AIza로 시작해야 합니다.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 text-center animate-in fade-in zoom-in duration-300">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
            {step === 0 ? '🔒' : '🔑'}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {step === 0 ? 'ProInsight AI 잠금' : 'API Key 입력'}
        </h1>
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          {step === 0 
            ? '비공개 서비스입니다.\n지정된 액세스 코드를 입력하세요.' 
            : 'Google AI Studio에서 발급받은\nGemini API Key를 입력하세요.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type={step === 0 ? "password" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={step === 0 ? "액세스 코드" : "API Key (AIza...)"}
            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            autoFocus
          />
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 0 ? '잠금 해제' : '시작하기'}
          </button>
        </form>

        {step === 1 && (
            <div className="mt-4 text-xs text-slate-400">
                키는 브라우저 세션에만 안전하게 저장됩니다.
            </div>
        )}
      </div>
    </div>
  );
};