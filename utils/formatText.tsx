import React from 'react';

/**
 * Convert markdown-style text to clean, readable React elements
 * Removes asterisks and renders proper HTML formatting
 */
export const formatMarkdownToReact = (text: string): React.ReactNode[] => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-5 mb-3 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    // Handle headings
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg font-bold text-slate-800 mt-4 mb-2">
          {cleanMarkdown(line.substring(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${index}`} className="text-base font-bold text-slate-700 mt-3 mb-2">
          {cleanMarkdown(line.substring(4))}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${index}`} className="text-sm font-semibold text-slate-700 mt-2 mb-1">
          {cleanMarkdown(line.substring(5))}
        </h4>
      );
    } 
    // Handle numbered lists
    else if (line.match(/^\d+\.\s/)) {
      flushList();
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={`num-${index}`} className="mb-2">
          {parseInlineMarkdown(content)}
        </div>
      );
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.substring(2);
      listItems.push(
        <li key={`li-${index}`} className="text-slate-700">
          {parseInlineMarkdown(content)}
        </li>
      );
    }
    // Handle empty lines
    else if (line.trim() === '') {
      flushList();
      elements.push(<div key={`br-${index}`} className="h-2" />);
    }
    // Handle regular paragraphs
    else if (line.trim()) {
      flushList();
      elements.push(
        <p key={`p-${index}`} className="mb-2 text-slate-700">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  });

  flushList();
  return elements;
};

/**
 * Parse inline markdown (bold, italic, code) and return React elements
 */
const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let partKey = 0;

  // Pattern to match **bold**, *italic*, or `code`
  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    // Add formatted text
    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={`bold-${partKey++}`} className="font-semibold text-slate-800">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={`italic-${partKey++}`} className="italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={`code-${partKey++}`} className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono">
          {match[6]}
        </code>
      );
    }

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * Clean markdown formatting from text (remove asterisks, etc.)
 */
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')     // Remove *italic*
    .replace(/`([^`]+)`/g, '$1')       // Remove `code`
    .replace(/^#+\s/, '')              // Remove # headers
    .trim();
};

/**
 * Simple function to render text with basic formatting
 * Use this for simple text display without full markdown parsing
 */
export const formatSimpleText = (text: string): React.ReactNode => {
  return formatMarkdownToReact(text);
};
