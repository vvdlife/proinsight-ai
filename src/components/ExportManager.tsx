import React from 'react';
import { BlogPost } from '../types';
import { CopyIcon, NaverIcon, TistoryIcon, CheckIcon } from './Icons';

interface ExportManagerProps {
  post: BlogPost;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ post }) => {
  const [copiedType, setCopiedType] = React.useState<string | null>(null);

  const copyToHtmlClipboard = async (platform: 'NAVER' | 'TISTORY') => {
    try {
      // 1. Markdown to HTML Conversion with Inline Styles for Editors
      // Note: This is a simplified parser. For complex logic, libraries like 'marked' are better,
      // but here we use regex for zero-dependency.
      let html = post.content
        .replace(/^### (.*$)/gim, '<h3 style="font-size: 19px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #333;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="font-size: 24px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; border-left: 5px solid #4f46e5; padding-left: 12px; color: #111;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px; color: #111;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #4f46e5; font-weight: bold;">$1</strong>')
        .replace(/^\> (.*$)/gim, '<blockquote style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; margin: 16px 0; font-style: italic; color: #475569;">$1</blockquote>')
        .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 8px; line-height: 1.6;">$1</li>')
        .replace(/\n/gim, '<br />');
      
      // Wrap list items
      // Simple heuristic for wrapping lists (imperfect but functional for simple lists)
      // For better list handling, a real parser is recommended.
      
      const titleHtml = `<h1 style="font-size: 36px; font-weight: 900; margin-bottom: 30px; letter-spacing: -0.5px;">${post.title}</h1><hr style="margin-bottom: 30px; border: 0; border-top: 1px solid #eee;" />`;
      
      const finalHtml = `<div style="font-family: 'Pretendard', sans-serif; font-size: 16px; line-height: 1.8; color: #374151;">${titleHtml}${html}</div>`;

      // 2. Copy to Clipboard as 'text/html'
      const blob = new Blob([finalHtml], { type: 'text/html' });
      const textBlob = new Blob([post.content], { type: 'text/plain' });
      
      const data = [new ClipboardItem({ 
        'text/html': blob,
        'text/plain': textBlob 
      })];
      
      await navigator.clipboard.write(data);
      
      setCopiedType(platform);
      setTimeout(() => setCopiedType(null), 2000);
      
      alert(`${platform === 'NAVER' ? '네이버 블로그' : '티스토리'}용 서식이 복사되었습니다.\n블로그 에디터(글쓰기) 화면에서 바로 '붙여넣기(Ctrl+V)' 하세요!`);
    } catch (err) {
      console.error('Copy failed', err);
      // Fallback
      navigator.clipboard.writeText(post.content);
      alert('서식 복사에 실패하여 텍스트만 복사되었습니다.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          🚀 플랫폼별 원클릭 내보내기
        </h3>
        <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
          서식 자동 적용됨
        </span>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Naver Blog */}
        <button
          onClick={() => copyToHtmlClipboard('NAVER')}
          className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-[#03C75A] hover:bg-[#03C75A]/5 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#03C75A] flex items-center justify-center text-white shrink-0">
              <NaverIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800 group-hover:text-[#03C75A]">네이버 블로그</div>
              <div className="text-xs text-slate-500">전용 서식 복사하기</div>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-[#03C75A]">
            {copiedType === 'NAVER' ? <CheckIcon className="w-6 h-6" /> : <CopyIcon className="w-6 h-6" />}
          </div>
        </button>

        {/* Tistory */}
        <button
          onClick={() => copyToHtmlClipboard('TISTORY')}
          className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-[#F44F05] hover:bg-[#F44F05]/5 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F44F05] flex items-center justify-center text-white shrink-0">
              <TistoryIcon className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-slate-800 group-hover:text-[#F44F05]">티스토리</div>
              <div className="text-xs text-slate-500">최적화 서식 복사하기</div>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-[#F44F05]">
            {copiedType === 'TISTORY' ? <CheckIcon className="w-6 h-6" /> : <CopyIcon className="w-6 h-6" />}
          </div>
        </button>
      </div>
      
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-500">
          💡 버튼을 누른 후, 각 블로그의 <strong>'글쓰기'</strong> 화면에서 <strong>Ctrl + V</strong> (붙여넣기) 하세요.
        </p>
      </div>
    </div>
  );
};