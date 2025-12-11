import React, { useMemo } from 'react';
import { BlogFont } from '../types';
import { MermaidDiagram } from './MermaidDiagram';

interface MarkdownRendererProps {
  content: string;
  font?: BlogFont;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content, font = BlogFont.PRETENDARD }) => {

  // Font Class Mapping
  const fontClass = useMemo(() => {
    switch (font) {
      case BlogFont.PRETENDARD: return 'font-pretendard';
      case BlogFont.NOTO_SERIF: return 'font-noto-serif';
      case BlogFont.NANUM_GOTHIC: return 'font-nanum-gothic';
      case BlogFont.RIDIBATANG: return 'font-ridibatang';
      case BlogFont.NANUM_PEN: return 'font-nanum-pen';
      default: return 'font-pretendard';
    }
  }, [font]);

  const renderedContent = useMemo(() => {
    // Advanced parser handling Block elements (Tables, Mermaid) and Inline elements (Bold, Links)
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // 0. Mermaid Diagram Handling
      if (line.trim().startsWith('```mermaid')) {
        const mermaidLines: string[] = [];
        i++; // Skip opening fence
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          mermaidLines.push(lines[i]);
          i++;
        }

        elements.push(
          <MermaidDiagram key={`mermaid-${i}`} chart={mermaidLines.join('\n')} />
        );
        i++; // Skip closing fence
        continue;
      }

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
            <div key={`table-${i}`} className={`my-10 overflow-x-auto rounded-xl border border-slate-200 shadow-sm ${fontClass}`}>
              <table className="w-full min-w-[600px] text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    {headerRow.map((cell, idx) => (
                      <th key={idx} className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">{parseInline(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="even:bg-slate-50 hover:bg-indigo-50/40 transition-colors duration-150 ease-in-out">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-6 py-4 text-slate-600 text-[15px] leading-relaxed border-r border-slate-50 last:border-r-0 min-w-[150px] break-words">{parseInline(cell)}</td>
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
          <h3 key={i} className={`text-xl font-bold text-slate-800 mt-10 mb-4 flex items-center ${fontClass}`}>
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
            {parseInline(line.replace('### ', ''))}
          </h3>
        );
      }
      else if (line.startsWith('## ')) {
        // H2: Bottom border, large size
        elements.push(
          <h2 key={i} className={`text-2xl font-bold text-slate-900 mt-16 mb-6 pb-3 border-b-2 border-slate-100 ${fontClass}`}>
            {parseInline(line.replace('## ', ''))}
          </h2>
        );
      }
      else if (line.startsWith('# ')) {
        // H1: Huge, extrabold
        elements.push(<h1 key={i} className={`text-4xl font-extrabold text-slate-900 mb-10 tracking-tight leading-tight ${fontClass}`}>{parseInline(line.replace('# ', ''))}</h1>);
      }
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        // List: Custom marker color
        elements.push(
          <li key={i} className={`ml-4 flex items-start gap-3 mb-3 text-[17px] text-slate-700 leading-relaxed ${fontClass}`}>
            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
            <span>{parseInline(line.substring(2))}</span>
          </li>
        );
      }
      else if (line.startsWith('> ')) {
        // Blockquote: Serif font, background styling
        elements.push(
          <blockquote key={i} className="font-serif-kr text-xl italic text-slate-700 my-8 pl-6 border-l-4 border-indigo-300 bg-slate-50/80 py-6 pr-6 rounded-r-xl leading-relaxed shadow-sm">
            {parseInline(line.substring(2))}
          </blockquote>
        );
      }
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-6"></div>);
      }
      else {
        // Paragraph: Optimized for reading (size 17px, line-height 1.8)
        elements.push(<p key={i} className={`text-[17px] text-slate-700 leading-[1.8] mb-6 font-normal tracking-normal ${fontClass}`}>{parseInline(line)}</p>);
      }

      i++;
    }

    return elements;
  }, [content, fontClass]);

  return (
    <div className={`prose prose-slate max-w-none ${fontClass}`}>
      {renderedContent}
    </div>
  );
});

// Inline Parser for Bold, Links, and Line Breaks
const parseInline = (text: string): React.ReactNode[] => {
  // Regex for:
  // 1. Line Breaks: <br>, <br/>, <br />
  // 2. Links: [text](url)
  const brRegex = /<br\s*\/?>/gi;
  const parts: React.ReactNode[] = [];

  // Split by <br> first
  const sections = text.split(brRegex);

  sections.forEach((section, idx) => {
    if (idx > 0) parts.push(<br key={`br-${idx}`} />);
    if (section) {
      parts.push(...parseLinks(section));
    }
  });

  return parts;
};

const parseLinks = (text: string): React.ReactNode[] => {
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
        className="text-indigo-600 font-semibold border-b-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 px-0.5 rounded-sm transition-all duration-200 no-underline"
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
