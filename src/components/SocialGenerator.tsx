import React, { useState } from 'react';
import { SocialPost } from '../types';
import { CopyIcon, CheckIcon, HeartIcon, ChatBubbleIcon, RepeatIcon, ShareIcon } from './Icons';

interface SocialGeneratorProps {
  posts: SocialPost[];
}

export const SocialGenerator: React.FC<SocialGeneratorProps> = ({ posts }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!posts || posts.length === 0) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMockup = (post: SocialPost, index: number) => {
    const fullText = `${post.content}\n\n${post.hashtags.join(' ')}`;

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
          {/* Insta Image Placeholder */}
          <div className="aspect-square bg-slate-100 flex items-center justify-center text-slate-300">
             <span className="text-xs">이미지 영역</span>
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
              {post.content}
              <div className="mt-2 text-blue-600">
                {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
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
                     {post.content}
                     <div className="mt-2 text-blue-500">
                       {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
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
               {post.content}
            </div>
            <div className="mt-2 text-blue-600 text-sm font-semibold">
               {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
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
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          📣 SNS 홍보 센터 (미리보기)
        </h3>
      </div>
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50/50">
        {posts.map((post, index) => (
          <div key={index} className="flex flex-col gap-4">
             {/* Render Mockup */}
             {renderMockup(post, index)}
             
             {/* Action Button */}
             <button
                onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags.join(' ')}`, index)}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                  copiedIndex === index 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                }`}
              >
                {copiedIndex === index ? (
                  <>
                    <CheckIcon className="w-4 h-4" /> 복사 완료!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" /> 텍스트 복사
                  </>
                )}
              </button>
          </div>
        ))}
      </div>
    </div>
  );
};