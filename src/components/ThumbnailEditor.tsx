import React, { useRef, useState, useEffect } from 'react';
import { DownloadIcon } from './Icons';

interface ThumbnailEditorProps {
    originalImage: string;
    defaultText: string;
}

export const ThumbnailEditor: React.FC<ThumbnailEditorProps> = ({ originalImage, defaultText }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [text, setText] = useState(defaultText);
    const [fontSize, setFontSize] = useState(60);
    const [textColor, setTextColor] = useState('#FFFFFF'); // 기본 흰색
    const [bgColor, setBgColor] = useState('rgba(0,0,0,0.6)'); // 배경 반투명 검정
    const [yPosition, setYPosition] = useState(50); // % 위치 (50 = 중앙)

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = originalImage;

        img.onload = () => {
            // 1. 캔버스 크기 설정
            canvas.width = img.width;
            canvas.height = img.height;

            // 2. 이미지 그리기
            ctx.drawImage(img, 0, 0);

            // 3. 텍스트 설정
            ctx.font = `bold ${fontSize}px 'Pretendard', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const x = canvas.width / 2;
            const y = (canvas.height * yPosition) / 100;

            // 4. 텍스트 배경 박스 (선택 사항 - 가독성을 위해)
            const textMetrics = ctx.measureText(text);
            const padding = 40;
            const textWidth = textMetrics.width;
            const textHeight = fontSize * 1.2; // 근사치

            ctx.fillStyle = bgColor;
            ctx.beginPath();
            // roundRect is not supported in all older browsers, but modern ones support it.
            // If needed, we can implement a polyfill or use rect.
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(
                    x - textWidth / 2 - padding,
                    y - textHeight / 2 - padding,
                    textWidth + padding * 2,
                    textHeight + padding * 2,
                    20
                );
            } else {
                ctx.rect(
                    x - textWidth / 2 - padding,
                    y - textHeight / 2 - padding,
                    textWidth + padding * 2,
                    textHeight + padding * 2
                );
            }
            ctx.fill();

            // 5. 텍스트 그리기
            ctx.fillStyle = textColor;
            ctx.fillText(text, x, y);
        };
    }, [originalImage, text, fontSize, textColor, bgColor, yPosition]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'custom-thumbnail.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="w-full space-y-4">
            <div className="relative group rounded-xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100">
                <canvas ref={canvasRef} className="w-full h-auto max-h-[500px] object-contain" />
                <button
                    onClick={handleDownload}
                    className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                >
                    <DownloadIcon className="w-4 h-4" /> 이미지 다운로드
                </button>
            </div>

            {/* 컨트롤 패널 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 gap-4">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">썸네일 문구</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded text-sm font-medium outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">위치 ({yPosition}%)</label>
                        <input
                            type="range" min="10" max="90" value={yPosition}
                            onChange={(e) => setYPosition(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 mb-1 block">폰트 크기</label>
                        <input
                            type="range" min="30" max="150" value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
