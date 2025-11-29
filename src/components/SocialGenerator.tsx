import React, { useState } from 'react';
import { SocialPost } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

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

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case 'Instagram': return 'bg-pink-500';
      case 'LinkedIn': return 'bg-blue-600';
      case 'Twitter': return 'bg-sky-500';
      default: return 'bg-indigo-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          📣 SNS 홍보 센터
        </h3>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <div key={index} className="flex flex-col bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className={`px-4 py-2 ${getPlatformColor(post.platform)} text-white font-bold text-sm flex justify-between items-center`}>
              <span>{post.platform}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white/90">추천</span>
            </div>
            
            {/* Content */}
            <div className="p-4 flex-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {post.content}
              <div className="mt-4 pt-3 border-t border-slate-200 text-blue-600 font-medium text-xs break-words">
                {post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
              </div>
            </div>
            
            {/* Footer Action */}
            <div className="p-3 bg-white border-t border-slate-100">
              <button
                onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags.join(' ')}`, index)}
                className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  copiedIndex === index 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {copiedIndex === index ? (
                  <>
                    <CheckIcon className="w-4 h-4" /> 복사 완료!
                  </>
                ) : (
                  <>
                    <CopyIcon className="w-4 h-4" /> 전체 복사
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};