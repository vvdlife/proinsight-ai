import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
    chart: string;
}

mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'loose',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    themeVariables: {
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        fontSize: '15px',
        primaryColor: '#ffffff',
        primaryTextColor: '#1e293b', // Slate 800
        primaryBorderColor: '#cbd5e1', // Slate 300
        lineColor: '#64748b', // Slate 500
        secondaryColor: '#f1f5f9', // Slate 100
        tertiaryColor: '#ffffff',
    },
    themeCSS: `
        /* ---------------------------------------------------------
           Silicon Valley "Card" Design System for Mermaid
           Clean, Minimal, High-Contrast, Shadow-Depth
           --------------------------------------------------------- */
        
        /* 1. Base Node Styling (The "Card") */
        g.node rect,
        g.node polygon,
        g.node circle {
            fill: #ffffff !important;
            stroke: #cbd5e1 !important; /* Slate 300 - Delicate Border */
            stroke-width: 1.5px !important;
            rx: 10px !important;
            ry: 10px !important;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.04)) !important; /* Soft Elevation */
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* 2. Strong Typography */
        .node .nodeLabel, 
        .node text {
            font-family: 'Pretendard', sans-serif !important;
            font-weight: 600 !important;
            fill: #1e293b !important; /* Slate 800 */
            font-size: 15px !important;
            letter-spacing: -0.01em !important;
        }

        /* 3. Icon Integration */
        .node i {
            color: #475569 !important; /* Slate 600 */
        }

        /* 4. Highlight / Hero Nodes (The "Primary Action") */
        /* Usage: classDef highlight fill:#4f46e5,color:#fff,stroke:none */
        g.node.highlight rect,
        g.node.highlight polygon,
        g.node.highlight circle {
            fill: #4f46e5 !important; /* Indigo 600 */
            stroke: #4338ca !important; /* Indigo 700 */
            stroke-width: 0px !important;
            filter: drop-shadow(0 8px 16px rgba(79, 70, 229, 0.25)) !important; /* Glowing Depth */
        }
        g.node.highlight .nodeLabel, 
        g.node.highlight text {
            fill: #ffffff !important;
            font-weight: 700 !important;
        }
        g.node.highlight i {
            color: #ffffff !important;
        }

        /* 5. Edge / Connector Styling */
        .edgePath .path, 
        .flowchart-link {
            stroke: #94a3b8 !important; /* Slate 400 */
            stroke-width: 2px !important;
            stroke-linecap: round !important;
            fill: none !important;
        }
        .marker {
            fill: #94a3b8 !important; /* Arrowhead */
            stroke: #94a3b8 !important;
        }

        /* 6. Edge Labels (Context Bubbles) */
        .edgeLabel rect {
            fill: #f8fafc !important; /* Slate 50 */
            stroke: #e2e8f0 !important;
            stroke-width: 1px !important;
            rx: 6px !important;
        }
        .edgeLabel .label {
            fill: #64748b !important; /* Slate 500 */
            font-size: 12px !important;
            font-weight: 500 !important;
        }

        /* 7. Hover Interaction */
        g.node:hover rect,
        g.node:hover polygon,
        g.node:hover circle {
            stroke: #6366f1 !important; /* Indigo 500 */
            filter: drop-shadow(0 12px 20px rgba(99, 102, 241, 0.15)) !important;
            transform: translateY(-2px);
            cursor: default;
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
