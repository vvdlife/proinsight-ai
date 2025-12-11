import React, { useState } from 'react';
import { BlogPost } from '../types';
import { CopyIcon, NaverIcon, TistoryIcon, MediumIcon, WordPressIcon, SubstackIcon, CheckIcon, EyeIcon, XIcon, DownloadIcon, FileCodeIcon } from './Icons';
import { TABLE_STYLES, PLATFORM_STYLES } from './exportStyles';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExportManagerProps {
  post: BlogPost;
}

export const ExportManager: React.FC<ExportManagerProps> = ({ post }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const generateHtml = (type: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK') => {
    let content = post.content;

    // 0. Table Conversion (Markdown Table -> HTML Table with Inline Styles)
    content = content.replace(/\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.*\|\n?)+)/g, (match, header, separator, body) => {
      const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => h.trim());
      const rows = body.trim().split('\n').map((row: string) => row.split('|').filter((c: string) => c.trim()).map((c: string) => c.trim()));

      let tableHtml = `<table style="${TABLE_STYLES.table}"><thead><tr>`;
      headers.forEach((h: string) => tableHtml += `<th style="${TABLE_STYLES.th}">${h}</th>`);
      tableHtml += '</tr></thead><tbody>';

      rows.forEach((row: string[]) => {
        tableHtml += '<tr>';
        row.forEach((cell: string) => tableHtml += `<td style="${TABLE_STYLES.td}">${cell}</td>`);
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';

      return tableHtml;
    });

    // 1. Code Block Extraction (to prevent <br/> and style mess)
    const codeBlocks: string[] = [];
    content = content.replace(/```(mermaid)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const isMermaid = lang === 'mermaid' || lang === ' mermaid';
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;

      let htmlBlock = '';
      if (isMermaid) {
        // Styled box for Mermaid (since we can't render it in simple HTML export)
        htmlBlock = `
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
             <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">📊 다이어그램 (Mermaid)</div>
             <div style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">(이 플랫폼 에디터에서는 다이어그램 자동 렌더링이 지원되지 않을 수 있습니다. <b>이미지 다운로드</b> 후 첨부해주세요.)</div>
             <pre style="background: #f1f5f9; padding: 12px; border-radius: 6px; text-align: left; font-size: 11px; color: #64748b; overflow-x: auto; font-family: monospace;">${code.trim()}</pre>
          </div>
        `;
      } else {
        // Standard Code Block
        htmlBlock = `<pre style="background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; margin: 20px 0;"><code>${code.trim()}</code></pre>`;
      }

      codeBlocks.push(htmlBlock);
      return placeholder;
    });

    // 2. Markdown to HTML Conversion (Regular Text)
    const s = PLATFORM_STYLES[type];
    let html = content
      .replace(/^### (.*$)/gim, `<h3 style="${s.h3}">$1</h3>`)
      .replace(/^## (.*$)/gim, `<h2 style="${s.h2}">$1</h2>`)
      .replace(/^# (.*$)/gim, `<h1 style="${s.h1}">$1</h1>`)
      .replace(/\*\*(.*?)\*\*/gim, `<strong style="${s.bold}">$1</strong>`)
      .replace(/^\> (.*$)/gim, `<blockquote style="${s.blockquote}">$1</blockquote>`)
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, `<a href="$2" target="_blank" style="${s.link}">$1</a>`)
      .replace(/\n/gim, '<br />');

    // 3. Restore Code Blocks
    codeBlocks.forEach((block, idx) => {
      html = html.replace(`__CODE_BLOCK_${idx}__`, block);
    });

    const titleHtml = type === 'MEDIUM'
      ? `<h1 style="${s.h1}">${post.title}</h1>`
      : `<h1 style="${s.h1}">${post.title}</h1><hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />`;

    return `<div style="${s.container}">${titleHtml}${html}</div>`;
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

  const handlePdfExport = async () => {
    setIsExporting(true);
    try {
      // Create a temporary container for rendering the PDF content
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px'; // Fixed width for consistent PDF
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      // Render the content using React to get the exact same look as the preview
      const root = createRoot(container);

      // Wrap in a Promise to wait for render
      await new Promise<void>((resolve) => {
        root.render(
          <div className="p-[40px] bg-white">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{post.title}</h1>
            <MarkdownRenderer content={post.content} />
          </div>
        );
        // Give it a moment to render (including Mermaid diagrams)
        setTimeout(resolve, 1500);
      });

      const canvas = await html2canvas(container, {
        scale: 2, // 2 is usually enough for print, 3 can be too heavy
        useCORS: true,
        logging: false,
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${post.title.replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_|_$/g, '')}.pdf`);

      // Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('PDF 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleHtmlExport = () => {
    // Render the content to static HTML using the same renderer as the preview
    const contentHtml = renderToStaticMarkup(
      <div className="max-w-3xl mx-auto p-10 bg-white">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{post.title}</h1>
        <MarkdownRenderer content={post.content} />
      </div>
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${post.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Pretendard', 'sans-serif'],
                },
              }
            }
          }
        </script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css" />
        <style>
          body { font-family: 'Pretendard', sans-serif; background-color: #f8fafc; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_|_$/g, '')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div className="flex gap-2">
            <button
              onClick={handlePdfExport}
              disabled={isExporting}
              className="text-xs font-medium bg-white px-3 py-1.5 rounded border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              {isExporting ? '변환 중...' : <><DownloadIcon className="w-3 h-3" /> PDF 저장</>}
            </button>
            <button
              onClick={handleHtmlExport}
              className="text-xs font-medium bg-white px-3 py-1.5 rounded border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <FileCodeIcon className="w-3 h-3" /> HTML 저장
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
            <div key={p.id} className="relative group flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 transition-all duration-200 cursor-pointer" onClick={() => setPreviewType(p.id)}>
              <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: p.color }}>
                  {p.icon}
                </div>
                <div className="text-left truncate">
                  <div className="font-bold text-slate-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-400 group-hover:text-indigo-500">클릭하여 미리보기</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); copyToHtmlClipboard(p.id); }}
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
              <span className="font-bold text-slate-800 flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-indigo-500" /> {previewType} 스타일 미리보기
              </span>
              <button onClick={() => setPreviewType(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <XIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className="mx-auto bg-white p-12 shadow-lg min-h-full max-w-3xl rounded-xl border border-slate-200/60">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: generateHtml(previewType) }}
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => copyToHtmlClipboard(previewType)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <CopyIcon className="w-4 h-4" /> 전체 복사하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
