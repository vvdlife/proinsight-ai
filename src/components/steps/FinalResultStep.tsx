import React, { useState, useEffect } from 'react';
import { PenIcon, RefreshIcon, CheckIcon, XIcon, DownloadIcon, ImageIcon, CopyIcon } from '../Icons';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { BlogFont } from '../../types';
import { SeoAnalyzer } from '../SeoAnalyzer';
import { SocialGenerator } from '../SocialGenerator';
import { ThumbnailEditor } from '../ThumbnailEditor';
import { useBlogContext } from '../../context/BlogContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


export const FinalResultStep: React.FC = () => {
    const {
        resetAll: onReset,
        selectedFont, setSelectedFont: onFontChange,
        activeLang, setActiveLang: onLangChange,
        finalPost, setFinalPost,
        finalPostEn, setFinalPostEn,
        topic,
        selectedTone
    } = useBlogContext();

    // Local UI State for Editing
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    // Handlers for Edit Mode
    const onEdit = () => {
        const post = activeLang === 'ko' ? finalPost : finalPostEn;
        if (post) {
            setEditTitle(post.title);
            setEditContent(post.content);
            setIsEditing(true);
        }
    };

    const onCancelEdit = () => {
        setIsEditing(false);
        setEditTitle('');
        setEditContent('');
    };

    const onSaveEdit = () => {
        if (activeLang === 'ko') {
            setFinalPost(finalPost ? { ...finalPost, title: editTitle, content: editContent } : null);
        } else {
            setFinalPostEn(finalPostEn ? { ...finalPostEn, title: editTitle, content: editContent } : null);
        }
        setIsEditing(false);
    };

    const onCopyToClipboard = () => {
        if (!finalPost) return;
        const post = activeLang === 'ko' ? finalPost : finalPostEn;
        if (!post) return;
        const textToCopy = `# ${post.title} \n\n${post.content} `;
        navigator.clipboard.writeText(textToCopy);
        alert("클립보드에 복사되었습니다!");
    };


    const currentPost = activeLang === 'ko' ? finalPost : finalPostEn;

    if (!currentPost) return null;

    // Helper for SEO Highlighting (matches SeoAnalyzer props)
    // Helper for SEO Highlighting
    const handleHighlight = (text: string) => {
        if (isEditing) {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                const index = editContent.indexOf(text);
                if (index !== -1) {
                    textarea.focus();
                    textarea.setSelectionRange(index, index + text.length);
                    // Scroll to selection
                    const lineHeight = 24; // approx
                    const lines = editContent.substring(0, index).split('\n').length;
                    textarea.scrollTop = lines * lineHeight - textarea.clientHeight / 2;
                } else {
                    alert("편집기에서 해당 문구를 찾을 수 없습니다. (내용이 수정되었을 수 있습니다)");
                }
            }
        } else {
            // View Mode
            // Try to find the text in the rendered view
            // Since markdown rendering might change the text (e.g. # Header vs Header), this is inexact.
            // Simple approach: Use window.find() if available, or just alert user to switch to edit mode.
            if ((window as any).find && (window as any).find(text)) {
                // Found and highlighted by browser
            } else {
                // If not found (e.g. markdown syntax vs rendered), ask to edit
                const confirmEdit = window.confirm(`뷰어에서 정확한 위치를 찾기 어렵습니다.\n'편집 모드'로 전환하여 해당 위치를 찾으시겠습니까?\n\n찾을 내용: "${text.substring(0, 20)}..."`);
                if (confirmEdit) {
                    onEdit();
                    // We need to wait for state update and render. 
                    // Use setTimeout to allow render cycle to complete
                    setTimeout(() => {
                        // Re-run highlighting in edit mode
                        const textarea = document.querySelector('textarea');
                        if (textarea) { // Re-query
                            const index = currentPost.content.indexOf(text); // Use currentPost.content as editContent might not be set yet inside this closure scope fully if strictly React, but we set it in onEdit. 
                            // Wait, onEdit sets state. editContent will be set.
                            // But we need to use the value.
                            if (index !== -1) {
                                textarea.focus();
                                textarea.setSelectionRange(index, index + text.length);
                                const lines = currentPost.content.substring(0, index).split('\n').length;
                                textarea.scrollTop = lines * 24 - textarea.clientHeight / 2;
                            }
                        }
                    }, 100);
                }
            }
        }
    };


    // Export Logic
    const handleExportHtml = () => {
        const htmlContent = `
      <html>
        <head><title>${currentPost.title}</title></head>
        <body>
          <h1>${currentPost.title}</h1>
          ${currentPost.content.replace(/\n/g, '<br/>')}
        </body>
      </html>
    `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPost.title}.html`;
        a.click();
    };

    const handleExportMarkdown = () => {
        const textContent = `# ${currentPost.title}\n\n${currentPost.content}`;
        const blob = new Blob([textContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentPost.title}.md`;
        a.click();
    };

    const handleExportPdf = async () => {
        const element = document.getElementById('blog-content-area');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${currentPost.title}.pdf`);
        } catch (error) {
            console.error("PDF Export Failed", error);
            alert("PDF 저장 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-20 z-30">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        <RefreshIcon className="w-4 h-4" />
                        새 글 쓰기
                    </button>

                    {/* Language Tabs */}
                    {finalPostEn && (
                        <div className="flex bg-slate-100 rounded-lg p-1 ml-4">
                            <button
                                onClick={() => onLangChange('ko')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeLang === 'ko' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                한국어
                            </button>
                            <button
                                onClick={() => onLangChange('en')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeLang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                English
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Font Selector */}
                    <div className="flex items-center gap-2 mr-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-400">폰트:</span>
                        <select
                            value={selectedFont}
                            onChange={(e) => onFontChange(e.target.value as BlogFont)}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none"
                        >
                            <option value={BlogFont.PRETENDARD}>Pretendard (기본/Clean)</option>
                            <option value={BlogFont.WANTED_SANS}>Wanted Sans (트렌디/Modern)</option>
                            <option value={BlogFont.NANUM_SQUARE_NEO}>나눔스퀘어 네오 (가독성/Bold)</option>
                            <option value={BlogFont.NOTO_SERIF}>Noto Serif (명조/Classic)</option>
                            <option value={BlogFont.GMARKET_SANS}>G마켓 산스 (임팩트/Title)</option>
                        </select>
                    </div>

                    {!isEditing ? (
                        <>
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-indigo-300 transition-all font-medium text-sm shadow-sm"
                            >
                                <PenIcon className="w-4 h-4" /> 편집
                            </button>
                            <button
                                onClick={onCopyToClipboard}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                            >
                                <CopyIcon className="w-4 h-4" /> 블로그 업로드용 복사
                            </button>
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm">
                                    <DownloadIcon className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden hidden group-hover:block animate-in fade-in zoom-in-95 duration-200 z-50">
                                    <button onClick={handleExportHtml} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">HTML로 저장</button>
                                    <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">Markdown으로 저장</button>
                                    <button onClick={handleExportPdf} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">PDF로 저장</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onSaveEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm shadow-md"
                            >
                                <CheckIcon className="w-4 h-4" /> 저장
                            </button>
                            <button
                                onClick={onCancelEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg font-bold text-sm"
                            >
                                <XIcon className="w-4 h-4" /> 취소
                            </button>
                            <div className="text-xs text-slate-400 ml-2 animate-pulse font-medium">편집 모드</div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Thumbnail Section */}
                    {currentPost.images && currentPost.images.length > 0 && (
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                            <ThumbnailEditor
                                originalImage={currentPost.images[0]}
                                defaultText={currentPost.title}
                            />
                        </div>
                    )}

                    {/* Blog Post Content */}
                    <div id="blog-content-area" className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px]">
                        {isEditing ? (
                            <div className="p-8 space-y-6">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-3xl font-bold p-2 border-b-2 border-slate-100 focus:border-indigo-500 outline-none"
                                    placeholder="제목을 입력하세요"
                                />
                                <div className="relative">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full h-[600px] p-4 text-base leading-relaxed resize-none outline-none border border-slate-200 rounded-lg focus:border-indigo-500 font-mono text-slate-700"
                                        placeholder="내용을 입력하세요..."
                                    />
                                    <div className="absolute right-4 bottom-4 text-xs text-slate-400 bg-white/80 px-2 rounded">
                                        Markdown 문법이 지원됩니다
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <article className="prose prose-slate prose-lg max-w-none p-8 sm:p-12">
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-8 leading-tight">{currentPost.title}</h1>
                                <MarkdownRenderer content={currentPost.content} font={selectedFont} />
                            </article>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: SEO & Social */}
                <div className="space-y-6 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2 custom-scrollbar">
                    {/* SEO Analyzer */}
                    <div className="space-y-6">
                        <SeoAnalyzer
                            title={currentPost.title}
                            content={currentPost.content}
                            keyword={topic}
                            language={activeLang}
                            tone={selectedTone}
                            onHighlight={handleHighlight}
                        />

                        {/* Social Media Posts */}
                        {currentPost.socialPosts && currentPost.socialPosts.length > 0 && (
                            <SocialGenerator posts={currentPost.socialPosts} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
