import React, { useState } from 'react';
import { BlogPost } from '../types';
import { CopyIcon, NaverIcon, TistoryIcon, CheckIcon, EyeIcon, XIcon } from './Icons';

interface ExportManagerProps {
  post: BlogPost;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ post }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'NAVER' | 'TISTORY' | null>(null);

  const generateHtml = (type: 'NAVER' | 'TISTORY') => {
    let content = post.content;

    // 0. Table Conversion (Markdown Table -> HTML Table with Inline Styles)
    // Regex to identify table blocks
    content = content.replace(/\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.*\|\n?)+)/g, (match, header, separator, body) => {
        const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => h.trim());
        const rows = body.trim().split('\n').map((row: string) => row.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim()));
        
        const thStyle = "background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px; font-weight: bold; text-align: center; color: #334155;";
        const tdStyle = "border: 1px solid #cbd5e1; padding: 12px; color: #475569;";
        
        let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 15px;"><thead><tr>';
        headers.forEach((h: string) => tableHtml += `<th style="${thStyle}">${h}</th>`);
        tableHtml += '</tr></thead><tbody>';
        
        rows.forEach((row: string[]) => {
            tableHtml += '<tr>';
            row.forEach((cell: string) => tableHtml += `<td style="${tdStyle}">${cell}</td>`);
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        
        return tableHtml;
    });

    // 1. Basic Markdown to HTML Conversion
    let html = content
      .replace(/^### (.*$)/gim, type === 'NAVER' 
        ? '<h3 style="font-size: 19px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #333;">$1</h3>'
        : '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, type === 'NAVER'
        ? '<h2 style="font-size: 24px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; border-left: 5px solid #4f46e5; padding-left: 12px; color: #111;">$1</h2>'
        : '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, type === 'NAVER'
        ? '<h1 style="font-size: 32px; font-weight: 800; margin-bottom: 24px; color: #111;">$1</h1>'
        : '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #4f46e5; font-weight: bold;">$1</strong>')
      .replace(/^\> (.*$)/gim, '<blockquote style="background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; margin: 16px 0; font-style: italic; color: #475569;">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 8px; line-height: 1.6;">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" style="color: #4f46e5; text-decoration: underline;">$1</a>')
      .replace(/\n/gim, '<br />');
    
    const titleHtml = type === 'NAVER'
      ? `<h1 style="font-size: 36px; font-weight: 900; margin-bottom: 30px; letter-spacing: -0.5px;">${post.title}</h1><hr style="margin-bottom: 30px; border: 0; border-top: 1px solid #eee;" />`
      : `<h1>${post.title}</h1><hr />`;
    
    return `<div style="font-family: 'Pretendard', sans-serif; font-size: 16px; line-height: 1.8; color: #374151;">${titleHtml}${html}</div>`;
  };

  const copyToHtmlClipboard = async (platform: 'NAVER' | 'TISTORY') => {
    try {
      const finalHtml = generateHtml(platform);

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
    <>
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
          <div className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-[#03C75A] hover:bg-[#03C75A]/5 transition-all duration-200">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#03C75A] flex items-center justify-center text-white shrink-0">
                <NaverIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 group-hover:text-[#03C75A]">네이버 블로그</div>
                <div className="text-xs text-slate-500">전용 서식 복사하기</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPreviewType('NAVER')}
                className="p-2 text-slate-400 hover:text-[#03C75A] hover:bg-white rounded-lg transition-colors"
                title="미리보기"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => copyToHtmlClipboard('NAVER')}
                className="p-2 text-slate-400 hover:text-[#03C75A] hover:bg-white rounded-lg transition-colors"
                title="복사하기"
              >
                {copiedType === 'NAVER' ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Tistory */}
          <div className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-[#F44F05] hover:bg-[#F44F05]/5 transition-all duration-200">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-lg bg-[#F44F05] flex items-center justify-center text-white shrink-0">
                <TistoryIcon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 group-hover:text-[#F44F05]">티스토리</div>
                <div className="text-xs text-slate-500">최적화 서식 복사하기</div>
              </div>
            </div>
             <div className="flex items-center gap-2">
              <button 
                onClick={() => setPreviewType('TISTORY')}
                className="p-2 text-slate-400 hover:text-[#F44F05] hover:bg-white rounded-lg transition-colors"
                title="미리보기"
              >
                <EyeIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => copyToHtmlClipboard('TISTORY')}
                className="p-2 text-slate-400 hover:text-[#F44F05] hover:bg-white rounded-lg transition-colors"
                title="복사하기"
              >
                {copiedType === 'TISTORY' ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            💡 버튼을 누른 후, 각 블로그의 <strong>'글쓰기'</strong> 화면에서 <strong>Ctrl + V</strong> (붙여넣기) 하세요.
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      {previewType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                {previewType === 'NAVER' ? <NaverIcon className="w-6 h-6 text-[#03C75A]" /> : <TistoryIcon className="w-6 h-6 text-[#F44F05]" />}
                <span className="font-bold text-slate-800">{previewType === 'NAVER' ? '네이버 블로그' : '티스토리'} 미리보기</span>
              </div>
              <button onClick={() => setPreviewType(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className={`mx-auto bg-white p-10 shadow-sm min-h-full ${previewType === 'NAVER' ? 'max-w-[886px]' : 'max-w-4xl'}`}>
                {/* Simulated Content Rendering */}
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generateHtml(previewType) }}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
               <button
                onClick={() => copyToHtmlClipboard(previewType)}
                className={`px-6 py-2 rounded-lg text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                  previewType === 'NAVER' ? 'bg-[#03C75A] hover:bg-[#02b351]' : 'bg-[#F44F05] hover:bg-[#d94404]'
                }`}
              >
                <CopyIcon className="w-4 h-4" /> 서식 복사하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};