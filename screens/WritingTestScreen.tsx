import React, { useState, useEffect } from 'react';
import TimerPanel from '../components/TimerPanel';
import { WritingTask } from '../types';
import { gradeWritingResponse } from '../services/geminiService';
import { speakText, stopAudio } from '../utils/audio';

interface WritingTestScreenProps {
  task: WritingTask;
  onComplete: (score: number, feedback: string) => void;
  onExit: () => void;
}

const WritingTestScreen: React.FC<WritingTestScreenProps> = ({ task, onComplete, onExit }) => {
  const [step, setStep] = useState<'READING' | 'LISTENING' | 'WRITING'>('WRITING');
  const [response, setResponse] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize step based on type
  useEffect(() => {
    if (task.type === 'INTEGRATED') {
      setStep('READING');
    } else {
      setStep('WRITING');
    }
  }, [task]);

  // Handle word count
  useEffect(() => {
    const words = response.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(words);
  }, [response]);

  const handleReadingDone = () => setStep('LISTENING');
  const handleListeningDone = () => {
    // Stop audio if playing
    stopAudio();
    setStep('WRITING');
  };

  const playAudio = () => {
      if (!task.listeningTranscript) return;
      
      if (isPlaying) {
          stopAudio();
          setIsPlaying(false);
          return;
      }

      setIsPlaying(true);
      speakText(task.listeningTranscript, 1.0, () => {
          setIsPlaying(false);
      });
  };

  const minWords = task.type === 'INTEGRATED' ? 150 : 100;
  const remainingWords = Math.max(0, minWords - wordCount);

  const handleSubmit = async (e: React.MouseEvent) => {
      e.preventDefault();
      if (wordCount < 10) {
          alert("Your response is too short. Please write at least a few sentences.");
          return;
      }
      
      if (window.confirm("Submit your essay for AI Grading?")) {
          setIsSubmitting(true);
          try {
            // Actual API Call to Grade
            const result = await gradeWritingResponse(task, response);
            onComplete(result.score, result.feedback);
          } catch (e) {
            console.error(e);
            alert("Grading failed. Please try again.");
            setIsSubmitting(false);
          }
      }
  };

  const handleExit = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopAudio();
      onExit();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      {/* Header */}
      <div className="bg-slate-900 text-white h-14 flex items-center justify-between px-6 shadow-md z-20 shrink-0">
        <div className="font-bold text-lg tracking-wide flex items-center gap-2">
          TOEFL<span className="text-purple-400">Simulator</span>
          <span className="text-xs bg-purple-900 px-2 py-0.5 rounded text-purple-200">Writing</span>
        </div>
        
        <div className="flex items-center gap-6">
          {step === 'WRITING' && (
            <TimerPanel 
                questionTimeLimit={task.type === 'INTEGRATED' ? 1200 : 600} 
                totalTimeLimit={task.type === 'INTEGRATED' ? 1200 : 600}
                isActive={!isTimeUp && !isSubmitting}
                onTotalTimeExpire={() => setIsTimeUp(true)}
            />
          )}
          <button 
            onClick={handleExit}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded transition-colors cursor-pointer font-bold"
            type="button"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Source Material */}
        <div className="w-1/2 bg-white border-r border-slate-200 overflow-y-auto p-8">
            {task.type === 'INTEGRATED' && (
                <>
                    {step === 'READING' && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl font-bold mb-4 text-slate-800">Reading Passage</h2>
                            <p className="text-sm text-slate-500 mb-4 font-bold uppercase tracking-wider">Time: 3 Minutes</p>
                            <div className="prose text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {task.reading}
                            </div>
                            <button onClick={handleReadingDone} className="mt-8 w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
                                Continue to Lecture
                            </button>
                        </div>
                    )}
                    {step === 'LISTENING' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                             <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                                <i className="fas fa-headphones text-4xl"></i>
                             </div>
                             <h3 className="text-xl font-bold mb-2">Listen to the Lecture</h3>
                             <p className="text-slate-500 mb-8 max-w-md">The lecturer is discussing the topic from the reading. Click Play to listen.</p>
                             
                             <button 
                                onClick={playAudio}
                                className={`mb-6 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl transition-all shadow-lg ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}`}
                             >
                                <i className={`fas ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>
                             </button>

                             <div className="bg-slate-50 p-6 rounded-lg text-left max-w-lg shadow-inner text-sm leading-relaxed mb-6 max-h-64 overflow-y-auto border opacity-50 hover:opacity-100 transition-opacity">
                                <span className="font-bold text-xs text-slate-400 block mb-2">TRANSCRIPT (Hidden during real test)</span>
                                {task.listeningTranscript}
                             </div>

                             <button onClick={handleListeningDone} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold">
                                Start Writing
                             </button>
                        </div>
                    )}
                    {step === 'WRITING' && (
                        <div className="h-full flex flex-col">
                           <div className="mb-4">
                               <h3 className="font-bold text-slate-400 text-xs uppercase mb-2">Reading Reference</h3>
                               <div className="h-48 overflow-y-auto p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
                                   {task.reading}
                               </div>
                           </div>
                           <h3 className="font-bold text-lg mb-2">Question</h3>
                           <p className="text-slate-800 font-medium">{task.question}</p>
                        </div>
                    )}
                </>
            )}

            {task.type === 'ACADEMIC_DISCUSSION' && (
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Professor`} alt="Prof" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Professor</h3>
                                <div className="text-xs text-slate-500">Academic Discussion</div>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl rounded-tl-none border border-blue-100 text-slate-800 leading-relaxed">
                            {task.question}
                        </div>
                    </div>

                    {task.studentResponses?.map((student, idx) => (
                        <div key={idx}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                     <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt={student.name} />
                                </div>
                                <span className="font-bold text-sm text-slate-700">{student.name}</span>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
                                {student.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Right Panel: Editor */}
        <div className="w-1/2 bg-slate-50 flex flex-col p-8 relative">
             {step === 'WRITING' ? (
                 <>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Your Response</h3>
                        <div className="flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${remainingWords > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                {remainingWords > 0 ? `${remainingWords} words to go` : 'Minimum met'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">
                                Total: {wordCount}
                            </span>
                        </div>
                    </div>
                    
                    <textarea
                        className="flex-1 w-full p-6 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none font-serif text-lg leading-relaxed bg-white text-slate-900"
                        placeholder="Type your response here..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        spellCheck={false}
                    ></textarea>
                    
                    <div className="mt-4 flex justify-between items-center">
                         <div className="text-xs text-slate-400">
                            Target: {minWords}+ words
                         </div>
                         <button 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`px-8 py-3 rounded-lg font-bold shadow-md transition-colors cursor-pointer ${isSubmitting ? 'bg-slate-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                            type="button"
                        >
                             {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <i className="fas fa-spinner fa-spin"></i> AI Grading...
                                </span>
                             ) : 'Submit Response'}
                         </button>
                    </div>
                 </>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">
                     <p>Please complete the previous steps to begin writing.</p>
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default WritingTestScreen;
