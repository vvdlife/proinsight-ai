import React, { useState } from 'react';
import { SocialPost } from '../types';
import { CopyIcon } from './Icons';

interface SocialGeneratorProps {
  posts: SocialPost[];
}

export const SocialGenerator: React.FC<SocialGeneratorProps> = ({ posts }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!posts || posts.length === 0) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('복사되었습니다!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          📣 SNS 홍보글 자동 생성
        </h3>
      </div>
      
      <div className="flex border-b border-slate-200">
        {posts.map((post, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === index 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {post.platform}
          </button>
        ))}
      </div>

      <div className="p-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 whitespace-pre-wrap text-slate-700">
          {posts[activeTab].content}
          <div className="mt-4 text-indigo-600 font-medium">
            {posts[activeTab].hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
          </div>
        </div>

        <button
          onClick={() => copyToClipboard(`${posts[activeTab].content}\n\n${posts[activeTab].hashtags.join(' ')}`)}
          className="w-full py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
        >
          <CopyIcon className="w-4 h-4" /> 복사하기
        </button>
      </div>
    </div>
  );
};