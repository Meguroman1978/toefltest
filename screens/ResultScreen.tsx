import React, { useEffect, useState, useRef } from 'react';
import { Passage, QuestionType, ListeningSet } from '../types';
import { generatePerformanceAnalysis } from '../services/geminiService';
import { speakText, stopAudio } from '../utils/audio';

interface ResultScreenProps {
  passage: Passage;
  answers: Record<string, string[]>;
  onHome: () => void;
  listeningSet?: ListeningSet; // Optional listening data for audio replay
}

const ResultScreen: React.FC<ResultScreenProps> = ({ passage, answers, onHome, listeningSet }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number, correct: number }>>({});
  const [hoveredQuestionId, setHoveredQuestionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const passageContentRef = useRef<HTMLDivElement>(null);
  
  // Check if this is Vocab Lesson mode
  const isVocabLesson = passage.questions.some(q => q.categoryLabel === "語彙・熟語特訓");

  useEffect(() => {
    // Calculate Stats
    const stats: Record<string, { total: number, correct: number }> = {};
    
    passage.questions.forEach(q => {
      const cat = q.categoryLabel || "General";
      if (!stats[cat]) stats[cat] = { total: 0, correct: 0 };
      
      stats[cat].total++;
      
      const userAns = answers[q.id] || [];
      const correctAns = q.correctAnswers || [];
      
      let isCorrect = false;
      if (q.type === QuestionType.PROSE_SUMMARY) {
        const matchCount = userAns.filter(a => correctAns.includes(a)).length;
        if (matchCount >= 2) isCorrect = true; 
      } else {
         isCorrect = userAns.length > 0 && correctAns.includes(userAns[0]);
      }
      
      if (isCorrect) stats[cat].correct++;
      
      // Save incorrect vocabulary questions to vocab book
      if (!isCorrect && (q.category === 'Vocabulary' || q.categoryLabel === '語彙問題' || q.categoryLabel === '語彙・熟語特訓')) {
        const vocabBook = JSON.parse(localStorage.getItem('toefl_vocab_book') || '[]');
        
        // Extract the target word from the question (usually in bold or quotes)
        const wordMatch = q.prompt.match(/[""](.+?)[""]|\*\*(.+?)\*\*/);
        const targetWord = wordMatch ? (wordMatch[1] || wordMatch[2]) : '';
        
        // Get the correct answer text
        const correctOption = q.options.find(opt => correctAns.includes(opt.id));
        
        if (targetWord && correctOption) {
          // Check if this word is already in the book
          const existingIndex = vocabBook.findIndex((item: any) => item.word === targetWord);
          
          if (existingIndex >= 0) {
            // Update existing entry: increment mistakes count and update lastMistake
            vocabBook[existingIndex].mistakes = (vocabBook[existingIndex].mistakes || 1) + 1;
            vocabBook[existingIndex].lastMistake = new Date().toISOString();
          } else {
            // Add new entry
            vocabBook.push({
              word: targetWord,
              definition: correctOption.text,
              example: q.relevantContext || '',
              question: q.prompt,
              date: new Date().toISOString(),
              mistakes: 1,
              lastMistake: new Date().toISOString()
            });
          }
          
          localStorage.setItem('toefl_vocab_book', JSON.stringify(vocabBook));
        }
      }
    });

    setCategoryStats(stats);

    const fetchAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await generatePerformanceAnalysis(passage, answers);
      setAnalysis(result);
      setIsAnalyzing(false);
    };
    fetchAnalysis();
  }, [passage, answers]);
  
  const calculateScore = () => {
    let score = 0;
    let maxScore = 0;

    passage.questions.forEach(q => {
      const userAns = answers[q.id] || [];
      const correctAns = q.correctAnswers || [];

      if (q.type === QuestionType.PROSE_SUMMARY) {
        maxScore += 2;
        const correctCount = userAns.filter(a => correctAns.includes(a)).length;
        if (correctCount === 3) score += 2;
        else if (correctCount === 2) score += 1;
      } else {
        maxScore += 1;
        if (userAns.length > 0 && correctAns.includes(userAns[0])) {
          score += 1;
        }
      }
    });

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) };
  };

  const { score, maxScore, percentage } = calculateScore();

  const playListeningAudio = () => {
    if (listeningSet && listeningSet.transcript) {
      setIsPlayingAudio(true);
      speakText(listeningSet.transcript, 1.0, () => {
        setIsPlayingAudio(false);
      });
    }
  };

  const stopListeningAudio = () => {
    stopAudio();
    setIsPlayingAudio(false);
  };

  const highlightRelevantText = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;
    
    let highlighted = text;
    keywords.forEach(keyword => {
      if (keyword && keyword.length > 2) {
        const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark class="bg-yellow-300 px-1 rounded">$1</mark>');
      }
    });
    return highlighted;
  };

  const currentQuestion = passage.questions[currentQuestionIndex];

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans">
      {/* Header Bar */}
      <div className="bg-white shadow-md px-6 py-4 border-b-2 border-blue-600 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Test Results</h1>
            <p className="text-slate-500 text-sm">{passage.title}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{score}<span className="text-xl text-slate-400">/{maxScore}</span></div>
              <div className="text-xs text-slate-500">Accuracy: {percentage}%</div>
            </div>
            <button onClick={onHome} className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-md">
              <i className="fas fa-home mr-2"></i>Home
            </button>
          </div>
        </div>
      </div>

      {/* Split View Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Problem Content */}
        <div className="w-1/2 bg-white border-r-2 border-slate-200 overflow-y-auto" ref={passageContentRef}>
          <div className="p-8">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {listeningSet ? (
                  <>
                    <i className="fas fa-headphones mr-2 text-blue-600"></i>
                    Listening Content
                  </>
                ) : (
                  <>
                    <i className="fas fa-book-open mr-2 text-blue-600"></i>
                    Reading Passage
                  </>
                )}
              </h2>
              {listeningSet && (
                <button 
                  onClick={isPlayingAudio ? stopListeningAudio : playListeningAudio}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPlayingAudio 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <i className={`fas ${isPlayingAudio ? 'fa-stop' : 'fa-play'} mr-2`}></i>
                  {isPlayingAudio ? 'Stop Audio' : 'Replay Audio'}
                </button>
              )}
            </div>

            {listeningSet ? (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">English Transcript</h3>
                  <div 
                    className="text-slate-700 leading-relaxed whitespace-pre-wrap font-serif"
                    dangerouslySetInnerHTML={{
                      __html: hoveredQuestionId && currentQuestion.relevantContext
                        ? highlightRelevantText(listeningSet.transcript, [currentQuestion.relevantContext])
                        : listeningSet.transcript
                    }}
                  />
                </div>
                {listeningSet.japaneseTranscript && (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">Japanese Translation</h3>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {listeningSet.japaneseTranscript}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 font-serif text-lg leading-relaxed text-slate-700">
                {passage.paragraphs.map((para, idx) => {
                  const isHighlighted = hoveredQuestionId && currentQuestion.paragraphReference === idx;
                  const cleanText = para.replace(/(\[\s*■\s*\]|\[\u25A0\]|■)/g, '');
                  
                  return (
                    <div 
                      key={idx} 
                      className={`relative transition-all duration-300 ${
                        isHighlighted ? 'bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-400 shadow-sm' : ''
                      }`}
                    >
                      <span className="absolute -left-6 top-1 text-xs text-slate-300 font-sans font-bold">{idx + 1}</span>
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: isHighlighted && currentQuestion.relevantContext
                            ? highlightRelevantText(cleanText, [currentQuestion.relevantContext])
                            : cleanText
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Questions & Answers */}
        <div className="w-1/2 bg-slate-50 overflow-y-auto">
          <div className="p-8">
        
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Performance Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(categoryStats).map(([cat, val]) => {
                  const stat = val as { total: number, correct: number };
                  const pct = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div key={cat} className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className={`text-2xl font-bold ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {pct}%
                      </div>
                      <div className="text-xs text-slate-600 mt-1">{cat}</div>
                      <div className="text-xs text-slate-400">{stat.correct}/{stat.total}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-md border border-indigo-100 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <i className="fas fa-robot"></i>
                </div>
                <h2 className="text-lg font-bold text-indigo-900">AI Performance Coach</h2>
              </div>
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-400">
                  <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
                  <p className="text-sm">Generating personalized advice...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scroll">
                  {analysis}
                </div>
              )}
            </div>

            {/* Question Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Question {currentQuestionIndex + 1} of {passage.questions.length}
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition-colors"
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <button 
                  onClick={() => setCurrentQuestionIndex(Math.min(passage.questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === passage.questions.length - 1}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition-colors"
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

        {/* Detailed Review */}
        <div className="space-y-6">
          
          {passage.questions.map((q, idx) => {
            const userAns = answers[q.id] || [];
            const correctAns = q.correctAnswers;
            
            // Determine correctness
            let isCorrect = false;
            if (q.type === QuestionType.PROSE_SUMMARY) {
               const matchCount = userAns.filter(a => correctAns.includes(a)).length;
               isCorrect = matchCount >= 2; 
            } else {
               isCorrect = userAns.length > 0 && correctAns.includes(userAns[0]);
            }

            // Only show current question
            if (idx !== currentQuestionIndex) return null;

            return (
              <div 
                key={q.id} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}
                onMouseEnter={() => setHoveredQuestionId(q.id)}
                onMouseLeave={() => setHoveredQuestionId(null)}
              >
                
                {/* Question Header */}
                <div className={`px-6 py-4 flex justify-between items-center ${isCorrect ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-700 mr-2 block md:inline">{q.categoryLabel}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        q.difficulty === 'Hard' ? 'bg-red-100 text-red-700 border-red-200' :
                        q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>{q.difficulty}</span>
                    </div>
                  </div>
                  <div className={`font-bold px-3 py-1 rounded text-sm ${isCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                    {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                   <p className="text-base text-slate-900 font-medium mb-6">{q.prompt}</p>

                   <div className="space-y-2 mb-8">
                    {q.options.map(opt => {
                       const isSelected = userAns.includes(opt.id);
                       const isActuallyCorrect = correctAns.includes(opt.id);
                       
                       let containerClass = "border-slate-200 hover:bg-slate-50";
                       let icon = <div className="w-5 h-5 rounded border border-slate-300"></div>;

                       if (isSelected && isActuallyCorrect) {
                          containerClass = "bg-emerald-50 border-emerald-500 shadow-sm";
                          icon = <i className="fas fa-check-circle text-emerald-600 text-lg"></i>;
                       } else if (isSelected && !isActuallyCorrect) {
                          containerClass = "bg-rose-50 border-rose-500 shadow-sm";
                          icon = <i className="fas fa-times-circle text-rose-600 text-lg"></i>;
                       } else if (!isSelected && isActuallyCorrect) {
                          containerClass = "bg-emerald-50/50 border-emerald-300 border-dashed";
                          icon = <i className="fas fa-check text-emerald-500"></i>;
                       }

                       return (
                         <div key={opt.id} className={`p-4 rounded-lg border flex gap-3 items-start transition-colors ${containerClass}`}>
                           <div className="flex-shrink-0 mt-0.5">{icon}</div>
                           <span className={`text-sm ${isSelected || isActuallyCorrect ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>{opt.text}</span>
                         </div>
                       )
                    })}
                  </div>

                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-6">
                    {!isVocabLesson && q.relevantContext && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"><i className="fas fa-quote-right mr-2"></i>Reference Text</h4>
                        <div className="bg-white p-4 rounded border-l-4 border-blue-400 text-slate-700 italic font-serif text-sm">
                          "{q.relevantContext}"
                        </div>
                      </div>
                    )}

                    <div className={`grid ${isVocabLesson ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"><i className="fas fa-lightbulb mr-2"></i>Explanation</h4>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"><i className="fas fa-star mr-2"></i>Strategy Tip</h4>
                        <p className="text-sm text-slate-800 leading-relaxed bg-yellow-50 p-3 rounded text-yellow-900 border border-yellow-100">
                          {q.tips}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
