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
             <div key={`table-${i}`} className="my-8 overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
               <table className="w-full text-left border-collapse bg-white">
                 <thead>
                   <tr className="bg-slate-100 border-b border-slate-200">
                     {headerRow.map((cell, idx) => (
                       <th key={idx} className="px-6 py-4 font-bold text-slate-700 text-sm uppercase tracking-wider">{parseInline(cell)}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {bodyRows.map((row, rIdx) => (
                     <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                       {row.map((cell, cIdx) => (
                         <td key={cIdx} className="px-6 py-4 text-slate-600 text-sm whitespace-pre-wrap">{parseInline(cell)}</td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           );
           continue; // Already incremented i in the while loop
        }
        // Fallback if not a valid table structure, reset i to start of table block logic
        // But for simplicity in this regex parser, we just proceed if it wasn't caught as a block.
      }

      // 2. Standard Line Parsing
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-xl font-bold text-slate-800 mt-6 mb-3">{parseInline(line.replace('### ', ''))}</h3>);
      }
      else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-2xl font-bold text-slate-900 mt-10 mb-5 pb-2 border-l-4 border-indigo-500 pl-4">{parseInline(line.replace('## ', ''))}</h2>);
      }
      else if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-3xl font-extrabold text-slate-900 mb-6">{parseInline(line.replace('# ', ''))}</h1>);
      }
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={i} className="ml-4 list-disc text-slate-700 mb-2 pl-2 marker:text-indigo-400">{parseInline(line.substring(2))}</li>);
      }
      else if (line.startsWith('> ')) {
        elements.push(<blockquote key={i} className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4 bg-slate-50 py-3 pr-3 rounded-r shadow-sm">{parseInline(line.substring(2))}</blockquote>);
      }
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-4"></div>);
      }
      else {
        elements.push(<p key={i} className="text-slate-700 leading-relaxed mb-4 text-lg">{parseInline(line)}</p>);
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
                className="text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 hover:decoration-indigo-800 underline-offset-2 transition-all font-medium"
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
            return <strong key={`b-${i}`} className="font-semibold text-indigo-900 bg-indigo-50 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};