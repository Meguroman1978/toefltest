import React from 'react';
import { Passage, Question, QuestionType } from '../types';

interface ReadingPassageProps {
  passage: Passage;
  currentQuestion: Question;
  onInsertText?: (locationIndex: number) => void;
  selectedInsertLocation?: number; // 0-3 index of the square
}

// Utility to parse markdown bold (**text**) and clean HTML
const parseText = (text: string) => {
    // Remove HTML tags for safety, then parse markdown
    const noHtml = text.replace(/<[^>]*>?/gm, '');
    const parts = noHtml.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-slate-900 bg-yellow-100 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

const ReadingPassage: React.FC<ReadingPassageProps> = ({ 
  passage, 
  currentQuestion,
  onInsertText,
  selectedInsertLocation
}) => {
  
  const isInsertQuestion = currentQuestion.type === QuestionType.INSERT_TEXT;

  const renderParagraph = (text: string, pIndex: number) => {
    const isTargetParagraph = currentQuestion.paragraphReference === pIndex;
    const isHighlighted = isTargetParagraph && !isInsertQuestion;

    // Logic for INSERT_TEXT questions
    // Only render interactive buttons if it IS an Insert Question AND this is the target paragraph
    if (isInsertQuestion && isTargetParagraph) {
      // Regex to catch [■], [ ■ ], or just ■
      const splitRegex = /(\[\s*■\s*\]|\[\u25A0\]|■)/g;
      const parts = text.split(splitRegex);
      
      // If no markers found, just render text
      if (parts.length <= 1) return parseText(text);

      let squareIndex = 0;

      return (
        <span className="leading-loose">
          {parts.map((part, i) => {
            // Check if this part matches our marker regex
            if (part.match(splitRegex)) {
              const currentIndex = squareIndex++; // Capture current index value
              const isSelected = selectedInsertLocation === currentIndex;

              // RENDER AS A ROBUST BUTTON with unique styling
              return (
                <button
                  key={`marker-${i}-${currentIndex}`}
                  type="button"
                  onClick={() => {
                    console.log(`[■] Marker ${currentIndex} clicked`);
                    if (onInsertText) {
                      onInsertText(currentIndex);
                      console.log(`onInsertText called with index: ${currentIndex}`);
                    } else {
                      console.warn('onInsertText handler not provided');
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center justify-center mx-2 align-middle transition-all duration-200 shadow-lg cursor-pointer select-none font-bold
                    ${isSelected 
                      ? 'bg-blue-600 border-2 border-blue-800 text-white px-4 py-2 rounded-lg shadow-xl scale-110' 
                      : 'bg-slate-800 border-2 border-slate-600 text-white hover:bg-slate-700 hover:scale-105 px-3 py-1 rounded-md opacity-95 hover:opacity-100'
                    }
                  `}
                  style={{ 
                    zIndex: isSelected ? 100 : 50,
                    position: 'relative'
                  }}
                  aria-label={`Insert sentence at location ${currentIndex + 1}`}
                  title={isSelected ? "Selected for insertion" : `Click to select position ${currentIndex + 1}`}
                >
                    {isSelected ? (
                        <span className="text-sm whitespace-nowrap flex items-center gap-2">
                            <i className="fas fa-check-circle"></i>
                            <span>Selected (Position {currentIndex + 1})</span>
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span className="text-xl">■</span>
                            <span className="text-xs opacity-75">{currentIndex + 1}</span>
                        </span>
                    )}
                </button>
              );
            }
            // Normal text
            return <span key={i}>{parseText(part)}</span>;
          })}
        </span>
      );
    }

    // Default rendering for non-insert questions OR non-target paragraphs
    // We replace the markers with static text to avoid confusion if they exist in the text
    const cleanText = text.replace(/(\[\s*■\s*\]|\[\u25A0\]|■)/g, ''); 
    
    return (
      <div className="relative group">
        {isHighlighted && (
           <div className="absolute -left-6 top-0 text-blue-600 text-xl animate-pulse">
             <i className="fas fa-arrow-right"></i>
           </div>
        )}
        <span className={`${isHighlighted ? "bg-blue-50/80 rounded px-1 box-decoration-clone border-l-4 border-blue-400 pl-2 block shadow-sm" : ""}`}>
          {parseText(!isInsertQuestion ? cleanText : text)}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full bg-white overflow-y-auto reading-scroll p-8 border-r border-slate-200 shadow-inner relative">
      <h2 className="text-2xl font-bold font-serif mb-6 text-slate-800 text-center uppercase tracking-wide border-b pb-4 border-slate-100">
        {passage.title}
      </h2>
      <div className="space-y-6 font-serif text-lg leading-relaxed text-slate-700 pb-20">
        {passage.paragraphs.map((para, idx) => (
          <div key={idx} className="relative">
             <span className="absolute -left-6 top-1 text-xs text-slate-300 font-sans select-none font-bold">{idx + 1}</span>
             <div className="paragraph-content">
                {renderParagraph(para, idx)}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingPassage;