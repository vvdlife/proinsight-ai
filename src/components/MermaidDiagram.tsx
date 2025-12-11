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
        // Modern color palette with gradients
        primaryColor: '#EEF2FF',
        primaryTextColor: '#1E293B',
        primaryBorderColor: '#818CF8',
        lineColor: '#94A3B8',
        secondaryColor: '#FEF3C7',
        tertiaryColor: '#ECFDF5',

        // Node styling
        mainBkg: '#FFFFFF',
        nodeBorder: '#E2E8F0',
        clusterBkg: '#F8FAFC',
        clusterBorder: '#CBD5E1',

        // Text
        nodeTextColor: '#0F172A',
        fontSize: '16px',
        fontWeight: '600',
    },
    themeCSS: `
        /* Modern node styling with gradients and shadows */
        .node rect,
        .node circle,
        .node polygon,
        .node path {
            fill: #6366F1 !important;
            stroke: #4338CA !important;
            stroke-width: 0px !important;
            rx: 8px !important;
            ry: 8px !important;
            filter: drop-shadow(0 4px 6px rgba(99, 102, 241, 0.25)) !important;
            transition: all 0.3s ease !important;
        }
        
        /* Different solid colors for each level */
        .section-0 rect, .section-0 circle {
            fill: #7C3AED !important; /* Violet 600 */
        }
        
        .section-1 rect, .section-1 circle {
            fill: #DB2777 !important; /* Pink 600 */
        }
        
        .section-2 rect, .section-2 circle {
            fill: #EA580C !important; /* Orange 600 */
        }
        
        .section-3 rect, .section-3 circle {
            fill: #059669 !important; /* Emerald 600 */
        }
        
        /* Root/center node - special styling */
        .node:first-child rect,
        .mindmap-node-0 rect {
            fill: #4F46E5 !important;
            stroke: #4338CA !important;
            stroke-width: 3px !important;
            rx: 16px !important;
            filter: drop-shadow(0 10px 15px rgba(79, 70, 229, 0.25)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) !important;
        }
        
        /* Text styling */
        .nodeLabel,
        .node text,
        text.nodeLabel {
            color: #FFFFFF !important;
            fill: #FFFFFF !important;
            font-size: 15px !important;
            font-weight: 600 !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            font-family: 'Pretendard', -apple-system, sans-serif !important;
        }
        
        /* Connection lines - modern style */
        .edgePath path,
        .flowchart-link {
            stroke: #94A3B8 !important;
            stroke-width: 2.5px !important;
            stroke-linecap: round !important;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05)) !important;
        }
        
        /* Hover effects */
        .node:hover rect,
        .node:hover circle {
            filter: drop-shadow(0 8px 12px rgba(99, 102, 241, 0.25)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.12)) !important;
            transform: translateY(-2px) !important;
        }
        
        /* Cluster/group styling */
        .cluster rect {
            fill: #F8FAFC !important;
            stroke: #CBD5E1 !important;
            stroke-width: 2px !important;
            rx: 16px !important;
            stroke-dasharray: 5,5 !important;
            opacity: 0.6 !important;
        }
        
        /* Clean background */
        .mermaid {
            background: transparent !important;
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
