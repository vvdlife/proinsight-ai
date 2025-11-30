import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || '';
      setApiKey(key);
    }
  }, [isOpen]);

  const handleUpdateKey = () => {
    if (newKey.startsWith('AIza')) {
        sessionStorage.setItem('proinsight_api_key', newKey);
        setApiKey(newKey);
        setNewKey('');
        alert('API Key가 업데이트되었습니다.');
    } else {
        alert('유효한 API Key를 입력하세요.');
    }
  };

  const handleLogout = () => {
    if (confirm('앱을 잠그고 로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem('proinsight_api_key');
      localStorage.removeItem('proinsight_access_code');
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">설정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">현재 API Key</label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-600 text-sm font-mono flex-1 truncate">
                {apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : '미설정'}
              </span>
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">API Key 변경</label>
             <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="새 API Key 입력"
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <button 
                    onClick={handleUpdateKey}
                    className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900"
                >
                    변경
                </button>
             </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            앱 잠그기 (로그아웃)
          </button>
        </div>
      </div>
    </div>
  );
};