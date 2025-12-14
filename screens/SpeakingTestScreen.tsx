import React, { useState, useEffect, useRef } from 'react';
import { SpeakingTask } from '../types';
import { gradeSpeakingResponse } from '../services/geminiService';
import { speakText, stopAudio } from '../utils/audio';

interface SpeakingTestScreenProps {
  task: SpeakingTask;
  onComplete: (score: number, feedback: string) => void;
  onExit: () => void;
}

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type Phase = 'SETUP' | 'READING' | 'LISTENING' | 'PREPARATION' | 'RECORDING' | 'GRADING';

const SpeakingTestScreen: React.FC<SpeakingTestScreenProps> = ({ task, onComplete, onExit }) => {
  // Start with SETUP phase
  const [phase, setPhase] = useState<Phase>('SETUP');
  const [difficulty, setDifficulty] = useState<Difficulty>('INTERMEDIATE');
  const [timeLeft, setTimeLeft] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Timer Logic
  useEffect(() => {
      let interval: number;
      if (timeLeft > 0) {
          interval = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else {
          handlePhaseTimeout();
      }
      return () => clearInterval(interval);
  }, [timeLeft, phase]);

  const handlePhaseTimeout = () => {
      if (timeLeft > 0) return; // Prevent double firing
      
      switch (phase) {
          case 'READING':
              setPhase('LISTENING');
              break;
          case 'PREPARATION':
              startRecording();
              break;
          case 'RECORDING':
              stopRecording();
              break;
      }
  };

  const handleSetupComplete = (selectedDiff: Difficulty) => {
      setDifficulty(selectedDiff);
      
      // Determine next phase based on Task Type
      if (task.type === 'INTEGRATED') {
          if (task.reading) {
              setPhase('READING');
              setTimeLeft(45); // 45s Reading
          } else {
              setPhase('LISTENING');
          }
      } else {
          // Task 1 (Independent) has no Reading/Listening usually (in this simulation at least)
          // But to be safe, if there's no reading/listening, go to Prep
          setPhase('PREPARATION');
          setTimeLeft(task.preparationTime);
      }
  };

  const startListeningAudio = () => {
      if (!task.listeningTranscript) {
          setPhase('PREPARATION');
          setTimeLeft(task.preparationTime);
          return;
      }
      
      let rate = 1.0;
      switch (difficulty) {
          case 'BEGINNER': rate = 0.8; break;
          case 'INTERMEDIATE': rate = 1.0; break;
          case 'ADVANCED': rate = 1.2; break;
      }

      setIsPlaying(true);
      // Use the utility to speak with a native voice
      speakText(task.listeningTranscript, rate, () => {
          setIsPlaying(false);
          setPhase('PREPARATION');
          setTimeLeft(task.preparationTime);
      });
  };

  const startRecording = () => {
      setPhase('RECORDING');
      setTimeLeft(task.recordingTime);
      
      // Init Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US'; // Explicitly set to US English
          
          recognitionRef.current.onresult = (event: any) => {
              let final = '';
              let interim = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      final += event.results[i][0].transcript;
                  } else {
                      interim += event.results[i][0].transcript;
                  }
              }
              if (final) {
                  setTranscript(prev => (prev + " " + final).trim());
              } else if (interim) {
                  // Show interim results in real-time
                  setTranscript(prev => (prev + " " + interim).trim());
              }
          };
          
          recognitionRef.current.onerror = (event: any) => {
              console.error("Speech Recognition Error:", event.error);
              if (event.error === 'not-allowed') {
                  alert("Microphone access blocked. Please check your browser settings.");
              }
          };
          
          try {
              recognitionRef.current.start();
          } catch (e) {
              console.error("Failed to start recognition:", e);
          }
      } else {
          alert("Speech recognition not supported in this browser. Please use Chrome.");
      }
  };

  const stopRecording = async () => {
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
      setPhase('GRADING');
      
      try {
          const result = await gradeSpeakingResponse(task, transcript || "No speech detected.");
          onComplete(result.score, result.feedback);
      } catch (e) {
          alert("Grading failed.");
          onExit();
      }
  };

  // --- PHASE 1: SETUP ---
  if (phase === 'SETUP') {
    return (
      <div className="flex flex-col h-screen bg-slate-900 text-white items-center justify-center relative p-6">
          <button 
              onClick={onExit} 
              className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg z-50 cursor-pointer"
          >
              Exit
          </button>
          
          <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 space-y-6 animate-fade-in">
              <div className="text-center">
                  <h1 className="text-3xl font-bold mb-2 text-orange-400">Speaking Section Setup</h1>
                  <p className="text-slate-400">Select your difficulty mode before starting.</p>
              </div>

              <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button 
                          onClick={() => handleSetupComplete('BEGINNER')}
                          className="p-4 rounded-xl border-2 border-green-500/30 bg-green-900/20 hover:bg-green-900/40 hover:border-green-500 transition-all text-center group"
                      >
                          <div className="text-green-400 font-bold mb-1 group-hover:scale-110 transition-transform">Beginner</div>
                          <div className="text-xs text-slate-400">Slow Audio (0.8x)</div>
                          <div className="text-xs text-green-300 mt-1 font-bold">+ English & JP Subs</div>
                      </button>

                      <button 
                          onClick={() => handleSetupComplete('INTERMEDIATE')}
                          className="p-4 rounded-xl border-2 border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-500 transition-all text-center group"
                      >
                          <div className="text-blue-400 font-bold mb-1 group-hover:scale-110 transition-transform">Intermediate</div>
                          <div className="text-xs text-slate-400">Normal Audio (1.0x)</div>
                          <div className="text-xs text-blue-300 mt-1 font-bold">+ English Subs</div>
                      </button>

                      <button 
                          onClick={() => handleSetupComplete('ADVANCED')}
                          className="p-4 rounded-xl border-2 border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 hover:border-purple-500 transition-all text-center group"
                      >
                          <div className="text-purple-400 font-bold mb-1 group-hover:scale-110 transition-transform">Advanced</div>
                          <div className="text-xs text-slate-400">Fast Audio (1.2x)</div>
                          <div className="text-xs text-slate-500 mt-1">No Subtitles</div>
                      </button>
                  </div>
              </div>
          </div>
      </div>
    );
  }

  // --- MAIN UI ---
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white items-center justify-center p-6 relative">
      <button onClick={onExit} className="absolute top-4 right-4 bg-red-600 px-4 py-2 rounded font-bold cursor-pointer hover:bg-red-700 z-50">Exit</button>

      {phase === 'READING' && (
          <div className="bg-white text-slate-800 p-8 rounded-xl max-w-2xl w-full">
              <h2 className="text-xl font-bold mb-4">Read the Passage</h2>
              <div className="bg-slate-100 p-4 rounded mb-4 text-sm leading-relaxed max-h-96 overflow-y-auto">{task.reading}</div>
              <div className="text-center font-bold text-red-500">Time Left: {timeLeft}s</div>
              <button onClick={() => setTimeLeft(0)} className="mt-4 w-full bg-blue-600 text-white py-2 rounded font-bold cursor-pointer hover:bg-blue-700">Finished Reading</button>
          </div>
      )}

      {phase === 'LISTENING' && (
          <div className="text-center w-full max-w-2xl flex flex-col items-center">
              <i className="fas fa-headphones text-6xl mb-6"></i>
              <h2 className="text-2xl font-bold mb-4">Listen to the Conversation/Lecture</h2>
              
              {/* Subtitles Container */}
              {(difficulty === 'BEGINNER' || difficulty === 'INTERMEDIATE') && task.listeningTranscript && (
                 <div className="w-full bg-black/50 p-6 rounded-xl border border-white/10 max-h-48 overflow-y-auto text-left shadow-inner space-y-4 mb-6">
                    <div>
                       <span className="text-xs font-bold text-orange-400 block mb-1">ENGLISH</span>
                       <p className="text-sm text-slate-200">{task.listeningTranscript}</p>
                    </div>
                    {difficulty === 'BEGINNER' && task.japaneseListeningTranscript && (
                        <div className="pt-2 border-t border-white/10">
                           <span className="text-xs font-bold text-emerald-400 block mb-1">JAPANESE</span>
                           <p className="text-sm text-slate-200">{task.japaneseListeningTranscript}</p>
                        </div>
                    )}
                 </div>
              )}

              {!isPlaying ? (
                <button onClick={startListeningAudio} className="bg-green-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-green-700 shadow-lg cursor-pointer transform hover:scale-105 transition-all">
                    <i className="fas fa-play mr-2"></i> Play Audio
                </button>
              ) : (
                <div className="flex items-center gap-2 text-green-400 font-bold animate-pulse">
                     <i className="fas fa-volume-up"></i> Playing Audio ({difficulty === 'BEGINNER' ? '0.8x' : difficulty === 'ADVANCED' ? '1.2x' : '1.0x'})...
                </div>
              )}
          </div>
      )}

      {phase === 'PREPARATION' && (
          <div className="text-center animate-fade-in max-w-2xl">
               <h2 className="text-3xl font-bold mb-4">Prepare your response</h2>
               <div className="text-6xl font-mono font-bold text-yellow-400 mb-6">{timeLeft}</div>
               <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-200 text-lg leading-relaxed">{task.prompt}</p>
               </div>
               <div className="mt-4 text-slate-500 text-sm">
                   <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                   Tip: Use a template like "The reading states X, but the speaker disagrees because Y..."
               </div>
          </div>
      )}

      {phase === 'RECORDING' && (
          <div className="text-center animate-fade-in">
              <div className="w-24 h-24 bg-red-600 rounded-full animate-ping mx-auto mb-8"></div>
              <h2 className="text-3xl font-bold mb-4">Recording...</h2>
              <div className="text-6xl font-mono font-bold text-red-500 mb-6">{timeLeft}</div>
              <p className="text-slate-400 italic">Speak clearly into your microphone.</p>
              
              <div className="mt-8 relative w-full max-w-lg mx-auto">
                  <div className="absolute top-0 left-0 text-xs font-bold text-slate-500 mb-1">LIVE TRANSCRIPT PREVIEW</div>
                  <div className="p-4 bg-slate-800 rounded text-sm text-left h-32 overflow-y-auto border border-slate-700 text-slate-300">
                      {transcript || <span className="opacity-30 italic">Listening for speech...</span>}
                  </div>
              </div>
          </div>
      )}

      {phase === 'GRADING' && (
          <div className="text-center animate-fade-in">
              <i className="fas fa-spinner fa-spin text-4xl mb-4 text-blue-400"></i>
              <h2 className="text-xl">AI is analyzing your response...</h2>
              <p className="text-slate-500 text-sm mt-2">Checking grammar, pronunciation, and content structure.</p>
          </div>
      )}
    </div>
  );
};

export default SpeakingTestScreen;