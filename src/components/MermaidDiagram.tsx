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
        /* Base Node Style - Clean Card Look */
        g.node rect,
        g.node polygon,
        g.node circle,
        g.node path {
            fill: #FFFFFF !important;
            stroke: #E2E8F0 !important;
            stroke-width: 2px !important;
            rx: 12px !important;
            ry: 12px !important;
            filter: drop-shadow(0 4px 6px rgba(148, 163, 184, 0.1)) !important;
            transition: all 0.3s ease !important;
        }

        /* Base Text Style - Dark & Readable */
        .nodeLabel, .node text {
            fill: #1E293B !important; /* Slate 800 */
            color: #1E293B !important;
            font-family: 'Pretendard', sans-serif !important;
            font-weight: 700 !important;
            font-size: 14px !important;
        }

        /* Icon Style matching text */
        .node i {
            color: #1E293B !important;
        }

        /* --------------------------------------------------------
           Highlighted / Hero Nodes (Using 'classDef highlight') 
           This must match the prompt's instruction: classDef highlight fill:#6366F1,stroke:#4338CA,color:#fff
           We override it here for consistency 
        -------------------------------------------------------- */
        g.node.highlight rect,
        g.node.highlight polygon,
        g.node.highlight circle {
            fill: #4F46E5 !important; /* Indigo 600 */
            stroke: #4338CA !important; /* Indigo 700 */
            stroke-width: 0px !important;
            filter: drop-shadow(0 8px 16px rgba(79, 70, 229, 0.3)) !important;
        }

        /* Hero Text */
        g.node.highlight .nodeLabel, 
        g.node.highlight text {
            fill: #FFFFFF !important;
            color: #FFFFFF !important;
            font-weight: 800 !important;
        }
        g.node.highlight i {
            color: #FFFFFF !important;
        }

        /* --------------------------------------------------------
           Links / Edges
        -------------------------------------------------------- */
        .edgePath path, .flowchart-link {
            stroke: #94A3B8 !important; /* Slate 400 */
            stroke-width: 2px !important;
            opacity: 0.8 !important;
        }
        .edgeLabel {
            background-color: #F8FAFC !important;
            color: #64748B !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 11px !important;
        }

        /* --------------------------------------------------------
           Interactive / Hover
        -------------------------------------------------------- */
        g.node:hover rect {
            stroke: #6366F1 !important;
            transform: translateY(-2px);
            filter: drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2)) !important;
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
