import React, { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content }) => {
  
  const renderedContent = useMemo(() => {
    // Advanced parser handling Block elements (Tables) and Inline elements (Bold, Links)
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // 1. Table Handling
      if (line.trim().startsWith('|')) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableRows.push(lines[i]);
          i++;
        }
        
        if (tableRows.length >= 2) {
           // Basic table parsing
           const headerRow = tableRows[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
           const bodyRows = tableRows.slice(2).map(row => row.split('|').filter(c => c.trim() !== '').map(c => c.trim()));

           elements.push(
             <div key={`table-${i}`} className="my-10 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
               <table className="w-full text-left border-collapse bg-white">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                     {headerRow.map((cell, idx) => (
                       <th key={idx} className="px-6 py-4 font-bold text-slate-800 text-sm uppercase tracking-wider whitespace-nowrap bg-indigo-50/50">{parseInline(cell)}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {bodyRows.map((row, rIdx) => (
                     <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                       {row.map((cell, cIdx) => (
                         <td key={cIdx} className="px-6 py-4 text-slate-700 text-[15px] leading-relaxed">{parseInline(cell)}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           );
           continue; // Already incremented i in the while loop
        }
      }

      // 2. Standard Line Parsing
      if (line.startsWith('### ')) {
        // H3: Left border accent
        elements.push(
            <h3 key={i} className="text-xl font-bold text-slate-800 mt-10 mb-4 flex items-center">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                {parseInline(line.replace('### ', ''))}
            </h3>
        );
      }
      else if (line.startsWith('## ')) {
        // H2: Bottom border, large size
        elements.push(
            <h2 key={i} className="text-2xl font-bold text-slate-900 mt-16 mb-6 pb-3 border-b-2 border-slate-100">
                {parseInline(line.replace('## ', ''))}
            </h2>
        );
      }
      else if (line.startsWith('# ')) {
        // H1: Huge, extrabold
        elements.push(<h1 key={i} className="text-4xl font-extrabold text-slate-900 mb-10 tracking-tight leading-tight">{parseInline(line.replace('# ', ''))}</h1>);
      }
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        // List: Custom marker color
        elements.push(
            <li key={i} className="ml-4 flex items-start gap-3 mb-3 text-[17px] text-slate-700 leading-relaxed">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                <span>{parseInline(line.substring(2))}</span>
            </li>
        );
      }
      else if (line.startsWith('> ')) {
        // Blockquote: Serif font, background styling
        elements.push(
            <blockquote key={i} className="font-serif-kr text-xl italic text-slate-700 my-8 pl-6 border-l-4 border-indigo-300 bg-slate-50/80 py-6 pr-6 rounded-r-xl leading-relaxed">
                {parseInline(line.substring(2))}
            </blockquote>
        );
      }
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-6"></div>);
      }
      else {
        // Paragraph: Optimized for reading (size 17px, line-height 1.8)
        elements.push(<p key={i} className="text-[17px] text-slate-700 leading-[1.8] mb-6 font-normal tracking-normal">{parseInline(line)}</p>);
      }
      
      i++;
    }

    return elements;
  }, [content]);

  return (
    <div className="prose prose-slate max-w-none">
      {renderedContent}
    </div>
  );
});

// Inline Parser for Bold, Links, etc.
const parseInline = (text: string): React.ReactNode[] => {
    // Regex for:
    // 1. Links: [text](url)
    // 2. Bold: **text**
    
    // We split by links first, then bold within chunks
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        // Add text before link
        if (match.index > lastIndex) {
            parts.push(...parseBold(text.substring(lastIndex, match.index)));
        }
        // Add link
        parts.push(
            <a 
                key={match.index} 
                href={match[2]} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 font-bold hover:text-indigo-800 underline decoration-2 decoration-indigo-200 hover:decoration-indigo-600 underline-offset-4 transition-all"
            >
                {match[1]}
            </a>
        );
        lastIndex = linkRegex.lastIndex;
    }
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(...parseBold(text.substring(lastIndex)));
    }
    
    return parts;
};

const parseBold = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Highlighter effect for bold text
            return (
                <strong key={`b-${i}`} className="font-bold text-slate-900 bg-yellow-100/80 px-1 rounded-sm shadow-sm decoration-clone">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
};