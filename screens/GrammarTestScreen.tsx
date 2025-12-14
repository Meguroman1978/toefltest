import React, { useState, useEffect } from 'react';
import { GrammarQuestion, GrammarLevel } from '../types';

interface GrammarTestScreenProps {
  level: GrammarLevel;
  questions: GrammarQuestion[];
  onComplete: (results: { questionId: string; correct: boolean }[]) => void;
  onExit: () => void;
}

const GrammarTestScreen: React.FC<GrammarTestScreenProps> = ({ 
  level, 
  questions, 
  onComplete, 
  onExit 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [results, setResults] = useState<{ questionId: string; correct: boolean }[]>([]);

  const currentQuestion = questions[currentIndex];
  const isAnswered = userAnswers[currentQuestion.id] !== undefined;
  const isCorrect = userAnswers[currentQuestion.id] === currentQuestion.correctAnswer;

  const handleAnswer = (optionId: string) => {
    if (!isAnswered) {
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: optionId
      });
      setShowExplanation(true);

      // Record result
      const newResult = {
        questionId: currentQuestion.id,
        correct: optionId === currentQuestion.correctAnswer
      };
      setResults([...results, newResult]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    } else {
      // Complete test
      onComplete([...results]);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(userAnswers[questions[currentIndex - 1].id] !== undefined);
    }
  };

  const getLevelColor = () => {
    switch (level) {
      case 'BEGINNER': return 'green';
      case 'INTERMEDIATE': return 'blue';
      case 'ADVANCED': return 'purple';
      default: return 'gray';
    }
  };

  const getLevelName = () => {
    switch (level) {
      case 'BEGINNER': return '初級';
      case 'INTERMEDIATE': return '中級';
      case 'ADVANCED': return '上級';
      default: return '';
    }
  };

  const color = getLevelColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <div className={`bg-${color}-600 text-white p-6 shadow-lg`}>
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">文法特訓 - {getLevelName()}</h1>
              <p className="text-sm opacity-90 mt-1">{currentQuestion.grammarPoint}</p>
            </div>
            <button
              onClick={onExit}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
            >
              <i className="fas fa-times mr-2"></i>終了
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-white/80 mt-2">
            問題 {currentIndex + 1} / {questions.length}
          </p>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="mb-6">
              <div className={`inline-block px-4 py-2 bg-${color}-100 text-${color}-800 rounded-full text-sm font-bold mb-4`}>
                {currentQuestion.grammarPoint}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = userAnswers[currentQuestion.id] === option.id;
                const isCorrectOption = option.id === currentQuestion.correctAnswer;
                
                let bgColor = 'bg-white hover:bg-slate-50';
                let borderColor = 'border-slate-200';
                let textColor = 'text-slate-700';

                if (isAnswered) {
                  if (isCorrectOption) {
                    bgColor = 'bg-green-50';
                    borderColor = 'border-green-500';
                    textColor = 'text-green-900';
                  } else if (isSelected && !isCorrectOption) {
                    bgColor = 'bg-red-50';
                    borderColor = 'border-red-500';
                    textColor = 'text-red-900';
                  }
                } else if (isSelected) {
                  bgColor = `bg-${color}-50`;
                  borderColor = `border-${color}-500`;
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option.id)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border-2 ${bgColor} ${borderColor} ${textColor} text-left transition-all font-medium ${
                      !isAnswered ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        isAnswered && isCorrectOption 
                          ? 'bg-green-500 text-white' 
                          : isAnswered && isSelected && !isCorrectOption
                          ? 'bg-red-500 text-white'
                          : `bg-slate-200 ${textColor}`
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{option.text}</span>
                      {isAnswered && isCorrectOption && (
                        <i className="fas fa-check-circle text-green-600 text-xl"></i>
                      )}
                      {isAnswered && isSelected && !isCorrectOption && (
                        <i className="fas fa-times-circle text-red-600 text-xl"></i>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={`mt-6 p-6 rounded-xl ${
                isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-green-500' : 'bg-amber-500'
                  } text-white text-xl`}>
                    <i className={`fas ${isCorrect ? 'fa-check' : 'fa-lightbulb'}`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {isCorrect ? '正解です！' : '解説'}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-slate-700 leading-relaxed mb-3">
                      {currentQuestion.explanation}
                    </p>
                  </div>

                  {currentQuestion.example && (
                    <div className="bg-white/50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-semibold text-slate-600 mb-2">例文:</p>
                      <p className="text-slate-700 italic">"{currentQuestion.example}"</p>
                    </div>
                  )}

                  {currentQuestion.reference && (
                    <p className="text-xs text-slate-500 mt-3">
                      <i className="fas fa-book mr-2"></i>
                      参考: {currentQuestion.reference}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentIndex === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-slate-100 shadow-md'
              }`}
            >
              <i className="fas fa-arrow-left mr-2"></i>前へ
            </button>

            <div className="text-center text-sm text-slate-600">
              {Object.keys(userAnswers).length} / {questions.length} 問回答済み
            </div>

            {isAnswered && (
              <button
                onClick={handleNext}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors shadow-md bg-${color}-600 hover:bg-${color}-700 text-white`}
              >
                {currentIndex === questions.length - 1 ? (
                  <>結果を見る<i className="fas fa-check ml-2"></i></>
                ) : (
                  <>次へ<i className="fas fa-arrow-right ml-2"></i></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarTestScreen;
