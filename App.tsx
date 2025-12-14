import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import TestScreen from './screens/TestScreen';
import WritingTestScreen from './screens/WritingTestScreen';
import ListeningTestScreen from './screens/ListeningTestScreen';
import SpeakingTestScreen from './screens/SpeakingTestScreen';
import ResultScreen from './screens/ResultScreen';
import FeedbackResultScreen from './screens/FeedbackResultScreen';
import FullTestScreen from './screens/FullTestScreen';
import ScoreReportScreen from './screens/ScoreReportScreen';
import PastScoreReportsScreen from './screens/PastScoreReportsScreen';
import { generateTOEFLSet, generateWritingTask, generateVocabLesson, generateListeningSet, generateSpeakingTask } from './services/geminiService';
import { Passage, Question, QuestionType, TestMode, WritingTask, PerformanceRecord, ListeningSet, SpeakingTask, ScoreReport, SectionReport } from './types';

// Helper to transform raw AI output into safe app state
const mapGeneratedContentToPassage = (content: any): Passage => {
  const qList: Question[] = content.questions.map((q: any, idx: number) => {
    const normalizedType = q.type as QuestionType;
    let correct = q.correctOptionIds;
    
    const options = q.options.map((opt: any, optIdx: number) => ({
      id: opt.id || `opt_${idx}_${optIdx}`,
      text: opt.text
    }));

    return {
      id: `q_${idx}`,
      type: normalizedType,
      prompt: q.questionText,
      options: options,
      correctAnswers: correct, 
      paragraphReference: q.paragraphRef,
      difficulty: q.difficulty || "Medium",
      category: q.category || "General",
      categoryLabel: q.categoryLabel || "General",
      explanation: q.explanation || "No explanation provided.",
      tips: q.tips || "No tips provided.",
      relevantContext: q.relevantContext || ""
    };
  });

  return {
    id: `passage_${Date.now()}`,
    title: content.title,
    paragraphs: content.paragraphs,
    questions: qList
  };
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<'HOME' | 'TEST' | 'WRITING_TEST' | 'LISTENING_TEST' | 'SPEAKING_TEST' | 'RESULT' | 'FEEDBACK_RESULT' | 'FULL_TEST' | 'SCORE_REPORT' | 'PAST_REPORTS'>('HOME');
  const [isLoading, setIsLoading] = useState(false);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [writingTask, setWritingTask] = useState<WritingTask | null>(null);
  const [listeningSet, setListeningSet] = useState<ListeningSet | null>(null);
  const [speakingTask, setSpeakingTask] = useState<SpeakingTask | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  
  // State for Feedback Result (Speaking/Writing)
  const [feedbackData, setFeedbackData] = useState<{score: number, maxScore: number, feedback: string, type: 'SPEAKING' | 'WRITING', task?: WritingTask | SpeakingTask} | null>(null);
  
  // State for Full Test Mode
  const [fullTestMode, setFullTestMode] = useState(false);
  const [fullTestSection, setFullTestSection] = useState<'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING' | null>(null);
  const [fullTestScores, setFullTestScores] = useState<{
    reading?: SectionReport;
    listening?: SectionReport;
    speaking?: SectionReport;
    writing?: SectionReport;
  }>({});
  const [currentScoreReport, setCurrentScoreReport] = useState<ScoreReport | null>(null);


  const startReadingTest = async (topic: string, isIntensive = false, weakCat = "") => {
    setIsLoading(true);
    try {
      const content = await generateTOEFLSet(topic, isIntensive, weakCat);
      const newPassage = mapGeneratedContentToPassage(content);
      setPassage(newPassage);
      setUserAnswers({});
      setScreen('TEST');
    } catch (e) {
      console.error("Failed to generate test", e);
      alert("Failed to generate test. Please check your API Key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startVocabLesson = async () => {
    setIsLoading(true);
    try {
      const content = await generateVocabLesson();
      const newPassage = mapGeneratedContentToPassage(content);
      setPassage(newPassage);
      setUserAnswers({});
      setScreen('TEST');
    } catch (e) {
       console.error("Vocab gen failed", e);
       alert("Failed to generate vocab lesson.");
    } finally {
      setIsLoading(false);
    }
  };

  const startWritingTest = async () => {
    setIsLoading(true);
    try {
      const task = await generateWritingTask();
      setWritingTask(task);
      setScreen('WRITING_TEST');
    } catch (e) {
      console.error("Failed", e);
      alert("Failed to generate writing task.");
    } finally {
      setIsLoading(false);
    }
  }

  const startListeningTest = async () => {
      setIsLoading(true);
      try {
          const set = await generateListeningSet();
          setListeningSet(set);
          setScreen('LISTENING_TEST');
      } catch (e) {
          alert("Failed to generate listening test.");
      } finally {
          setIsLoading(false);
      }
  }

  const startSpeakingTest = async () => {
      setIsLoading(true);
      try {
          const task = await generateSpeakingTask();
          setSpeakingTask(task);
          setScreen('SPEAKING_TEST');
      } catch (e) {
          alert("Failed to generate speaking task.");
      } finally {
          setIsLoading(false);
      }
  }

  const handleStart = (topic: string, mode: TestMode, isIntensive = false, weakCat = "") => {
      if (mode === 'READING') {
          startReadingTest(topic, isIntensive, weakCat);
      } else if (mode === 'VOCAB_LESSON') {
          startVocabLesson();
      } else if (mode === 'WRITING') {
          startWritingTest();
      } else if (mode === 'LISTENING') {
          startListeningTest();
      } else if (mode === 'SPEAKING') {
          startSpeakingTest();
      } else if (mode === 'FULL_TEST') {
          startFullTest();
      }
  };

  const startFullTest = () => {
      setFullTestMode(true);
      setFullTestSection('READING');
      setFullTestScores({});
      setScreen('FULL_TEST');
  };

  const handleIntensiveTraining = (category: string) => {
      startReadingTest("", true, category);
  };

  // Called when Reading Test is officially completed
  const finishReadingTest = (answers: Record<string, string[]>) => {
    setUserAnswers(answers);
    
    // Save performance history ONLY on valid completion
    if (passage) {
        const historyData: PerformanceRecord[] = [];
        let correctCount = 0;
        
        passage.questions.forEach(q => {
            const userAns = answers[q.id] || [];
            const correctAns = q.correctAnswers || [];
            const isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
            
            if (isCorrect) correctCount++;
            
            historyData.push({
                date: new Date().toISOString(),
                category: q.categoryLabel || "General",
                correct: isCorrect ? 1 : 0,
                total: 1
            });
        });
        
        const existing = localStorage.getItem('toefl_history');
        const parsedExisting = existing ? JSON.parse(existing) : [];
        const updated = [...parsedExisting, ...historyData];
        localStorage.setItem('toefl_history', JSON.stringify(updated));
        
        // If Full Test Mode, save section score and continue
        if (fullTestMode && fullTestSection === 'READING') {
            const sectionReport: SectionReport = {
                score: Math.min(30, Math.round((correctCount / passage.questions.length) * 30)),
                maxScore: 30,
                rawScore: correctCount,
                correctAnswers: correctCount,
                totalQuestions: passage.questions.length,
                timeSpent: 0,
                breakdown: []
            };
            setFullTestScores(prev => ({ ...prev, reading: sectionReport }));
            setFullTestSection('LISTENING');
            setPassage(null);
            setUserAnswers({});
            setScreen('FULL_TEST');
            return;
        }
    }

    setScreen('RESULT');
  };

  const finishListeningTest = (answers: Record<string, string[]>) => {
      setUserAnswers(answers);
      
      // Save performance history
      if (listeningSet) {
          const historyData: PerformanceRecord[] = [];
          let correctCount = 0;
          
          listeningSet.questions.forEach(q => {
              const userAns = answers[q.id] || [];
              const correctAns = q.correctAnswers || [];
              const isCorrect = userAns.length > 0 && correctAns.includes(userAns[0]);
              
              if (isCorrect) correctCount++;
              
              historyData.push({
                  date: new Date().toISOString(),
                  category: q.categoryLabel || "Listening",
                  correct: isCorrect ? 1 : 0,
                  total: 1
              });
          });
          
          const existing = localStorage.getItem('toefl_history');
          const parsedExisting = existing ? JSON.parse(existing) : [];
          const updated = [...parsedExisting, ...historyData];
          localStorage.setItem('toefl_history', JSON.stringify(updated));
          
          // If Full Test Mode, save section score and continue
          if (fullTestMode && fullTestSection === 'LISTENING') {
              const sectionReport: SectionReport = {
                  score: Math.min(30, Math.round((correctCount / listeningSet.questions.length) * 30)),
                  maxScore: 30,
                  rawScore: correctCount,
                  correctAnswers: correctCount,
                  totalQuestions: listeningSet.questions.length,
                  timeSpent: 0,
                  breakdown: []
              };
              setFullTestScores(prev => ({ ...prev, listening: sectionReport }));
              setFullTestSection('SPEAKING');
              setListeningSet(null);
              setUserAnswers({});
              setScreen('FULL_TEST');
              return;
          }
          
          // Convert ListeningSet to Passage format for ResultScreen
          const listeningAsPassage: Passage = {
              id: listeningSet.id,
              title: listeningSet.title,
              paragraphs: [listeningSet.transcript],
              questions: listeningSet.questions
          };
          setPassage(listeningAsPassage);
      }
      
      setScreen('RESULT');
  }

  const finishSpeakingTest = (score: number, feedback: string) => {
      // Save History
      const historyData: PerformanceRecord = {
          date: new Date().toISOString(),
          category: 'Speaking',
          correct: score,
          total: 4,
          questionType: speakingTask?.questionType  // Include question type
      };
      const existing = localStorage.getItem('toefl_history');
      const parsedExisting = existing ? JSON.parse(existing) : [];
      const updated = [...parsedExisting, historyData];
      localStorage.setItem('toefl_history', JSON.stringify(updated));

      // If Full Test Mode, save section score and continue
      if (fullTestMode && fullTestSection === 'SPEAKING') {
          const sectionReport: SectionReport = {
              score: Math.min(30, Math.round((score / 4) * 30)),
              maxScore: 30,
              rawScore: score,
              correctAnswers: score,
              totalQuestions: 4,
              timeSpent: 0,
              breakdown: []
          };
          setFullTestScores(prev => ({ ...prev, speaking: sectionReport }));
          setFullTestSection('WRITING');
          setSpeakingTask(null);
          setScreen('FULL_TEST');
          return;
      }

      // Show Result Screen
      setFeedbackData({ score, maxScore: 4, feedback, type: 'SPEAKING', task: speakingTask || undefined });
      setScreen('FEEDBACK_RESULT');
  }

  // Called when Writing Test is submitted (with AI Grade)
  const finishWritingTest = (score: number, feedback: string) => {
     // Save History
     const historyData: PerformanceRecord = {
         date: new Date().toISOString(),
         category: 'Writing',
         correct: score,
         total: 5 
     };
     const existing = localStorage.getItem('toefl_history');
     const parsedExisting = existing ? JSON.parse(existing) : [];
     const updated = [...parsedExisting, historyData];
     localStorage.setItem('toefl_history', JSON.stringify(updated));
     
     // If Full Test Mode, save section score and generate final report
     if (fullTestMode && fullTestSection === 'WRITING') {
         const sectionReport: SectionReport = {
             score: Math.min(30, Math.round((score / 5) * 30)),
             maxScore: 30,
             rawScore: score,
             correctAnswers: score,
             totalQuestions: 1,
             timeSpent: 0,
             breakdown: []
         };
         const finalScores = { ...fullTestScores, writing: sectionReport };
         
         // Generate Final Score Report
         const totalScore = 
             (finalScores.reading?.score || 0) +
             (finalScores.listening?.score || 0) +
             (finalScores.speaking?.score || 0) +
             (finalScores.writing?.score || 0);
         
         const scoreReport: ScoreReport = {
             id: `full_test_${Date.now()}`,
             date: new Date().toISOString(),
             readingScore: finalScores.reading?.score || 0,
             listeningScore: finalScores.listening?.score || 0,
             speakingScore: finalScores.speaking?.score || 0,
             writingScore: finalScores.writing?.score || 0,
             totalScore,
             sections: {
                 reading: finalScores.reading || createEmptyReport(),
                 listening: finalScores.listening || createEmptyReport(),
                 speaking: finalScores.speaking || createEmptyReport(),
                 writing: finalScores.writing || createEmptyReport(),
             }
         };
         
         // Save to localStorage
         const existingReports = JSON.parse(localStorage.getItem('toefl_score_reports') || '[]');
         existingReports.push(scoreReport);
         localStorage.setItem('toefl_score_reports', JSON.stringify(existingReports));
         
         setCurrentScoreReport(scoreReport);
         setFullTestMode(false);
         setFullTestSection(null);
         setWritingTask(null);
         setScreen('SCORE_REPORT');
         return;
     }
     
     // Show Result Screen
     setFeedbackData({ score, maxScore: 5, feedback, type: 'WRITING', task: writingTask || undefined });
     setScreen('FEEDBACK_RESULT');
  }
  
  const createEmptyReport = (): SectionReport => ({
      score: 0,
      maxScore: 30,
      rawScore: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      timeSpent: 0,
      breakdown: []
  });

  // Safe Exit - asks for confirmation
  const goHomeSafe = () => {
    if (window.confirm("本当に終了して良いですか？\n(注: 試験中のデータは保存されません)")) {
        goHomeForce();
    }
  };

  // Force Exit - resets state without saving
  const goHomeForce = () => {
    setPassage(null);
    setWritingTask(null);
    setListeningSet(null);
    setSpeakingTask(null);
    setFullTestMode(false);
    setFullTestSection(null);
    setFullTestScores({});
    setCurrentScoreReport(null);
    setScreen('HOME');
  };
  
  const exitFullTest = () => {
    if (window.confirm("本当にFull Testを中断しますか？\n(注: 現在のセクションまでの結果は保存されません)")) {
        goHomeForce();
    }
  };

  const showPastReports = () => {
    setScreen('PAST_REPORTS');
  };

  const viewReportDetail = (report: ScoreReport) => {
    setCurrentScoreReport(report);
    setScreen('SCORE_REPORT');
  };

  return (
    <div className="text-slate-900">
      {screen === 'HOME' && <HomeScreen onStart={handleStart} onShowPastReports={showPastReports} isLoading={isLoading} />}
      
      {screen === 'TEST' && passage && (
        <TestScreen 
          passage={passage} 
          onComplete={finishReadingTest} 
          onExit={goHomeSafe}
        />
      )}

      {screen === 'WRITING_TEST' && writingTask && (
        <WritingTestScreen 
          task={writingTask}
          onComplete={finishWritingTest}
          onExit={goHomeSafe}
        />
      )}

      {screen === 'LISTENING_TEST' && listeningSet && (
        <ListeningTestScreen 
          listeningSet={listeningSet}
          onComplete={finishListeningTest}
          onExit={goHomeSafe}
        />
      )}

      {screen === 'SPEAKING_TEST' && speakingTask && (
        <SpeakingTestScreen 
           task={speakingTask}
           onComplete={finishSpeakingTest}
           onExit={goHomeSafe}
        />
      )}

      {screen === 'RESULT' && passage && (
        <ResultScreen 
          passage={passage} 
          answers={userAnswers} 
          onHome={goHomeForce}
          listeningSet={listeningSet || undefined}
        />
      )}

      {screen === 'FEEDBACK_RESULT' && feedbackData && (
        <FeedbackResultScreen
          score={feedbackData.score}
          maxScore={feedbackData.maxScore}
          feedback={feedbackData.feedback}
          type={feedbackData.type}
          task={feedbackData.task}
          onHome={goHomeForce}
        />
      )}
      
      {screen === 'FULL_TEST' && (
        <div className="h-screen w-full bg-slate-50 flex flex-col font-sans">
          {/* Progress Bar */}
          <div className="bg-white shadow-md">
            <div className="px-6 py-4">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">
                  Full TOEFL Test - {fullTestSection} Section
                </h1>
                <button 
                  onClick={exitFullTest}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>Exit Test
                </button>
              </div>
            </div>
          </div>

          {/* Test Launch Area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
                <div className="text-center">
                  <i className="fas fa-rocket text-6xl text-blue-600 mb-6"></i>
                  <h2 className="text-3xl font-bold text-slate-800 mb-4">
                    Ready for {fullTestSection} Section?
                  </h2>
                  <p className="text-slate-600 mb-8">
                    Click below to begin the test
                  </p>
                  
                  <button
                    onClick={async () => {
                      if (fullTestSection === 'READING') {
                        await startReadingTest('Academic Topics', false, '');
                      } else if (fullTestSection === 'LISTENING') {
                        await startListeningTest();
                      } else if (fullTestSection === 'SPEAKING') {
                        await startSpeakingTest();
                      } else if (fullTestSection === 'WRITING') {
                        await startWritingTest();
                      }
                    }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i>Loading...</>
                    ) : (
                      <>Begin {fullTestSection} Section<i className="fas fa-arrow-right ml-3"></i></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {screen === 'SCORE_REPORT' && currentScoreReport && (
        <ScoreReportScreen
          report={currentScoreReport}
          onHome={goHomeForce}
        />
      )}

      {screen === 'PAST_REPORTS' && (
        <PastScoreReportsScreen
          onHome={goHomeForce}
          onViewReport={viewReportDetail}
        />
      )}
    </div>
  );
};

export default App;
