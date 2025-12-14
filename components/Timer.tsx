import React, { useEffect } from 'react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
  onTick: (newSeconds: number) => void;
  onExpire: () => void;
}

const Timer: React.FC<TimerProps> = ({ seconds, isActive, onTick, onExpire }) => {
  useEffect(() => {
    let interval: number | undefined;

    if (isActive && seconds > 0) {
      interval = window.setInterval(() => {
        onTick(seconds - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      onExpire();
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, onTick, onExpire]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`font-mono text-lg font-bold ${seconds < 300 ? 'text-red-600' : 'text-slate-700'}`}>
      <i className="far fa-clock mr-2"></i>
      {formatTime(seconds)}
    </div>
  );
};

export default Timer;
