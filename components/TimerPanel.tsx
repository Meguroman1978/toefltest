import React, { useEffect, useState } from 'react';

interface TimerPanelProps {
  questionTimeLimit: number;
  totalTimeLimit: number;
  isActive: boolean;
  onTotalTimeExpire: () => void;
}

const TimerPanel: React.FC<TimerPanelProps> = ({ 
  questionTimeLimit, 
  totalTimeLimit, 
  isActive
}) => {
  const [questionTime, setQuestionTime] = useState(questionTimeLimit);
  const [totalTime, setTotalTime] = useState(totalTimeLimit);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    setQuestionTime(questionTimeLimit);
  }, [questionTimeLimit]);

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        // Count down, allowing negatives
        setQuestionTime(prev => prev - 1);
        setTotalTime(prev => prev - 1);
        // Count up
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const format = (s: number) => {
    const isNegative = s < 0;
    const abs = Math.abs(s);
    const mins = Math.floor(abs / 60);
    const secs = abs % 60;
    return `${isNegative ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-4 text-xs font-mono bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm">
      <div className={`flex flex-col items-center px-2 ${questionTime < 0 ? 'text-red-500 animate-pulse font-bold' : questionTime < 30 ? 'text-yellow-400' : 'text-blue-300'}`}>
        <span className="text-[10px] uppercase text-slate-400">Current Q</span>
        <span className="font-bold">{format(questionTime)}</span>
      </div>
      <div className="w-px bg-slate-600"></div>
      <div className={`flex flex-col items-center px-2 ${totalTime < 0 ? 'text-red-500 font-bold' : 'text-slate-200'}`}>
        <span className="text-[10px] uppercase text-slate-400">Total Left</span>
        <span className="font-bold">{format(totalTime)}</span>
      </div>
      <div className="w-px bg-slate-600"></div>
      <div className="flex flex-col items-center px-2 text-slate-400">
        <span className="text-[10px] uppercase text-slate-500">Elapsed</span>
        <span>{format(elapsedTime)}</span>
      </div>
    </div>
  );
};

export default TimerPanel;
