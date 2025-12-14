import React, { useState } from 'react';
import ReadingPassage from '../components/ReadingPassage';
import QuestionPanel from '../components/QuestionPanel';
import TimerPanel from '../components/TimerPanel';
import { Passage, QuestionType } from '../types';

interface TestScreenProps {
  passage: Passage;
  onComplete: (answers: Record<string, string[]>) => void;
  onExit: () => void;
  totalTimeLimit?: number; // Defaults to 18 mins (1080s)
}

const TestScreen: React.FC<TestScreenProps> = ({ passage, onComplete, onExit, totalTimeLimit = 1080 }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  
  const currentQuestion = passage.questions[currentQuestionIndex];
  
  // Calculate time per question dynamically
  const questionTimeLimit = Math.floor(totalTimeLimit / passage.questions.length);

  const handleAnswerChange = (selected: string[]) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: selected
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < passage.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now()); // Reset timer for new question
    } else {
      onComplete(answers);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now()); // Reset timer for new question
    }
  };

  // Called from ReadingPassage when a square [■] is clicked
  const handleInsertText = (locationIndex: number) => {
    if (currentQuestion.type !== QuestionType.INSERT_TEXT) return;
    
    // Store selected index as string, e.g., "0", "1", "2", "3"
    handleAnswerChange([locationIndex.toString()]);
  };
  
  const getSelectedInsertLocation = () => {
    if (currentQuestion.type !== QuestionType.INSERT_TEXT) return undefined;
    const ans = answers[currentQuestion.id];
    if (ans && ans.length > 0) return parseInt(ans[0], 10);
    return undefined;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-900 text-white h-14 flex items-center justify-between px-6 shadow-md z-20 shrink-0">
        <div className="font-bold text-lg tracking-wide flex items-center gap-2">
          TOEFL<span className="text-blue-400">Simulator</span>
          <span className="text-xs bg-blue-900 px-2 py-0.5 rounded text-blue-200">Reading</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-sm text-slate-300 hidden md:block">
            Question {currentQuestionIndex + 1} of {passage.questions.length}
          </div>
          
          <TimerPanel 
            questionTimeLimit={questionTimeLimit}
            totalTimeLimit={totalTimeLimit}
            isActive={true}
            onTotalTimeExpire={() => {}}
          />

          <button 
            onClick={onExit}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors font-bold cursor-pointer"
          >
            Exit
          </button>
          
          <button 
            onClick={() => onComplete(answers)}
            className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded font-bold transition-colors shadow-sm"
          >
            Submit
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Passage */}
        <div className="w-1/2 h-full relative border-r border-slate-300">
          <ReadingPassage 
            passage={passage} 
            currentQuestion={currentQuestion}
            onInsertText={handleInsertText}
            selectedInsertLocation={getSelectedInsertLocation()}
          />
        </div>
        
        {/* Resizer Handle (Visual only for now) */}
        <div className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors hidden md:block z-10"></div>

        {/* Right: Question */}
        <div className="w-1/2 h-full bg-slate-50">
          <QuestionPanel
            question={currentQuestion}
            currentAnswer={answers[currentQuestion.id] || []}
            onAnswerChange={handleAnswerChange}
            totalQuestions={passage.questions.length}
            currentIndex={currentQuestionIndex}
            onNext={handleNext}
            onPrev={handlePrev}
            timePerQuestion={questionTimeLimit}
          />
        </div>
      </div>
    </div>
  );
};

export default TestScreen;