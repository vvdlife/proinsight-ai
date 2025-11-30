import React, { useState, useEffect } from 'react';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  // Step 0: Access Code, Step 1: API Key
  const [step, setStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // 환경 변수에서만 액세스 코드를 가져옴 (기본값 제거)
  // Vercel 환경 변수 VITE_ACCESS_CODE가 설정되어 있어야 함
  const REQUIRED_ACCESS_CODE = process.env.ACCESS_CODE;

  useEffect(() => {
    // 1. Check Access Code
    // 환경 변수가 설정되지 않았다면 잠금 기능을 비활성화하거나, 
    // "설정이 필요합니다" 메시지를 띄우는 것이 안전하지만, 
    // 여기서는 코드가 설정되어 있다면 검증하고, 없으면 API Key 단계로 넘어가도록 처리 (혹은 차단)
    // 사용자의 요청: "내가 지정한 비밀번호로 인증". 
    // 즉, ACCESS_CODE가 설정되어야만 진입 가능하게 하거나, 설정된 경우에만 체크.
    
    const savedCode = localStorage.getItem('proinsight_access_code');
    const isCodeValid = !REQUIRED_ACCESS_CODE || savedCode === REQUIRED_ACCESS_CODE;

    // 2. Check API Key
    const savedKey = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key');
    const isKeyValid = !!savedKey;

    if (isCodeValid && isKeyValid) {
      onAuthenticated();
    } else if (isCodeValid && !isKeyValid) {
      setStep(1); 
    } else {
      setStep(0);
    }
  }, [onAuthenticated, REQUIRED_ACCESS_CODE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 0) {
      // Validate Access Code
      if (!REQUIRED_ACCESS_CODE) {
          setError('서버에 액세스 코드가 설정되지 않았습니다.');
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
      // Validate & Save API Key
      if (inputValue.startsWith('AIza') && inputValue.length > 20) {
        sessionStorage.setItem('proinsight_api_key', inputValue);
        // Remove from local storage if it exists there (security preference)
        localStorage.removeItem('proinsight_api_key'); 
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
            ? <>비공개 서비스입니다.<br/>지정된 액세스 코드를 입력하세요.</>
            : '본인의 Gemini API Key를 입력하여 무료로 사용하세요.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type={step === 0 ? "password" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={step === 0 ? "액세스 코드 입력" : "API Key (AIza...)"}
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
                입력하신 키는 서버로 전송되지 않고 브라우저 세션에만 저장됩니다.
                <br />
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">
                    API Key 발급받기
                </a>
            </div>
        )}
      </div>
    </div>
  );
};