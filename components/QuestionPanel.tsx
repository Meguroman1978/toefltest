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
  timePerQuestion?: number; // Time limit per question in seconds
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  totalQuestions,
  currentIndex,
  onNext,
  onPrev,
  timePerQuestion
}) => {
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      
      const positions = [
        { label: "Position 1 (First ■)", value: 0 },
        { label: "Position 2 (Second ■)", value: 1 },
        { label: "Position 3 (Third ■)", value: 2 },
        { label: "Position 4 (Fourth ■)", value: 3 }
      ];
      
      const selectedPosition = positions.find(p => p.value === selectedIndex);

      return (
        <div className="mt-6 space-y-6">
            {/* Sentence to Insert */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-md">
                <p className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-quote-left text-blue-600"></i>
                  Sentence to Insert:
                </p>
                <p className="text-lg font-serif text-slate-900 bg-white p-4 rounded-lg shadow-sm border border-slate-200 leading-relaxed">
                    {question.options[0]?.text}
                </p>
                <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-600 rounded">
                  <p className="text-sm text-blue-900 flex items-center gap-2">
                    <i className="fas fa-info-circle"></i>
                    <span>Click on the <strong>[■]</strong> buttons in the passage (left side) to select where this sentence should be inserted.</span>
                  </p>
                </div>
            </div>

            {/* Visual Selection Status */}
            <div className={`p-5 border-3 rounded-xl shadow-lg transition-all ${
              selectedIndex >= 0 
                ? 'bg-green-50 border-green-500' 
                : 'bg-slate-50 border-slate-300'
            }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-600 font-medium mb-1">Your Selection:</p>
                    <p className={`text-2xl font-bold flex items-center gap-2 ${
                      selectedIndex >= 0 ? 'text-green-700' : 'text-slate-400'
                    }`}>
                      {selectedIndex >= 0 ? (
                        <>
                          <i className="fas fa-check-circle text-green-600"></i>
                          {selectedPosition?.label}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-square text-slate-300"></i>
                          No position selected yet
                        </>
                      )}
                    </p>
                  </div>
                  {selectedIndex >= 0 && (
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {selectedIndex + 1}
                    </div>
                  )}
                </div>
            </div>

            {/* Interactive Position Selector (Buttons) */}
            <div className="p-4 bg-slate-100 rounded-lg border border-slate-300">
              <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <i className="fas fa-hand-pointer"></i>
                Click a position to select it:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => {
                      onAnswerChange([pos.value.toString()]);
                    }}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedIndex === pos.value
                        ? 'bg-blue-600 border-blue-700 text-white shadow-md scale-105'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <span className="font-bold text-lg">■</span>
                      <span className="text-sm">{pos.label}</span>
                      {selectedIndex === pos.value && (
                        <i className="fas fa-check ml-auto"></i>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Question {currentIndex + 1} of {totalQuestions}</h2>
          {timePerQuestion && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
              <i className="fas fa-clock text-blue-600 text-sm"></i>
              <span className="text-sm font-bold text-blue-700">
                ~{formatTime(timePerQuestion)} per Q
              </span>
            </div>
          )}
        </div>
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
