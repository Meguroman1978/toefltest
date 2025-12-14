import React, { useEffect, useState } from 'react';
import { Passage, QuestionType } from '../types';
import { generatePerformanceAnalysis } from '../services/geminiService';

interface ResultScreenProps {
  passage: Passage;
  answers: Record<string, string[]>;
  onHome: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ passage, answers, onHome }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number, correct: number }>>({});
  
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
          const exists = vocabBook.some((item: any) => item.word === targetWord);
          
          if (!exists) {
            vocabBook.push({
              word: targetWord,
              definition: correctOption.text,
              example: q.relevantContext || '',
              question: q.prompt,
              date: new Date().toISOString()
            });
            
            localStorage.setItem('toefl_vocab_book', JSON.stringify(vocabBook));
          }
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

  return (
    <div className="h-screen w-full bg-slate-50 overflow-y-auto font-sans">
      <div className="p-4 md:p-8 max-w-6xl mx-auto pb-24">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center border-t-8 border-blue-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 -mr-10 -mt-10"></div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Results</h1>
          <p className="text-slate-500 mb-8 font-serif italic text-lg">{passage.title}</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-8">
            <div className="text-center">
              <div className="text-6xl font-extrabold text-blue-600 mb-2">{score}<span className="text-3xl text-slate-300 font-normal">/{maxScore}</span></div>
              <div className="text-xs tracking-widest text-slate-500 font-bold uppercase">Raw Score</div>
            </div>
            <div className="hidden md:block w-px h-24 bg-slate-200"></div>
            <div className="text-center">
              <div className={`text-6xl font-extrabold mb-2 ${percentage >= 80 ? 'text-emerald-500' : percentage >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                {percentage}%
              </div>
              <div className="text-xs tracking-widest text-slate-500 font-bold uppercase">Accuracy</div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button onClick={onHome} className="bg-slate-800 text-white px-8 py-3 rounded-full hover:bg-slate-900 transition-colors font-bold shadow-lg">
              Return Home
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Category Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Category Breakdown</h3>
                <div className="space-y-4">
                    {Object.entries(categoryStats).map(([cat, val]) => {
                        const stat = val as { total: number, correct: number };
                        const pct = Math.round((stat.correct / stat.total) * 100);
                        return (
                            <div key={cat}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-700">{cat}</span>
                                    <span className="text-slate-500">{stat.correct}/{stat.total} ({pct}%)</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${pct}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-md border border-indigo-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <i className="fas fa-robot"></i>
                </div>
                <h2 className="text-xl font-bold text-indigo-900">AI Performance Coach</h2>
              </div>
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-400">
                  <i className="fas fa-spinner fa-spin text-3xl mb-3"></i>
                  <p>Generating personalized advice...</p>
                </div>
              ) : (
                <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-sm h-64 overflow-y-auto custom-scroll">
                  {analysis}
                </div>
              )}
            </div>
        </div>

        {/* Detailed Review */}
        <h2 className="text-2xl font-bold text-slate-800 mb-6 pl-2 border-l-4 border-blue-500">Detailed Review</h2>
        <div className="space-y-8">
          
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

            return (
              <div key={q.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isCorrect ? 'border-emerald-200' : 'border-rose-200'}`}>
                
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
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>

                <div className="p-6 md:p-8">
                   <p className="text-lg text-slate-900 font-medium mb-6">{q.prompt}</p>

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
  );
};

export default ResultScreen;
