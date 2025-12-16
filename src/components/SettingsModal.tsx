
import React, { useState, useEffect } from 'react';
import { NaverIcon, TistoryIcon, MediumIcon, WordPressIcon, SubstackIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [customPersona, setCustomPersona] = useState(''); // [NEW] 커스텀 페르소나 상태

  // Multi-platform URL state
  const [blogUrls, setBlogUrls] = useState<{ [key: string]: string }>({
    NAVER: '',
    TISTORY: '',
    MEDIUM: '',
    WORDPRESS: '',
    SUBSTACK: ''
  });

  useEffect(() => {
    if (isOpen) {
      // API Key 로드
      const key = localStorage.getItem('proinsight_api_key') || sessionStorage.getItem('proinsight_api_key') || '';
      setApiKey(key);

      // [NEW] 커스텀 페르소나 로드
      const savedPersona = localStorage.getItem('proinsight_custom_persona') || '';
      setCustomPersona(savedPersona);

      // Load saved URLs
      try {
        const savedUrls = JSON.parse(localStorage.getItem('proinsight_blog_urls') || '{}');
        setBlogUrls(prev => ({ ...prev, ...savedUrls }));
      } catch (e) {
        console.error('Failed to parse blog URLs', e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey) {
      localStorage.setItem('proinsight_api_key', apiKey);
    }
    // [NEW] 커스텀 페르소나 저장
    localStorage.setItem('proinsight_custom_persona', customPersona);

    // Blog URLs 저장
    localStorage.setItem('proinsight_blog_urls', JSON.stringify(blogUrls));

    alert('설정이 저장되었습니다.');
    onClose();
  };

  const handleUrlChange = (platform: string, value: string) => {
    setBlogUrls(prev => ({ ...prev, [platform]: value }));
  };

  const handleLogout = () => {
    if (confirm('앱을 잠그고 로그아웃 하시겠습니까?')) {
      sessionStorage.removeItem('proinsight_api_key');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-slate-900">설정</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          {/* API Key Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AI Studio에서 발급받은 키를 입력하세요"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              * 키는 브라우저(로컬 스토리지)에만 저장됩니다.
            </p>
          </div>

          {/* [NEW] Custom Persona Section */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">나만의 AI 페르소나 (선택)</label>
            <textarea
              value={customPersona}
              onChange={(e) => setCustomPersona(e.target.value)}
              placeholder="예: '친근한 옆집 형처럼 반말 모드로 써줘', '문장 끝마다 ㅋㅋ를 붙여줘', '전문 용어는 꼭 괄호 안에 영어를 병기해줘'"
              className="w-full p-3 h-32 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
            />
            <p className="text-xs text-slate-400 mt-2">
              * 이 내용은 모든 글 작성 시 AI에게 최우선 지시사항으로 전달됩니다.
            </p>
          </div>

          {/* Blog URL Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">블로그 주소 관리</h3>
            <p className="text-xs text-slate-500 mb-4">
              SNS 홍보글 생성 시, 아래 저장된 주소 중 하나가 자동으로 삽입됩니다.
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

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all"
          >
            모두 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
