import React, { useState, useEffect } from 'react';

interface AuthGateProps {
  onAuthenticated: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Use process.env directly. Removed import.meta.env to fix type error.
  const REQUIRED_ACCESS_CODE = process.env.ACCESS_CODE;

  useEffect(() => {
    // Check Access Code
    const savedCode = localStorage.getItem('proinsight_access_code');
    const isCodeValid = !REQUIRED_ACCESS_CODE || savedCode === REQUIRED_ACCESS_CODE;

    if (isCodeValid) {
      onAuthenticated();
    }
  }, [onAuthenticated, REQUIRED_ACCESS_CODE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inputValue === REQUIRED_ACCESS_CODE) {
      localStorage.setItem('proinsight_access_code', inputValue);
      onAuthenticated();
    } else {
      setError('액세스 코드가 올바르지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
            🔒
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          ProInsight AI 잠금
        </h1>
        
        <p className="text-slate-500 mb-8">
          이 앱은 비공개로 운영됩니다. 관리자에게 받은 액세스 코드를 입력하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="액세스 코드 입력"
            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            autoFocus
          />
          
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            잠금 해제
          </button>
        </form>
      </div>
    </div>
  );
};