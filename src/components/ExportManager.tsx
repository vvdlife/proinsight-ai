import React, { useState, useEffect } from 'react';
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
  const [includeCover, setIncludeCover] = useState(true);

  // Helper: Convert SVG string to Base64 Image
  const svgToBase64Image = (svg: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      // Use standard btoa for SVGs to avoid encoding issues with unicode
      const svgBase64 = btoa(unescape(encodeURIComponent(svg)));
      const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          // Double resolution for retina/high quality
          canvas.width = img.width * 2;
          canvas.height = img.height * 2;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0);
            try {
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              console.warn('Canvas export tainted, falling back to SVG', e);
              resolve(svgDataUri);
            }
          } else {
            resolve(svgDataUri);
          }
        } catch (e) {
          console.warn('Canvas operations failed, falling back to SVG', e);
          resolve(svgDataUri);
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = () => {
        console.error('Image load failed for SVG conversion');
        resolve(svgDataUri);
        URL.revokeObjectURL(url);
      }

      // Setting crossOrigin might help in some environments
      img.crossOrigin = 'Anonymous';
      img.src = url;
    });
  };

  const generateHtml = async (type: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK') => {
    let content = post.content;
    const s = PLATFORM_STYLES[type];

    // [New] 0. Header Image Injection (Thumbnail)
    let headerImageHtml = '';
    if (post.images && post.images.length > 0) {
      // Assuming post.images[0] is a base64 string or URL
      // For base64, usually safe to use directly in img src for clipboard
      const imgStyle = s.img || 'max-width: 100%; height: auto; margin-bottom: 30px; border-radius: 8px; display: block;';
      headerImageHtml = `<img src="${post.images[0]}" alt="Representative Image" style="${imgStyle}" /><br /><br />`;
    }

    // 0.5. Markdown Image Conversion (![alt](url)) -> <img ... />
    // Must be done BEFORE link replacement to avoid conflict
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      const imgStyle = s.img || 'max-width: 100%; height: auto; margin: 20px 0;';
      return `<img src="${url}" alt="${alt}" style="${imgStyle}" /><br />`;
    });


    // 1. Table Conversion
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

    // 2. Mermaid Rendering & Code Block Extraction
    const mermaidReplacements: { placeholder: string, html: string }[] = [];

    // Extract code blocks
    let blockIndex = 0;
    const mermaidMatches: { code: string, isMermaid: boolean, placeholder: string }[] = [];

    content = content.replace(/```(mermaid)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const isMermaid = lang === 'mermaid' || lang === ' mermaid';
      const placeholder = `__CODE_BLOCK_${blockIndex++}__`;
      mermaidMatches.push({ code, isMermaid, placeholder });
      return placeholder;
    });

    // Process blocks (Async)
    for (const { code, isMermaid, placeholder } of mermaidMatches) {
      let htmlBlock = '';

      if (isMermaid) {
        try {
          const mermaid = (await import('mermaid')).default;
          mermaid.initialize({ startOnLoad: false, theme: 'default' });

          const id = `mermaid-export-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, code);
          const pngBase64 = await svgToBase64Image(svg);

          htmlBlock = `
                  <div style="margin: 30px 0; text-align: center;">
                     <img src="${pngBase64}" alt="Mermaid Diagram" style="max-width: 100%; height: auto; margin: 0 auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />
                  </div>`;
        } catch (e) {
          console.error("Mermaid Render Error", e);
          htmlBlock = `<pre style="background: #f1f5f9; padding: 12px;">${code.trim()}</pre>`;
        }
      } else {
        htmlBlock = `<pre style="background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; margin: 20px 0;"><code>${code.trim()}</code></pre>`;
      }
      mermaidReplacements.push({ placeholder, html: htmlBlock });
    }

    // 3. Markdown to HTML Conversion
    // Improved List Handling: Convert "- item" to <li>item</li> and wrap neighbors in <ul> if possible.
    // However, regex-only wrapping is hard. 
    // Simplified approach: Just convert line start "- " to a bullet char or formatted styled div for simplicity if regex is too complex for 'ul' wrapping without a parser.
    // Better approach for Clipboard: Use simple replacements but try to be semantic where possible.

    let html = content
      .replace(/^### (.*$)/gim, `<h3 style="${s.h3}">$1</h3>`)
      .replace(/^## (.*$)/gim, `<h2 style="${s.h2}">$1</h2>`)
      .replace(/^# (.*$)/gim, `<h1 style="${s.h1}">$1</h1>`)
      .replace(/\*\*(.*?)\*\*/gim, `<strong style="${s.bold}">$1</strong>`)
      .replace(/^\> (.*$)/gim, `<blockquote style="${s.blockquote}">$1</blockquote>`)
      // .replace(/^- (.*$)/gim, '<li>$1</li>') // Simple replacement, might rely on WYSIWYG to auto-list
      .replace(/^- (.*$)/gim, `<ul><li>$1</li></ul>`) // Dirty but often works in WYSIWYG to trigger list mode
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, `<a href="$2" target="_blank" style="${s.link}">$1</a>`)
      .replace(/\n/gim, '<br />');

    // 4. Restore Code Blocks
    mermaidReplacements.forEach(({ placeholder, html: blockHtml }) => {
      html = html.replace(placeholder, blockHtml);
    });

    const titleHtml = type === 'MEDIUM'
      ? `<h1 style="${s.h1}">${post.title}</h1>`
      : `<h1 style="${s.h1}">${post.title}</h1><hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />`;

    // Inject Header Image at the top
    return `<div style="${s.container}">${headerImageHtml}${titleHtml}${html}</div>`;
  };

  const copyToHtmlClipboard = async (platform: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK') => {
    try {
      const finalHtml = await generateHtml(platform);

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
      // 1. Create Container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px';
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      const root = createRoot(container);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 2. Render Cover Page if enabled
      if (includeCover) {
        await new Promise<void>((resolve) => {
          root.render(
            <div className="w-[1200px] h-[1600px] bg-white flex flex-col items-center justify-center p-20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-100 rounded-tl-full opacity-50"></div>

              <div className="z-10 text-center space-y-8">
                <div className="w-32 h-32 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl mb-10">
                  {/* Simple SVG Logo for PDF */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-16 h-16">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                </div>

                <div className="space-y-4">
                  <h1 className="text-6xl font-extrabold text-slate-900 leading-tight max-w-4xl">{post.title}</h1>
                  <div className="w-24 h-2 bg-indigo-500 mx-auto rounded-full"></div>
                </div>

                <div className="pt-20 space-y-2 text-slate-500 text-xl font-medium">
                  <p>ProInsight AI Analytics Report</p>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-0 w-full text-center text-slate-400 text-sm">
                Generated by ProInsight AI
              </div>
            </div>
          );
          setTimeout(resolve, 1000);
        });

        const coverCanvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, windowWidth: 1200 });
        const coverImgData = coverCanvas.toDataURL('image/png');
        pdf.addImage(coverImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.addPage();

        // Unmount to clear for content
        root.unmount();
      }

      // 3. Render Main Content
      // Re-create root if it was unmounted
      const contentRoot = includeCover ? createRoot(container) : root;

      await new Promise<void>((resolve) => {
        contentRoot.render(
          <div className="p-[40px] bg-white min-h-screen">
            {!includeCover && <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{post.title}</h1>}
            <MarkdownRenderer content={post.content} />
          </div>
        );
        setTimeout(resolve, 1500);
      });

      const contentCanvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, windowWidth: 1200 });
      const contentImgData = contentCanvas.toDataURL('image/png');
      const imgHeight = (contentCanvas.height * pdfWidth) / contentCanvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(contentImgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(contentImgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${post.title.replace(/[^a-z0-9가-힣]+/gi, '_').replace(/^_|_$/g, '')}.pdf`);

      contentRoot.unmount();
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
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mr-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              표지 포함
            </label>
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
        <PreviewModal
          type={previewType}
          post={post}
          onClose={() => setPreviewType(null)}
          onCopy={() => copyToHtmlClipboard(previewType)}
          generateHtml={generateHtml}
        />
      )}
    </>
  );
};

// Sub-component for Async Preview Content
const PreviewModal: React.FC<{
  type: 'NAVER' | 'TISTORY' | 'MEDIUM' | 'WORDPRESS' | 'SUBSTACK';
  post: BlogPost;
  onClose: () => void;
  onCopy: () => void;
  generateHtml: (type: any) => Promise<string>;
}> = ({ type, onClose, onCopy, generateHtml }) => {
  const [html, setHtml] = useState<string>('<div class="p-10 text-center text-slate-500">불러오는 중...</div>');

  useEffect(() => {
    generateHtml(type).then(setHtml);
  }, [type]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <EyeIcon className="w-5 h-5 text-indigo-500" /> {type} 스타일 미리보기
          </span>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
          <div className="mx-auto bg-white p-12 shadow-lg min-h-full max-w-3xl rounded-xl border border-slate-200/60">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onCopy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
          >
            <CopyIcon className="w-4 h-4" /> 전체 복사하기
          </button>
        </div>
      </div>
    </div>
  );
};
