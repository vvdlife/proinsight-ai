import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // A very basic parser for demonstration. In production, use react-markdown.
  // This handles headers, bold text, lists, and paragraphs.
  const renderLine = (line: string, index: number) => {
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3">{line.replace('### ', '')}</h3>;
    }
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">{line.replace('## ', '')}</h2>;
    }
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-3xl font-extrabold text-slate-900 mb-6">{line.replace('# ', '')}</h1>;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={index} className="ml-4 list-disc text-slate-700 mb-1">{parseInline(line.substring(2))}</li>;
    }
    if (line.trim() === '') {
      return <div key={index} className="h-4"></div>;
    }
    return <p key={index} className="text-slate-700 leading-relaxed mb-4">{parseInline(line)}</p>;
  };

  const parseInline = (text: string) => {
    // Simple bold parser
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-indigo-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="prose prose-slate max-w-none">
      {content.split('\n').map((line, i) => renderLine(line, i))}
    </div>
  );
};