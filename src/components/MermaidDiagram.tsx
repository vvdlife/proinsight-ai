import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

mermaid.initialize({
    startOnLoad: false,
    look: 'handDrawn', // Enable Sketch/Hand-Drawn Mode
    theme: 'neutral',
    securityLevel: 'loose',
    fontFamily: '"Nanum Pen Script", cursive',
    themeVariables: {
        fontFamily: '"Nanum Pen Script", cursive',
        fontSize: '20px',
        primaryColor: '#ffffff',
        primaryTextColor: '#374151', // Dark Gray for pencil look
        primaryBorderColor: '#4b5563', // Pencil stroke color
        lineColor: '#374151',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff',
    },
    // Custom CSS disabled to allow Hand-Drawn engine to render natively
    themeCSS: `
        .node rect, .node circle, .node polygon {
            fill: #ffffff !important;
            stroke-width: 2px !important;
        }
        .node .nodeLabel, .node text {
            font-family: 'Nanum Pen Script', cursive !important;
            font-weight: 500 !important;
            font-size: 22px !important; /* Larger for readability */
        }
    `
});

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        const renderChart = async () => {
            if (!containerRef.current) return;

            try {
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (error) {
                console.error('Mermaid render error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setSvg(`
                    <div class="text-red-600 text-sm p-4 border-2 border-red-300 rounded-lg bg-red-50 max-w-2xl mx-auto">
                        <div class="font-bold mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            Mermaid 다이어그램 렌더링 실패
                        </div>
                        <div class="text-xs text-red-700 mt-2">
                            <strong>오류:</strong> ${errorMessage}
                        </div>
                        <div class="text-xs text-gray-600 mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                            💡 <strong>해결 방법:</strong><br/>
                            - 새로고침 후 글을 다시 생성해보세요<br/>
                            - 또는 개발자 도구(F12)의 Console에서 자세한 오류를 확인하세요
                        </div>
                    </div>
                `);
            }
        };

        renderChart();
    }, [chart]);

    return (
        <div
            ref={containerRef}
            className="mermaid my-8 overflow-x-auto p-4 bg-white rounded-xl border border-slate-100 shadow-sm text-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};
