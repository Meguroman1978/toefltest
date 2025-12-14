import React from 'react';
import { WritingTask, SpeakingTask } from '../types';

interface FeedbackResultScreenProps {
  score: number;
  maxScore: number;
  feedback: string;
  type: 'SPEAKING' | 'WRITING';
  task?: WritingTask | SpeakingTask;
  onHome: () => void;
}

const FeedbackResultScreen: React.FC<FeedbackResultScreenProps> = ({ score, maxScore, feedback, type, task, onHome }) => {
  const isSpeaking = type === 'SPEAKING';
  const writingTask = !isSpeaking && task ? task as WritingTask : null;
  
  // Theme configuration based on test type
  const theme = isSpeaking ? {
    color: 'orange',
    bg: 'bg-orange-600',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-900',
    icon: 'fa-microphone',
    gradient: 'from-orange-50 to-white',
    scoreColor: score >= maxScore * 0.8 ? 'text-emerald-500' : score >= maxScore * 0.5 ? 'text-orange-500' : 'text-red-500'
  } : {
    color: 'purple',
    bg: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    icon: 'fa-pen-nib',
    gradient: 'from-purple-50 to-white',
    scoreColor: score >= maxScore * 0.8 ? 'text-emerald-500' : score >= maxScore * 0.5 ? 'text-purple-500' : 'text-red-500'
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-y-auto font-sans">
      <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
        
        {/* Header Card */}
        <div className={`bg-white rounded-xl shadow-lg p-8 mb-6 text-center border-t-8 border-${theme.color}-600 relative overflow-hidden`}>
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${theme.color}-100 rounded-bl-full opacity-50 -mr-10 -mt-10`}></div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isSpeaking ? 'Speaking' : 'Writing'} Assessment
          </h1>
          <p className="text-slate-500 mb-8 font-serif italic text-lg">AI Evaluation Result</p>
          
          <div className="flex justify-center items-center mb-8">
            <div className="text-center">
              <div className={`text-8xl font-extrabold mb-2 ${theme.scoreColor}`}>
                {score}<span className="text-4xl text-slate-300 font-normal">/{maxScore}</span>
              </div>
              <div className="text-xs tracking-widest text-slate-500 font-bold uppercase">Estimated Score</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={onHome} className="bg-slate-800 text-white px-8 py-3 rounded-full hover:bg-slate-900 transition-colors font-bold shadow-lg flex items-center gap-2">
              <i className="fas fa-home"></i> Return Home
            </button>
          </div>
        </div>

        {/* Reference Text Section (Writing Only) */}
        {writingTask && writingTask.type === 'INTEGRATED' && writingTask.reading && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 mb-6">
            <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                <i className="fas fa-book-open"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Reference Text</h2>
            </div>
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 max-h-64 overflow-y-auto">
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {writingTask.reading}
              </div>
            </div>
            {writingTask.listeningTranscript && (
              <div className="mt-4 bg-blue-50 p-6 rounded-lg border border-blue-200 max-h-64 overflow-y-auto">
                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <i className="fas fa-headphones"></i>
                  Lecture Transcript
                </h3>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {writingTask.listeningTranscript}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Feedback Section */}
        <div className={`bg-gradient-to-br ${theme.gradient} rounded-xl shadow-md border ${theme.border} p-8 animate-fade-in`}>
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4">
            <div className={`w-10 h-10 rounded-full ${theme.bg} text-white flex items-center justify-center shadow-md`}>
              <i className={`fas ${theme.icon}`}></i>
            </div>
            <h2 className={`text-2xl font-bold ${theme.text}`}>Detailed Feedback</h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-100">
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed space-y-3">
              {feedback}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FeedbackResultScreen;
