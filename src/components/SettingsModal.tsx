
import React, { useState, useEffect } from 'react';
import { NaverIcon, TistoryIcon, MediumIcon, WordPressIcon, SubstackIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  // Multi-platform URL state
  const [blogUrls, setBlogUrls] = useState<{ [key: string]: string }>({
    NAVER: '',
    TISTORY: '',
    MEDIUM: '',
    WORDPRESS: '',
    SUBSTACK: ''
  });
  const [apiKey, setApiKey] = useState('');
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load saved URLs
      try {
        const savedUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
        setBlogUrls(prev => ({ ...prev, ...savedUrls }));
      } catch (e) {
        console.error('Failed to parse blog URLs', e);
      }

      // Load API Key (Session -> Local -> Env)
      const key = sessionStorage.getItem('proinsight_api_key') || localStorage.getItem('proinsight_api_key') || '';
      setApiKey(key);
    }
  }, [isOpen]);

  const handleUrlChange = (platform: string, value: string) => {
    setBlogUrls(prev => ({ ...prev, [platform]: value }));
  };

  const handleSaveUrls = () => {
      localStorage.setItem('proinsight_blog_urls', JSON.stringify(blogUrls));
      alert('블로그 주소들이 저장되었습니다.');
  };

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
      // Optional: Clear Access Code too if you want full lockout
      // localStorage.removeItem('proinsight_access_code'); 
      window.location.reload();
    }
  };

  const platforms = [
    { id: 'NAVER', name: '네이버 블로그', icon: <NaverIcon className="w-5 h-5 text-[#03C75A]" /> },
    { id: 'TISTORY', name: '티스토리', icon: <TistoryIcon className="w-5 h-5 text-[#F44F05]" /> },
    { id: 'MEDIUM', name: 'Medium', icon: <MediumIcon className="w-5 h-5" /> },
    { id: 'WORDPRESS', name: 'WordPress', icon: <WordPressIcon className="w-5 h-5 text-[#21759B]" /> },
    { id: 'SUBSTACK', name: 'Substack', icon: <SubstackIcon className="w-5 h-5 text-[#FF6719]" /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-800">설정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto">
          {/* API Key Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">API Key 관리</h3>
            <div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-600 text-sm font-mono flex-1 truncate">
                    {apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : '미설정'}
                </span>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="새 API Key (AIza...)"
                        className="flex-1 p-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                    <button 
                        onClick={handleUpdateKey}
                        className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 font-medium"
                    >
                        변경
                    </button>
                </div>
            </div>
          </div>

          {/* Blog URL Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">블로그 주소 관리</h3>
            <p className="text-xs text-slate-500 mb-4">
                SNS 홍보글 생성 시, 아래 저장된 주소 중 하나가 자동으로 삽입됩니다. (우선순위: 네이버 {'>'} 티스토리...)
            </p>
            
            <div className="space-y-3">
                {platforms.map(platform => (
                    <div key={platform.id}>
                        <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-2">
                            {platform.icon} {platform.name}
                        </label>
                        <input 
                            type="text" 
                            value={blogUrls[platform.id]}
                            onChange={(e) => handleUrlChange(platform.id, e.target.value)}
                            placeholder={`https://...`}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition-colors"
                        />
                    </div>
                ))}
            </div>
            
            <button 
                onClick={handleSaveUrls}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
            >
                주소 일괄 저장
            </button>
          </div>

          {/* Logout Section */}
          <div className="pt-6 border-t border-slate-100">
            <button
                onClick={handleLogout}
                className="w-full py-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
                🔒 앱 잠그기 (로그아웃)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
