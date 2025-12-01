
import React, { useState, useEffect } from 'react';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Use import.meta.env for Vite
  const REQUIRED_ACCESS_CODE = (import.meta as any).env.VITE_ACCESS_CODE;

  useEffect(() => {
    // If no access code is set in environment, block everything (Strict Mode)
    if (!REQUIRED_ACCESS_CODE) {
        setError('시스템 설정 오류: 관리자 액세스 코드가 설정되지 않았습니다. (VITE_ACCESS_CODE)');
        return;
    }

    const savedCode = localStorage.getItem('proinsight_access_code');
    const isCodeValid = savedCode === REQUIRED_ACCESS_CODE;

    const savedKey = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key');
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
      if (!REQUIRED_ACCESS_CODE) {
          setError('환경 변수 설정이 필요합니다.');
          return;
      }
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
            {step === 0 ? '🔒' : '🔑'}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {step === 0 ? 'ProInsight AI 잠금' : 'API Key 입력'}
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {step === 0 ? '액세스 코드를 입력하세요.' : 'Gemini API Key를 입력하세요.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type={step === 0 ? "password" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={step === 0 ? "Access Code" : "API Key (AIza...)"}
            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button type="submit" disabled={!inputValue.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
            {step === 0 ? '잠금 해제' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
};
