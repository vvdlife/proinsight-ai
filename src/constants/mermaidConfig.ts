import { MermaidConfig } from 'mermaid';

export const MERMAID_CONFIG: MermaidConfig = {
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
    `,
};
