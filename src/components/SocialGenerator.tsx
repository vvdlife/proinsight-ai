
import React, { useState, useEffect } from 'react';
import { SocialPost } from '../types';
import { CopyIcon, CheckIcon, HeartIcon, ChatBubbleIcon, RepeatIcon, ShareIcon, ImageIcon, SparklesIcon } from './Icons';

interface SocialGeneratorProps {
  posts: SocialPost[];
}

export const SocialGenerator: React.FC<SocialGeneratorProps> = ({ posts }) => {
  const [editablePosts, setEditablePosts] = useState<SocialPost[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const hasBlogUrl = !!localStorage.getItem('proinsight_blog_urls');

  useEffect(() => {
    if (posts) setEditablePosts(posts);
  }, [posts]);

  if (!editablePosts || editablePosts.length === 0) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareToPlatform = (post: SocialPost) => {
    if (post.platform === 'Twitter') {
      const text = encodeURIComponent(`${post.content}\n\n${post.hashtags.join(' ')}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    } else if (post.platform === 'LinkedIn') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/`, '_blank');
    } else {
      alert('자동 공유를 지원하지 않는 플랫폼입니다. 복사해서 사용하세요.');
    }
  };

  const handleContentChange = (index: number, val: string) => {
    const updated = [...editablePosts];
    updated[index].content = val;
    setEditablePosts(updated);
  };

  const handleHashtagsChange = (index: number, val: string) => {
    const updated = [...editablePosts];
    updated[index].hashtags = val.split(' ').filter(t => t.trim());
    setEditablePosts(updated);
  };

  const renderMockup = (post: SocialPost, index: number) => {
    if (post.platform === 'Instagram') {
      return (
        <div key={index} className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm max-w-sm mx-auto w-full">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-indigo-100" />
              </div>
            </div>
            <span className="font-semibold text-xs text-slate-800">proinsight_ai</span>
          </div>

          {/* Image Area */}
          <div className="aspect-square bg-slate-100 flex items-center justify-center text-slate-300 relative group overflow-hidden">
            {post.imageUrl ? (
              <>
                <img src={post.imageUrl} alt="Instagram Post" className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 opacity-70">
                  <SparklesIcon className="w-3 h-3 text-yellow-400" /> AI
                </div>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={post.imageUrl}
                    download={`instagram-post-${index}.png`}
                    className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <ImageIcon className="w-4 h-4" /> 이미지 다운로드
                  </a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 opacity-50" />
                <span className="text-xs">이미지 생성 대기 중...</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex gap-4">
            <HeartIcon className="w-6 h-6 text-slate-800" />
            <ChatBubbleIcon className="w-6 h-6 text-slate-800" />
            <ShareIcon className="w-6 h-6 text-slate-800" />
          </div>
          {/* Content */}
          <div className="px-4 pb-4">
            <div className="text-xs font-semibold mb-1">좋아요 1,024개</div>
            <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              <span className="font-semibold mr-1">proinsight_ai</span>
              <textarea
                value={post.content}
                onChange={(e) => handleContentChange(index, e.target.value)}
                className="w-full bg-transparent outline-none resize-none"
                rows={4}
              />
              <input
                type="text"
                value={post.hashtags.join(' ')}
                onChange={(e) => handleHashtagsChange(index, e.target.value)}
                className="w-full text-blue-600 outline-none text-xs mt-2"
              />
            </div>
          </div>
        </div>
      );
    }

    // Other platforms (Twitter/LinkedIn) fallback UI...
    return (
      <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="font-bold text-sm mb-2">{post.platform}</div>
        <textarea
          value={post.content}
          onChange={(e) => handleContentChange(index, e.target.value)}
          className="w-full text-sm text-slate-700 bg-slate-50 p-2 rounded outline-none resize-none mb-2"
          rows={5}
        />
        <div className="text-blue-600 text-xs font-semibold">
          {post.hashtags.map(t => `#${t.replace('#', '')} `)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          📣 SNS 홍보 센터 (편집 가능)
        </h3>
        {!hasBlogUrl && (
          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            ⚠️ 설정에서 블로그 주소를 입력하면 링크가 자동 삽입됩니다
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 gap-6 bg-slate-50/50">
        {editablePosts.map((post, index) => (
          <div key={index} className="flex flex-col gap-4">
            {renderMockup(post, index)}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags.join(' ')}`, index)}
                className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${copiedIndex === index ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
              >
                {copiedIndex === index ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />} 복사
              </button>
              <button
                onClick={() => shareToPlatform(post)}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <ShareIcon className="w-4 h-4" /> 공유
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
