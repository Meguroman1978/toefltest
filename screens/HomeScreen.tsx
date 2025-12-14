import React, { useState, useEffect, useRef } from 'react';
import { TestMode, PerformanceRecord } from '../types';
import { speakText, stopAudio } from '../utils/audio';
import { generateHistoryAnalysis } from '../services/geminiService';
import VocabBookScreen from './VocabBookScreen';
import KnowledgeUpdateScreen from './KnowledgeUpdateScreen';

interface HomeScreenProps {
  onStart: (topic: string, mode: TestMode, isIntensive?: boolean, weakCat?: string) => void;
  isLoading: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<TestMode>('READING');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVocabBook, setShowVocabBook] = useState(false);
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false); 
  const [history, setHistory] = useState<PerformanceRecord[]>([]);
  
  // History Analysis State
  const [historyAnalysis, setHistoryAnalysis] = useState<string | null>(null);
  const [isAnalyzingHistory, setIsAnalyzingHistory] = useState(false);

  // Mic Test State
  const [micLevel, setMicLevel] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('toefl_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
    
    return () => {
        stopMicTest(); // Cleanup on unmount
    };
  }, []);

  const clearHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("本当にログを削除して良いですか？\n(過去の試験結果がすべて削除されます)")) {
      localStorage.removeItem('toefl_history');
      setHistory([]);
      setHistoryAnalysis(null);
      setShowHistory(false);
    }
  };
  
  const handleAnalyzeHistory = async () => {
      if (history.length === 0) {
          alert("データがありません。まずはテストを受けてください。");
          return;
      }
      setIsAnalyzingHistory(true);
      try {
          const result = await generateHistoryAnalysis(history);
          setHistoryAnalysis(result);
      } catch (e) {
          alert("分析に失敗しました。");
      } finally {
          setIsAnalyzingHistory(false);
      }
  };
  
  const startMicTest = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicActive(true);
        
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;
        
        const updateLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize somewhat to 0-100
            setMicLevel(Math.min(100, average * 2));
            animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
    } catch (err) {
        console.error("Mic Error:", err);
        alert("Microphone access denied or not found. Please check your browser settings.");
        setIsMicActive(false);
    }
  };
  
  const stopMicTest = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
      setIsMicActive(false);
      setMicLevel(0);
  };
  
  const testAudioOutput = () => {
      speakText("This is a test of the native speaker voice system. Good luck with your exam!");
  };

  const categories = {
    "Humanities": ["History", "Anthropology", "Psychology", "Philosophy", "Political Science"],
    "Social Sciences": ["Economics", "Geography", "Archaeology", "Education", "Business"],
    "Natural Sciences": ["Biology", "Geology", "Astronomy", "Chemistry", "Physics", "Medicine", "Ecology"],
    "Arts": ["Art History", "Music", "Theater"]
  };
  
  const ranking = ["Biology", "History", "Art History", "Anthropology", "Psychology"];

  const renderHistoryChart = () => {
    const cats = Array.from(new Set(history.map(h => h.category)));
    return (
        <div className="bg-white p-4 rounded-lg shadow-inner mb-4 max-h-64 overflow-y-auto custom-scroll border border-slate-100">
            <h4 className="text-sm font-bold mb-4 border-b pb-2 flex justify-between items-center text-slate-700">
                <span>Category Breakdown</span>
                <button 
                    onClick={clearHistory}
                    className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors cursor-pointer font-bold border border-red-200"
                    type="button"
                >
                    <i className="fas fa-trash-alt mr-1"></i> Clear Data
                </button>
            </h4>
            {cats.length === 0 ? <p className="text-xs text-slate-500 text-center py-8">No test data available yet.</p> : cats.map(cat => {
                const recs = history.filter(h => h.category === cat);
                const total = recs.reduce((sum, r) => sum + r.total, 0);
                const correct = recs.reduce((sum, r) => sum + r.correct, 0);
                const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                return (
                    <div key={cat} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700">{cat}</span>
                            <span className="text-slate-500 font-mono">{correct}/{total} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                style={{ width: `${pct}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  return (
    <>
      {showVocabBook && <VocabBookScreen onClose={() => setShowVocabBook(false)} />}
      {showKnowledgeManager && <KnowledgeUpdateScreen onClose={() => setShowKnowledgeManager(false)} />}
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="max-w-6xl w-full flex flex-col lg:flex-row bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-[700px]">
        
        {/* Left Side: Dashboard */}
        <div className="lg:w-4/12 bg-slate-100 p-8 flex flex-col border-r border-slate-200">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg text-white">
               <i className="fas fa-graduation-cap"></i>
             </div>
             <span className="font-extrabold text-xl tracking-wide text-slate-800">TOEFL<span className="text-indigo-600">AI</span></span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Test Modes</div>
             
             <button onClick={() => { setMode('READING'); setShowHistory(false); }} className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${mode === 'READING' ? 'bg-white shadow-md border-l-4 border-indigo-600' : 'hover:bg-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'READING' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}><i className="fas fa-book"></i></div>
                <div>
                    <div className="font-bold text-slate-800">Reading</div>
                    <div className="text-xs text-slate-500">TPO Style Passages</div>
                </div>
             </button>
             
             <button onClick={() => { setMode('LISTENING'); setShowHistory(false); }} className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${mode === 'LISTENING' ? 'bg-white shadow-md border-l-4 border-sky-500' : 'hover:bg-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'LISTENING' ? 'bg-sky-100 text-sky-600' : 'bg-slate-200 text-slate-500'}`}><i className="fas fa-headphones"></i></div>
                <div>
                    <div className="font-bold text-slate-800">Listening</div>
                    <div className="text-xs text-slate-500">Conversations & Lectures</div>
                </div>
             </button>
             
             <button onClick={() => { setMode('SPEAKING'); setShowHistory(false); }} className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${mode === 'SPEAKING' ? 'bg-white shadow-md border-l-4 border-orange-500' : 'hover:bg-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'SPEAKING' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}`}><i className="fas fa-microphone"></i></div>
                <div>
                    <div className="font-bold text-slate-800">Speaking</div>
                    <div className="text-xs text-slate-500">AI Graded Tasks</div>
                </div>
             </button>

             <button onClick={() => { setMode('WRITING'); setShowHistory(false); }} className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${mode === 'WRITING' ? 'bg-white shadow-md border-l-4 border-purple-600' : 'hover:bg-white/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mode === 'WRITING' ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-500'}`}><i className="fas fa-pen-nib"></i></div>
                <div>
                    <div className="font-bold text-slate-800">Writing</div>
                    <div className="text-xs text-slate-500">Integrated & Discussion</div>
                </div>
             </button>
             
             {/* Full Test Button - Highlighted */}
             <div className="pt-4 border-t-2 border-slate-300 mt-4">
               <button 
                 onClick={() => { 
                   if (window.confirm("Full Test を開始しますか？\n\n全4セクション（Reading, Listening, Speaking, Writing）を順番に受験し、最後に総合スコアレポートが表示されます。\n\n所要時間: 約2時間")) {
                     onStart('', 'FULL_TEST' as TestMode); 
                   }
                 }} 
                 className="w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg transform hover:scale-105"
               >
                 <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-red-600">
                   <i className="fas fa-trophy"></i>
                 </div>
                 <div>
                   <div className="font-bold text-white">Full Test</div>
                   <div className="text-xs text-white/90">Complete TOEFL Exam</div>
                 </div>
                 <i className="fas fa-arrow-circle-right text-white text-xl ml-auto"></i>
               </button>
             </div>

             <div className="pt-4 mt-2 border-t border-slate-200 space-y-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tools</span>
                </div>

                <button 
                    onClick={() => { setShowVocabBook(true); setShowHistory(false); setShowSettings(false); }}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                >
                    <i className="fas fa-book"></i> 単語・熟語帳
                </button>

                <button 
                    onClick={() => { setMode('VOCAB_LESSON'); setShowHistory(false); }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                >
                    <i className="fas fa-spell-check"></i> 単語・熟語特訓
                </button>

                <button 
                    onClick={() => { setShowHistory(!showHistory); setShowSettings(false); setShowVocabBook(false); }}
                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                >
                    <i className="fas fa-chart-bar"></i> 過去の分野別正解率
                </button>
                
                <button 
                    onClick={() => { /* TODO: Show Score Reports */ }}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                >
                    <i className="fas fa-file-alt"></i> 過去のスコアレポート
                </button>
             </div>

             {/* Settings Section */}
             <div className="pt-4 mt-2 border-t-2 border-slate-300 space-y-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settings</span>
                </div>
                
                <button 
                    onClick={() => { setShowKnowledgeManager(true); setShowHistory(false); setShowSettings(false); setShowVocabBook(false); }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-xs font-bold transition-all flex justify-center items-center gap-2 shadow-md"
                >
                    <i className="fas fa-graduation-cap"></i> Knowledge Base
                </button>

                <button 
                    onClick={() => { setShowSettings(true); setShowHistory(false); setShowVocabBook(false); }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex justify-center items-center gap-2"
                >
                    <i className="fas fa-cog"></i> System Setup (Mic/Audio)
                </button>
             </div>
          </div>
        </div>

        {/* Right Side: Content Area */}
        <div className="lg:w-8/12 p-8 flex flex-col bg-white relative">
          
          {/* Settings Modal Overlay */}
          {showSettings && (
            <div className="absolute inset-0 bg-white z-20 p-8 flex flex-col animate-fade-in">
                 <div className="flex justify-between items-center mb-8 border-b pb-4">
                    <h2 className="text-2xl font-bold text-slate-800">System Setup</h2>
                    <button onClick={() => { stopMicTest(); stopAudio(); setShowSettings(false); }} className="text-slate-400 hover:text-slate-600">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                     {/* Audio Check */}
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                             <i className="fas fa-volume-up text-indigo-600"></i> Audio Check
                         </h3>
                         <p className="text-sm text-slate-600 mb-6">
                             Click the button below to verify that you can hear the native English voice clearly.
                         </p>
                         <button 
                            onClick={testAudioOutput}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all"
                         >
                             <i className="fas fa-play mr-2"></i> Play Test Sound
                         </button>
                     </div>

                     {/* Mic Check */}
                     <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                         <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                             <i className="fas fa-microphone text-rose-600"></i> Microphone Check
                         </h3>
                         <p className="text-sm text-slate-600 mb-6">
                             Speak into your microphone. If the bar moves, your microphone is working correctly.
                         </p>
                         
                         <div className="h-6 bg-slate-200 rounded-full overflow-hidden mb-6 border border-slate-300 relative">
                             <div 
                                className="h-full bg-rose-500 transition-all duration-75 ease-out"
                                style={{ width: `${micLevel}%` }}
                             ></div>
                             {isMicActive && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">LISTENING...</span>}
                         </div>

                         {!isMicActive ? (
                             <button 
                                onClick={startMicTest}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-md transition-all"
                             >
                                 Start Mic Test
                             </button>
                         ) : (
                             <button 
                                onClick={stopMicTest}
                                className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold border border-red-200 transition-all"
                             >
                                 Stop Test
                             </button>
                         )}
                     </div>
                 </div>

                 <div className="mt-auto bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-3">
                     <i className="fas fa-info-circle mt-1"></i>
                     <div>
                         <strong>Tip:</strong> If the microphone bar doesn't move, please check your browser permission settings (click the lock icon in the address bar) and ensure "Microphone" is allowed.
                     </div>
                 </div>
            </div>
          )}

          {showHistory ? (
              <div className="flex-1 flex flex-col animate-fade-in h-full overflow-hidden">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800">Performance History</h2>
                    <button onClick={() => setShowHistory(false)} className="text-indigo-600 hover:underline font-bold text-sm">
                        Close
                    </button>
                  </div>
                  
                  {renderHistoryChart()}
                  
                  {/* AI Analysis Section */}
                  <div className="flex-1 flex flex-col mt-4 min-h-0">
                      <div className="flex justify-between items-center mb-2 shrink-0">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <i className="fas fa-robot text-indigo-600"></i> AI Performance Coach
                          </h3>
                      </div>
                      
                      <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-6 flex-1 min-h-0 overflow-hidden shadow-inner flex flex-col">
                          {!historyAnalysis && !isAnalyzingHistory && (
                              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-200 text-3xl">
                                      <i className="fas fa-chart-line"></i>
                                  </div>
                                  <div>
                                      <p className="text-slate-600 font-medium mb-1">Unlock Personalized Advice</p>
                                      <p className="text-slate-400 text-sm mb-6">Analyze your weak areas, get tailored vocab lists, and strategy tips.</p>
                                      <button 
                                        onClick={handleAnalyzeHistory}
                                        disabled={history.length === 0}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          <i className="fas fa-magic mr-2"></i> Analyze Weaknesses with AI
                                      </button>
                                  </div>
                              </div>
                          )}

                          {isAnalyzingHistory && (
                              <div className="h-full flex flex-col items-center justify-center text-indigo-500 space-y-3">
                                  <i className="fas fa-spinner fa-spin text-3xl"></i>
                                  <p className="font-bold animate-pulse">Analyzing your performance trends...</p>
                                  <p className="text-xs text-indigo-400">Generating study plan & vocabulary list</p>
                              </div>
                          )}

                          {historyAnalysis && (
                              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100">
                                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap space-y-4">
                                      {historyAnalysis}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          ) : !showSettings && (
            <>
              {/* Main Selection Area */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  {mode === 'READING' && 'Reading Practice'}
                  {mode === 'LISTENING' && 'Listening Practice'}
                  {mode === 'SPEAKING' && 'Speaking Practice'}
                  {mode === 'WRITING' && 'Writing Practice'}
                  {mode === 'VOCAB_LESSON' && 'Vocabulary Booster'}
                </h2>
                <p className="text-slate-500 text-sm">
                    {mode === 'READING' && 'Select a topic to generate TPO-style passages.'}
                    {mode === 'LISTENING' && 'Practice with conversations and lectures.'}
                    {mode === 'SPEAKING' && 'Record responses and get AI feedback.'}
                    {mode === 'WRITING' && 'Practice Integrated or Academic Discussion tasks.'}
                    {mode === 'VOCAB_LESSON' && 'Focused practice on difficult words.'}
                </p>
              </div>
              
              {mode === 'READING' && (
                  <div className="mb-6">
                    <div className="relative group mb-6">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter specific topic..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none text-slate-800"
                      />
                      <i className="fas fa-search absolute left-4 top-5 text-slate-400"></i>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scroll">
                      {Object.entries(categories).map(([cat, items]) => (
                        <div key={cat} className="mb-6">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">{cat}</h3>
                          <div className="flex flex-wrap gap-2">
                            {items.map((t) => {
                                const rankIndex = ranking.indexOf(t);
                                return (
                                  <button
                                    key={t}
                                    onClick={() => setTopic(t)}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all border shadow-sm whitespace-nowrap
                                      ${topic === t 
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}
                                    `}
                                  >
                                    {t}
                                    {rankIndex !== -1 && (
                                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-white z-10">
                                            Rank #{rankIndex + 1}
                                        </span>
                                    )}
                                  </button>
                                );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              )}

              <div className="mt-auto">
                <button
                    onClick={() => onStart(topic, mode)}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-3
                    ${isLoading 
                        ? 'bg-slate-400 cursor-wait' 
                        : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1'
                    }
                    `}
                >
                    {isLoading ? (
                    <>
                        <i className="fas fa-spinner fa-spin"></i> Generating Content...
                    </>
                    ) : (
                    <>
                        Start Test <i className="fas fa-arrow-right"></i>
                    </>
                    )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default HomeScreen;