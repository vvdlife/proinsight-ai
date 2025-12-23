import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { CheckIcon, XIcon, RefreshIcon } from './Icons';

interface PublishingManagerProps {
  post: BlogPost;
}

export const PublishingManager: React.FC<PublishingManagerProps> = ({ post }) => {
  const [mediumToken, setMediumToken] = useState('');
  const [tistoryToken, setTistoryToken] = useState('');
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<{
    platform: string;
    success: boolean;
    url?: string;
    error?: string;
  } | null>(null);

  const [wpSiteUrl, setWpSiteUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpPassword, setWpPassword] = useState('');

  // Load tokens from local storage
  useEffect(() => {
    const savedMediumToken = localStorage.getItem('proinsight_medium_token');
    const savedTistoryToken = localStorage.getItem('proinsight_tistory_token');
    const savedWpUrl = localStorage.getItem('proinsight_wp_url');
    const savedWpUser = localStorage.getItem('proinsight_wp_user');
    const savedWpPass = localStorage.getItem('proinsight_wp_pass');

    // Check URL for Tistory token callback
    const urlParams = new URLSearchParams(window.location.search);
    const urlTistoryToken = urlParams.get('tistory_token');

    if (urlTistoryToken) {
      setTistoryToken(urlTistoryToken);
      localStorage.setItem('proinsight_tistory_token', urlTistoryToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (savedTistoryToken) {
      setTistoryToken(savedTistoryToken);
    }

    if (savedMediumToken) setMediumToken(savedMediumToken);
    if (savedWpUrl) setWpSiteUrl(savedWpUrl);
    if (savedWpUser) setWpUsername(savedWpUser);
    if (savedWpPass) setWpPassword(savedWpPass);
  }, []);

  const handleSaveMediumToken = () => {
    localStorage.setItem('proinsight_medium_token', mediumToken);
    alert('Medium 토큰이 저장되었습니다.');
  };

  const handleSaveWordPress = () => {
    localStorage.setItem('proinsight_wp_url', wpSiteUrl);
    localStorage.setItem('proinsight_wp_user', wpUsername);
    localStorage.setItem('proinsight_wp_pass', wpPassword);
    alert('워드프레스 정보가 저장되었습니다.');
  };

  const handleTistoryLogin = () => {
    // For testing purposes without a real API Key
    const isSimulation = confirm(
      "실제 티스토리 App ID가 설정되지 않았습니다.\n테스트를 위해 '가상 로그인'을 진행하시겠습니까?\n(취소 시 실제 연동 시도)",
    );

    if (isSimulation) {
      const dummyToken = 'TEST_TISTORY_ACCESS_TOKEN';
      setTistoryToken(dummyToken);
      localStorage.setItem('proinsight_tistory_token', dummyToken);
      alert('테스트용 가상 계정이 연동되었습니다.');
    } else {
      // Redirect to backend auth endpoint
      window.location.href = '/api/tistory/auth';
    }
  };

  const handlePublishMedium = async () => {
    if (!mediumToken) {
      alert('Medium 통합 토큰을 먼저 입력해주세요.');
      return;
    }

    setPublishing('MEDIUM');
    setPublishResult(null);

    try {
      const response = await fetch('/api/medium/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: mediumToken,
          title: post.title,
          content: post.content,
          tags: ['ProInsightAI', 'AI'],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishResult({ platform: 'Medium', success: true, url: data.url });
      } else {
        throw new Error(data.error || 'Failed to publish');
      }
    } catch (error: any) {
      setPublishResult({ platform: 'Medium', success: false, error: error.message });
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishWordPress = async () => {
    if (!wpSiteUrl || !wpUsername || !wpPassword) {
      alert('워드프레스 접속 정보를 모두 입력해주세요.');
      return;
    }

    setPublishing('WORDPRESS');
    setPublishResult(null);

    try {
      const response = await fetch('/api/wordpress/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: wpSiteUrl,
          username: wpUsername,
          password: wpPassword,
          title: post.title,
          content: post.content,
          tags: ['ProInsightAI'],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishResult({ platform: 'WordPress', success: true, url: data.url });
      } else {
        throw new Error(data.error || 'Failed to publish');
      }
    } catch (error: any) {
      setPublishResult({ platform: 'WordPress', success: false, error: error.message });
    } finally {
      setPublishing(null);
    }
  };

  const handlePublishTistory = async () => {
    if (!tistoryToken) {
      alert('티스토리 연동이 필요합니다.');
      return;
    }

    // In a real app, we'd need to list blogs and let user choose.
    // For MVP, we'll ask for blog name manually if not stored, or just try to publish to primary.
    // Since we don't have a "List Blogs" API implemented yet, let's ask user for Blog Name.
    const blogName = prompt(
      '발행할 티스토리 블로그 이름(식별자)을 입력해주세요.\n(예: myblog.tistory.com 에서 myblog)',
    );
    if (!blogName) return;

    setPublishing('TISTORY');
    setPublishResult(null);

    try {
      const response = await fetch('/api/tistory/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: tistoryToken,
          blogName,
          title: post.title,
          content: post.content,
          tags: ['ProInsightAI'],
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPublishResult({ platform: 'Tistory', success: true, url: data.url });
      } else {
        throw new Error(data.error || 'Failed to publish');
      }
    } catch (error: any) {
      setPublishResult({ platform: 'Tistory', success: false, error: error.message });
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          📡 자동 발행 매니저 (Auto-Publish)
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Result Message */}
        {publishResult && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 ${publishResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
          >
            {publishResult.success ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              <XIcon className="w-5 h-5" />
            )}
            <div>
              <div className="font-bold">
                {publishResult.platform} 발행 {publishResult.success ? '성공!' : '실패'}
              </div>
              {publishResult.success && publishResult.url && (
                <a
                  href={publishResult.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline hover:text-green-900"
                >
                  게시글 보러가기 &rarr;
                </a>
              )}
              {!publishResult.success && <div className="text-sm">{publishResult.error}</div>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Medium Section */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-serif font-bold text-xl">
                M
              </div>
              <div className="font-bold text-slate-800">Medium</div>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                value={mediumToken}
                onChange={(e) => setMediumToken(e.target.value)}
                placeholder="Integration Token"
                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-black"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveMediumToken}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                >
                  토큰 저장
                </button>
                <button
                  onClick={handlePublishMedium}
                  disabled={publishing === 'MEDIUM'}
                  className="flex-1 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 disabled:opacity-50"
                >
                  {publishing === 'MEDIUM' ? '발행 중...' : '원클릭 발행'}
                </button>
              </div>
            </div>
          </div>

          {/* Tistory Section */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-orange-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#F44F05] text-white rounded-full flex items-center justify-center font-bold text-sm">
                T
              </div>
              <div className="font-bold text-slate-800">티스토리</div>
              {tistoryToken ? (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                  연동됨
                </span>
              ) : (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  미연동
                </span>
              )}
            </div>

            <div className="space-y-3">
              {!tistoryToken ? (
                <button
                  onClick={handleTistoryLogin}
                  className="w-full py-3 bg-[#F44F05] text-white text-sm font-bold rounded hover:bg-[#d94604] transition-colors"
                >
                  티스토리 연동
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      localStorage.removeItem('proinsight_tistory_token');
                      setTistoryToken('');
                    }}
                    className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                  >
                    연동 해제
                  </button>
                  <button
                    onClick={handlePublishTistory}
                    disabled={publishing === 'TISTORY'}
                    className="flex-1 py-2 bg-[#F44F05] text-white text-xs font-bold rounded hover:bg-[#d94604] disabled:opacity-50"
                  >
                    {publishing === 'TISTORY' ? '발행 중...' : '원클릭 발행'}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 text-center">
                * 최초 1회 연동 필요 (OAuth 인증)
              </p>
            </div>
          </div>

          {/* WordPress Section */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#21759B] text-white rounded-full flex items-center justify-center font-bold text-lg">
                W
              </div>
              <div className="font-bold text-slate-800">WordPress</div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={wpSiteUrl}
                onChange={(e) => setWpSiteUrl(e.target.value)}
                placeholder="사이트 주소 (https://...)"
                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-[#21759B]"
              />
              <input
                type="text"
                value={wpUsername}
                onChange={(e) => setWpUsername(e.target.value)}
                placeholder="ID"
                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-[#21759B]"
              />
              <input
                type="password"
                value={wpPassword}
                onChange={(e) => setWpPassword(e.target.value)}
                placeholder="App Password"
                className="w-full p-2 text-sm border border-slate-200 rounded outline-none focus:border-[#21759B]"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveWordPress}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded hover:bg-slate-200"
                >
                  정보 저장
                </button>
                <button
                  onClick={handlePublishWordPress}
                  disabled={publishing === 'WORDPRESS'}
                  className="flex-1 py-2 bg-[#21759B] text-white text-xs font-bold rounded hover:bg-[#1a5c7a] disabled:opacity-50"
                >
                  {publishing === 'WORDPRESS' ? '발행 중...' : '원클릭 발행'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
