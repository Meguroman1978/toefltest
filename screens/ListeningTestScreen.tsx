import React, { useState, useEffect, useRef } from 'react';
import { ListeningSet } from '../types';
import TimerPanel from '../components/TimerPanel';
import { speakText, stopAudio } from '../utils/audio';

interface ListeningTestScreenProps {
  listeningSet: ListeningSet;
  onComplete: (answers: Record<string, string[]>) => void;
  onExit: () => void;
}

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type Phase = 'SETUP' | 'LISTENING' | 'QUESTIONS';

const ListeningTestScreen: React.FC<ListeningTestScreenProps> = ({ listeningSet, onComplete, onExit }) => {
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [difficulty, setDifficulty] = useState<Difficulty>('INTERMEDIATE');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => stopAudio();
  }, []);

  const startAudio = () => {
    stopAudio(); // Safety clear

    let rate = 1.0;
    // Difficulty Settings
    switch (difficulty) {
        case 'BEGINNER': rate = 0.8; break; // Slow
        case 'INTERMEDIATE': rate = 1.0; break; // Normal
        case 'ADVANCED': rate = 1.2; break; // Fast
    }

    setIsPlaying(true);
    
    // Use the native voice utility
    speakText(listeningSet.transcript, rate, () => {
        setIsPlaying(false);
        setPhase('QUESTIONS'); // Auto-advance
    });
  };

  const handleSetupComplete = (selectedDiff: Difficulty) => {
    setDifficulty(selectedDiff);
    setPhase('LISTENING');
  };

  const handleAnswerSelect = (optionId: string) => {
    const qId = listeningSet.questions[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [qId]: [optionId] }));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentQuestionIndex < listeningSet.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleExitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopAudio();
    onExit();
  };

  // --- PHASE 1: SETUP / GUIDANCE ---
  if (phase === 'SETUP') {
      return (
        <div className="flex flex-col h-screen bg-slate-900 text-white items-center justify-center relative p-6">
            <button 
                onClick={handleExitClick} 
                className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-50 cursor-pointer"
            >
                Exit Test
            </button>
            
            <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 space-y-6 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2 text-indigo-400">Listening Section Guidance</h1>
                    <p className="text-slate-400">Please read the context below before starting.</p>
                </div>

                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <i className={`fas ${listeningSet.type === 'CONVERSATION' ? 'fa-user-friends' : 'fa-chalkboard-teacher'} text-indigo-400`}></i>
                        {listeningSet.type === 'CONVERSATION' ? 'Conversation' : 'Lecture'} Topic
                    </h2>
                    <p className="text-lg font-medium text-white mb-2">{listeningSet.title}</p>
                    <p className="text-slate-300 text-sm italic">{listeningSet.imageDescription}</p>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">Select Difficulty</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => handleSetupComplete('BEGINNER')}
                            className="p-4 rounded-xl border-2 border-green-500/30 bg-green-900/20 hover:bg-green-900/40 hover:border-green-500 transition-all text-center group"
                        >
                            <div className="text-green-400 font-bold mb-1 group-hover:scale-110 transition-transform">Beginner</div>
                            <div className="text-xs text-slate-400">Slow Speed (0.8x)</div>
                            <div className="text-xs text-green-300 mt-1 font-bold">+ English & JP Subs</div>
                        </button>

                        <button 
                            onClick={() => handleSetupComplete('INTERMEDIATE')}
                            className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-500 transition-all text-center group"
                        >
                            <div className="text-blue-400 font-bold mb-1 group-hover:scale-110 transition-transform">Intermediate</div>
                            <div className="text-xs text-slate-400">Normal Speed (1.0x)</div>
                            <div className="text-xs text-blue-300 mt-1 font-bold">+ English Subs</div>
                        </button>

                        <button 
                            onClick={() => handleSetupComplete('ADVANCED')}
                            className="p-4 rounded-xl border-2 border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 hover:border-purple-500 transition-all text-center group"
                        >
                            <div className="text-purple-400 font-bold mb-1 group-hover:scale-110 transition-transform">Advanced</div>
                            <div className="text-xs text-slate-400">Fast Speed (1.2x)</div>
                            <div className="text-xs text-slate-500 mt-1">No Subtitles</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- PHASE 2: LISTENING ---
  if (phase === 'LISTENING') {
    return (
      <div className="flex flex-col h-screen bg-slate-900 text-white items-center justify-center relative">
        <button 
            onClick={handleExitClick} 
            className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-50 cursor-pointer"
        >
            Exit
        </button>
        
        <div className="max-w-3xl w-full text-center space-y-8 p-8 flex flex-col items-center">
           {/* Visual Placeholder */}
           <div className="w-full h-64 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-2xl border border-slate-700 max-w-xl">
              <div className="absolute inset-0 bg-slate-900 opacity-60"></div>
              <img 
                src={`https://placehold.co/800x600/1e293b/white?text=${listeningSet.type}`} 
                alt="Context" 
                className="opacity-30 object-cover w-full h-full absolute"
              />
              
              <div className="relative z-10 flex flex-col items-center">
                  {!isPlaying ? (
                      <button 
                        onClick={startAudio}
                        className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-4xl shadow-2xl transition-transform hover:scale-105 flex items-center justify-center cursor-pointer"
                      >
                        <i className="fas fa-play pl-2"></i>
                      </button>
                  ) : (
                      <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-2xl animate-pulse">
                         <i className="fas fa-volume-up text-4xl"></i>
                      </div>
                  )}
                  <div className="mt-4 font-bold text-lg text-slate-200">
                      {isPlaying ? 'Playing Audio...' : 'Click to Start'}
                  </div>
              </div>
           </div>
           
           {/* Subtitles Area */}
           {(difficulty === 'BEGINNER' || difficulty === 'INTERMEDIATE') && (
               <div className="w-full max-w-2xl bg-black/60 backdrop-blur-sm p-6 rounded-xl border border-white/10 max-h-60 overflow-y-auto text-left shadow-inner space-y-6">
                   
                   {/* English Transcript (Beginner & Intermediate) */}
                   <div>
                       <span className="text-xs font-bold text-indigo-400 block mb-2 uppercase tracking-wider">English Transcript</span>
                       <p className="leading-relaxed text-indigo-50 whitespace-pre-wrap">{listeningSet.transcript}</p>
                   </div>
                   
                   {/* Japanese Transcript (Beginner Only) */}
                   {difficulty === 'BEGINNER' && listeningSet.japaneseTranscript && (
                       <div className="pt-6 border-t border-white/10">
                           <span className="text-xs font-bold text-emerald-400 block mb-2 uppercase tracking-wider">Japanese Translation</span>
                           <p className="leading-relaxed text-emerald-50 whitespace-pre-wrap font-sans">{listeningSet.japaneseTranscript}</p>
                       </div>
                   )}
               </div>
           )}

           {!isPlaying && (
               <button onClick={() => setPhase('QUESTIONS')} className="text-slate-600 hover:text-slate-400 text-xs underline mt-8 cursor-pointer">
                   Debug: Skip Audio
               </button>
           )}
        </div>
      </div>
    );
  }

  // --- PHASE 3: QUESTIONS ---
  const currentQ = listeningSet.questions[currentQuestionIndex];
  const currentAns = answers[currentQ.id] || [];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="bg-slate-900 text-white h-16 flex items-center justify-between px-6 shadow-md z-20">
         <div className="font-bold text-lg flex items-center gap-2">
             <i className="fas fa-headphones text-indigo-400"></i>
             TOEFL Listening
         </div>
         <div className="flex items-center gap-4">
             <TimerPanel questionTimeLimit={120} totalTimeLimit={600} isActive={true} onTotalTimeExpire={() => {}} />
             <button 
                onClick={handleExitClick} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer text-sm"
             >
                 Exit Test
             </button>
         </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
         <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
             <div className="mb-8 border-b border-slate-100 pb-4 flex justify-between items-end">
                 <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                        Question {currentQuestionIndex + 1} of {listeningSet.questions.length}
                    </span>
                    <h2 className="text-2xl font-bold mt-4 text-slate-800 leading-snug">{currentQ.prompt}</h2>
                 </div>
             </div>

             <div className="space-y-4 mb-10">
                 {currentQ.options.map(opt => (
                     <div 
                        key={opt.id}
                        onClick={() => handleAnswerSelect(opt.id)}
                        className={`
                            p-5 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all duration-200 group
                            ${currentAns.includes(opt.id) 
                                ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.01]' 
                                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}
                        `}
                     >
                        <div className={`
                            w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                            ${currentAns.includes(opt.id) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-transparent group-hover:border-indigo-300'}
                        `}>
                            <i className="fas fa-check text-xs"></i>
                        </div>
                        <span className="text-lg text-slate-700 font-medium">{opt.text}</span>
                     </div>
                 ))}
             </div>

             <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button 
                    onClick={handleNext}
                    disabled={currentAns.length === 0}
                    type="button"
                    className={`
                        px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center gap-2
                        ${currentAns.length > 0 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:translate-y-[-2px]' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                 >
                     {currentQuestionIndex === listeningSet.questions.length - 1 ? 'Finish Test' : 'Next Question'}
                     <i className="fas fa-arrow-right"></i>
                 </button>
             </div>
         </div>
      </div>
    </div>
  );
};

export default ListeningTestScreen;