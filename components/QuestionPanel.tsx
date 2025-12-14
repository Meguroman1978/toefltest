import React from 'react';
import { Question, QuestionType } from '../types';

interface QuestionPanelProps {
  question: Question;
  currentAnswer: string[];
  onAnswerChange: (answer: string[]) => void;
  totalQuestions: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  totalQuestions,
  currentIndex,
  onNext,
  onPrev
}) => {

  const handleOptionClick = (optionId: string) => {
    if (question.type === QuestionType.SINGLE_CHOICE) {
      onAnswerChange([optionId]);
    } else if (question.type === QuestionType.PROSE_SUMMARY) {
      if (currentAnswer.includes(optionId)) {
        onAnswerChange(currentAnswer.filter(id => id !== optionId));
      } else {
        if (currentAnswer.length < 3) {
          onAnswerChange([...currentAnswer, optionId]);
        }
      }
    }
  };

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index); // A, B, C...

  const renderSingleChoice = () => (
    <div className="space-y-3 mt-4">
      {question.options.map((opt, index) => (
        <div 
          key={opt.id}
          onClick={() => handleOptionClick(opt.id)}
          className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all flex items-start gap-3
            ${currentAnswer.includes(opt.id) 
              ? 'border-blue-600 bg-blue-50 text-blue-900' 
              : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'}
          `}
        >
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
            ${currentAnswer.includes(opt.id) ? 'border-blue-600' : 'border-slate-300'}
          `}>
             {currentAnswer.includes(opt.id) ? <div className="w-3 h-3 rounded-full bg-blue-600" /> : <span className="text-xs font-bold text-slate-400">{getOptionLabel(index)}</span>}
          </div>
          <span className="text-base font-medium">{opt.text}</span>
        </div>
      ))}
    </div>
  );

  const renderProseSummary = () => (
    <div className="space-y-4 mt-4">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 mb-2">
        <strong>Directions:</strong> Select 3 answer choices that express the most important ideas in the passage.
      </div>
      <div className="grid grid-cols-1 gap-3">
        {question.options.map((opt, index) => (
          <div 
            key={opt.id}
            onClick={() => handleOptionClick(opt.id)}
            className={`
              p-3 rounded border-2 cursor-pointer transition-all flex items-start gap-3
              ${currentAnswer.includes(opt.id) 
                ? 'border-blue-600 bg-blue-100' 
                : 'border-slate-200 hover:bg-slate-50'}
            `}
          >
             <div className={`
              w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
              ${currentAnswer.includes(opt.id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 bg-white'}
            `}>
              {currentAnswer.includes(opt.id) ? <i className="fas fa-check text-xs"></i> : <span className="text-xs font-bold text-slate-400">{getOptionLabel(index)}</span>}
            </div>
            <span className="text-sm pt-0.5">{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInsertText = () => {
      const selectedIndex = currentAnswer.length > 0 ? parseInt(currentAnswer[0], 10) : -1;
      
      const labels = ["First square", "Second square", "Third square", "Fourth square"];
      const selectedLabel = selectedIndex >= 0 && selectedIndex < labels.length 
          ? labels[selectedIndex] 
          : "None selected";

      return (
        <div className="mt-6 space-y-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="font-bold text-slate-800 mb-2">Sentence to Insert:</p>
                <p className="text-lg font-serif italic text-blue-900 bg-white p-4 rounded shadow-sm border border-slate-200">
                    "{question.options[0]?.text}"
                </p>
                <p className="mt-4 text-sm text-slate-500">
                    Click on <span className="font-bold">[ ■ Sentence to Insert ]</span> in the passage.
                </p>
            </div>

            <div className="p-4 border-2 border-slate-300 rounded-lg bg-white flex justify-between items-center">
                <span className="text-slate-500 font-bold">Selected Answer:</span>
                <span className={`text-lg font-bold ${selectedIndex >= 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    {selectedLabel}
                </span>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
        <h2 className="text-lg font-bold text-slate-800">Question {currentIndex + 1} of {totalQuestions}</h2>
        <div className="flex gap-2">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded bg-slate-200 text-slate-700 font-semibold disabled:opacity-50 hover:bg-slate-300 transition-colors"
            >
              Back
            </button>
            <button 
              onClick={onNext}
              className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md transition-colors"
            >
              {currentIndex === totalQuestions - 1 ? 'Finish Test' : 'Next'}
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-xl font-medium text-slate-900 leading-relaxed">
              {question.type === QuestionType.INSERT_TEXT 
                ? "Look at the four squares [■] in the passage that indicate where the following sentence could be added to the passage."
                : question.prompt}
            </h3>
          </div>

          {question.type === QuestionType.INSERT_TEXT 
            ? renderInsertText()
            : question.type === QuestionType.PROSE_SUMMARY 
              ? renderProseSummary() 
              : renderSingleChoice()
          }
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
