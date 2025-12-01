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
    if (posts) {
        setEditablePosts(posts);
    }
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
          alert('이 플랫폼은 자동 공유를 지원하지 않습니다. 텍스트를 복사해서 사용해주세요!');
      }
  };

  const handleContentChange = (index: number, newContent: string) => {
      const updated = [...editablePosts];
      updated[index].content = newContent;
      setEditablePosts(updated);
  };

  const handleHashtagsChange = (index: number, newTagsString: string) => {
      const updated = [...editablePosts];
      updated[index].hashtags = newTagsString.split(' ').filter(t => t.trim() !== '');
      setEditablePosts(updated);
  };

  const renderMockup = (post: SocialPost, index: number) => {
    if (post.platform === 'Instagram') {
      return (
        <div key={index} className="flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm max-w-sm mx-auto w-full">
          {/* Insta Header */}
          <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-indigo-100" />
              </div>
            </div>
            <span className="font-semibold text-xs text-slate-800">proinsight_ai</span>
            <span className="ml-auto text-slate-400">•••</span>
          </div>
          
          {/* Insta Image Area */}
          <div className="aspect-square bg-slate-100 flex items-center justify-center text-slate-300 relative group overflow-hidden">
             {post.imageUrl ? (
                 <>
                    <img src={post.imageUrl} alt="Instagram Post" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 opacity-70">
                        <SparklesIcon className="w-3 h-3 text-yellow-400" /> AI
                    </div>
                    {/* Download Button Overlay */}
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
          
          {/* Insta Actions */}
          <div className="px-4 py-3 flex gap-4">
            <HeartIcon className="w-6 h-6 text-slate-800" />
            <ChatBubbleIcon className="w-6 h-6 text-slate-800" />
            <ShareIcon className="w-6 h-6 text-slate-800" />
          </div>
          {/* Insta Content */}
          <div className="px-4 pb-4">
            <div className="text-xs font-semibold mb-1">좋아요 1,024개</div>
            <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              <span className="font-semibold mr-1">proinsight_ai</span>
              <textarea 
                value={post.content}
                onChange={(e) => handleContentChange(index, e.target.value)}
                className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded p-1 outline-none resize-none"
                rows={4}
              />
              <div className="mt-2">
                <input 
                    type="text"
                    value={post.hashtags.join(' ')}
                    onChange={(e) => handleHashtagsChange(index, e.target.value)}
                    className="w-full text-blue-600 bg-transparent border-b border-transparent hover:border-blue-200 focus:border-blue-400 outline-none text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (post.platform === 'Twitter') {
       return (
         <div key={index} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-sm mx-auto w-full p-4">
            <div className="flex gap-3">
               <div className="w-10 h-10 rounded-full bg-indigo-100 shrink-0" />
               <div className="flex-1">
                  <div className="flex items-center gap-1">
                     <span className="font-bold text-slate-900 text-sm">ProInsight AI</span>
                     <span className="text-slate-500 text-sm">@proinsight · 1m</span>
                  </div>
                  <div className="text-sm text-slate-900 mt-1 whitespace-pre-wrap leading-relaxed">
                     <textarea 
                        value={post.content}
                        onChange={(e) => handleContentChange(index, e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded p-1 outline-none resize-none"
                        rows={4}
                     />
                     <div className="mt-2">
                        <input 
                            type="text"
                            value={post.hashtags.join(' ')}
                            onChange={(e) => handleHashtagsChange(index, e.target.value)}
                            className="w-full text-blue-500 bg-transparent border-b border-transparent hover:border-blue-200 focus:border-blue-400 outline-none text-xs"
                        />
                     </div>
                  </div>
                  <div className="flex justify-between mt-3 text-slate-500 max-w-[80%]">
                     <ChatBubbleIcon className="w-4 h-4" />
                     <RepeatIcon className="w-4 h-4" />
                     <HeartIcon className="w-4 h-4" />
                     <ShareIcon className="w-4 h-4" />
                  </div>
               </div>
            </div>
         </div>
       );
    }

    // LinkedIn
    return (
      <div key={index} className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm max-w-sm mx-auto w-full">
         <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <div className="w-10 h-10 rounded bg-indigo-100" />
            <div>
               <div className="font-bold text-sm text-slate-800">ProInsight AI</div>
               <div className="text-xs text-slate-500">AI Writing Assistant</div>
            </div>
         </div>
         <div className="p-4">
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
               <textarea 
                    value={post.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    className="w-full bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 rounded p-1 outline-none resize-none"
                    rows={5}
                />
            </div>
            <div className="mt-2 text-sm font-semibold">
                <input 
                    type="text"
                    value={post.hashtags.join(' ')}
                    onChange={(e) => handleHashtagsChange(index, e.target.value)}
                    className="w-full text-blue-600 bg-transparent border-b border-transparent hover:border-blue-200 focus:border-blue-400 outline-none"
                />
            </div>
         </div>
         <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-slate-500 text-xs font-semibold">
            <span className="flex items-center gap-1"><HeartIcon className="w-4 h-4"/> Like</span>
            <span className="flex items-center gap-1"><ChatBubbleIcon className="w-4 h-4"/> Comment</span>
            <span className="flex items-center gap-1"><RepeatIcon className="w-4 h-4"/> Repost</span>
            <span className="flex items-center gap-1"><ShareIcon className="w-4 h-4"/> Send</span>
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
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50/50">
        {editablePosts.map((post, index) => (
          <div key={index} className="flex flex-col gap-4">
             {/* Render Mockup */}
             {renderMockup(post, index)}
             
             {/* Action Buttons */}
             <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags.join(' ')}`, index)}
                    className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                    copiedIndex === index 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                    }`}
                >
                    {copiedIndex === index ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                    복사
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