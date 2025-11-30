import React, { useState } from 'react';
import { BlogPost } from '../types';
import { CopyIcon, NaverIcon, TistoryIcon, MediumIcon, WordPressIcon, SubstackIcon, CheckIcon, EyeIcon, XIcon } from './Icons';

interface ExportManagerProps {
  post: BlogPost;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ post }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK' | null>(null);

  const generateHtml = (type: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK') => {
    let content = post.content;

    // 0. Table Conversion (Markdown Table -> HTML Table with Inline Styles)
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

    // Style Definitions per Platform
    const styles = {
        NAVER: {
            h1: 'font-size: 32px; font-weight: 800; margin-bottom: 24px; color: #111;',
            h2: 'font-size: 24px; font-weight: bold; margin-top: 32px; margin-bottom: 16px; border-left: 5px solid #03C75A; padding-left: 12px; color: #111;',
            h3: 'font-size: 19px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #333;',
            p: 'font-size: 16px; line-height: 1.8; color: #374151; margin-bottom: 16px;',
            blockquote: 'background-color: #f8fafc; border-left: 4px solid #cbd5e1; padding: 16px; margin: 16px 0; font-style: italic; color: #475569;',
            link: 'color: #03C75A; text-decoration: underline;'
        },
        TISTORY: {
            h1: 'font-size: 30px; font-weight: bold; margin-bottom: 20px; color: #333;',
            h2: 'font-size: 22px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #F44F05;',
            h3: 'font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #444;',
            p: 'font-size: 16px; line-height: 1.7; color: #555; margin-bottom: 15px;',
            blockquote: 'border-left: 4px solid #F44F05; padding-left: 15px; margin: 15px 0; color: #666;',
            link: 'color: #F44F05; text-decoration: none;'
        },
        MEDIUM: {
            h1: 'font-family: serif; font-size: 42px; font-weight: 400; margin-bottom: 10px; color: #242424;',
            h2: 'font-family: sans-serif; font-size: 24px; font-weight: 700; margin-top: 40px; margin-bottom: 14px; color: #242424;',
            h3: 'font-family: sans-serif; font-size: 20px; font-weight: 700; margin-top: 30px; margin-bottom: 10px; color: #242424;',
            p: 'font-family: serif; font-size: 20px; line-height: 1.58; color: #242424; margin-bottom: 24px;',
            blockquote: 'border-left: 3px solid #242424; padding-left: 20px; font-style: italic; font-family: serif; font-size: 24px;',
            link: 'color: #1a8917; text-decoration: underline;'
        },
        WORDPRESS: { // Clean HTML
            h1: '', h2: '', h3: '', p: '', blockquote: '', link: ''
        },
        SUBSTACK: {
             h1: 'font-size: 28px; font-weight: 800; margin-bottom: 16px; color: #1a1a1a;',
             h2: 'font-size: 20px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; color: #1a1a1a;',
             h3: 'font-size: 18px; font-weight: 600; margin-top: 20px; margin-bottom: 8px;',
             p: 'font-size: 17px; line-height: 1.6; color: #363636; margin-bottom: 16px;',
             blockquote: 'padding-left: 16px; border-left: 3px solid #FF6719; font-style: italic;',
             link: 'color: #FF6719; text-decoration: underline;'
        }
    };

    const s = styles[type];

    // 1. Markdown to HTML Conversion
    let html = content
      .replace(/^### (.*$)/gim, `<h3 style="${s.h3}">$1</h3>`)
      .replace(/^## (.*$)/gim, `<h2 style="${s.h2}">$1</h2>`)
      .replace(/^# (.*$)/gim, `<h1 style="${s.h1}">$1</h1>`)
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\> (.*$)/gim, `<blockquote style="${s.blockquote}">$1</blockquote>`)
      .replace(/^- (.*$)/gim, '<li>$1</li>') // Styling LI inline is tricky, better leave to platform defaults or wrapper
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, `<a href="$2" target="_blank" style="${s.link}">$1</a>`)
      .replace(/\n/gim, '<br />');
    
    // Wrap Paragraphs (Simplistic approach)
    // In a real app, use a proper parser. Here we just assume lines not starting with tags are paragraphs.
    
    const titleHtml = type === 'MEDIUM' 
        ? `<h1 style="${s.h1}">${post.title}</h1>` 
        : `<h1 style="font-size: 32px; font-weight: bold; margin-bottom: 24px;">${post.title}</h1><hr />`;
    
    return `<div style="font-family: ${type === 'MEDIUM' ? 'Times New Roman, serif' : "'Pretendard', sans-serif"};">${titleHtml}${html}</div>`;
  };

  const copyToHtmlClipboard = async (platform: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK') => {
    try {
      const finalHtml = generateHtml(platform);

      const blob = new Blob([finalHtml], { type: 'text/html' });
      const textBlob = new Blob([post.content], { type: 'text/plain' });
      
      const data = [new ClipboardItem({ 
        'text/html': blob,
        'text/plain': textBlob 
      })];
      
      await navigator.clipboard.write(data);
      
      setCopiedType(platform);
      setTimeout(() => setCopiedType(null), 2000);
      
      alert(`${platform}용 서식이 복사되었습니다.\n에디터에서 바로 붙여넣기(Ctrl+V) 하세요!`);
    } catch (err) {
      console.error('Copy failed', err);
      navigator.clipboard.writeText(post.content);
      alert('서식 복사 실패 (텍스트만 복사됨)');
    }
  };

  const platforms = [
      { id: 'NAVER', name: '네이버 블로그', icon: <NaverIcon className="w-6 h-6" />, color: '#03C75A' },
      { id: 'TISTORY', name: '티스토리', icon: <TistoryIcon className="w-6 h-6" />, color: '#F44F05' },
      { id: 'MEDIUM', name: 'Medium', icon: <MediumIcon className="w-6 h-6" />, color: '#000000' },
      { id: 'WORDPRESS', name: 'WordPress', icon: <WordPressIcon className="w-6 h-6" />, color: '#21759B' },
      { id: 'SUBSTACK', name: 'Substack', icon: <SubstackIcon className="w-6 h-6" />, color: '#FF6719' },
  ] as const;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mt-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            🚀 플랫폼별 원클릭 내보내기 (Global)
          </h3>
          <span className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
            서식 자동 최적화
          </span>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
             <div key={p.id} className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.color }}>
                    {p.icon}
                </div>
                <div className="text-left truncate">
                    <div className="font-bold text-slate-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400">서식 복사</div>
                </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                <button 
                    onClick={() => setPreviewType(p.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="미리보기"
                >
                    <EyeIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => copyToHtmlClipboard(p.id)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="복사하기"
                >
                    {copiedType === p.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                </button>
                </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800">{previewType} 미리보기</span>
              <button onClick={() => setPreviewType(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className="mx-auto bg-white p-10 shadow-sm min-h-full max-w-3xl">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generateHtml(previewType) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};