import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import TestScreen from './screens/TestScreen';
import WritingTestScreen from './screens/WritingTestScreen';
import ListeningTestScreen from './screens/ListeningTestScreen';
import SpeakingTestScreen from './screens/SpeakingTestScreen';
import ResultScreen from './screens/ResultScreen';
import FeedbackResultScreen from './screens/FeedbackResultScreen';
import { generateTOEFLSet, generateWritingTask, generateVocabLesson, generateListeningSet, generateSpeakingTask } from './services/geminiService';
import { Passage, Question, QuestionType, TestMode, WritingTask, PerformanceRecord, ListeningSet, SpeakingTask } from './types';

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
  const [screen, setScreen] = useState<'HOME' | 'TEST' | 'WRITING_TEST' | 'LISTENING_TEST' | 'SPEAKING_TEST' | 'RESULT' | 'FEEDBACK_RESULT'>('HOME');
  const [isLoading, setIsLoading] = useState(false);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [writingTask, setWritingTask] = useState<WritingTask | null>(null);
  const [listeningSet, setListeningSet] = useState<ListeningSet | null>(null);
  const [speakingTask, setSpeakingTask] = useState<SpeakingTask | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  
  // State for Feedback Result (Speaking/Writing)
  const [feedbackData, setFeedbackData] = useState<{score: number, maxScore: number, feedback: string, type: 'SPEAKING' | 'WRITING'} | null>(null);


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
      }
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
        passage.questions.forEach(q => {
            const userAns = answers[q.id] || [];
            const correctAns = q.correctAnswers || [];
            const isCorrect = userAns.length === correctAns.length && userAns.every(a => correctAns.includes(a));
            
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
    }

    setScreen('RESULT');
  };

  const finishListeningTest = (answers: Record<string, string[]>) => {
      setUserAnswers(answers);
      
      // Save performance history
      if (listeningSet) {
          const historyData: PerformanceRecord[] = [];
          listeningSet.questions.forEach(q => {
              const userAns = answers[q.id] || [];
              const correctAns = q.correctAnswers || [];
              const isCorrect = userAns.length > 0 && correctAns.includes(userAns[0]);
              
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

      // Show Result Screen
      setFeedbackData({ score, maxScore: 4, feedback, type: 'SPEAKING' });
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
     
     // Show Result Screen
     setFeedbackData({ score, maxScore: 5, feedback, type: 'WRITING' });
     setScreen('FEEDBACK_RESULT');
  }

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
    setScreen('HOME');
  };

  return (
    <div className="text-slate-900">
      {screen === 'HOME' && <HomeScreen onStart={handleStart} isLoading={isLoading} />}
      
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
        />
      )}

      {screen === 'FEEDBACK_RESULT' && feedbackData && (
        <FeedbackResultScreen
          score={feedbackData.score}
          maxScore={feedbackData.maxScore}
          feedback={feedbackData.feedback}
          type={feedbackData.type}
          onHome={goHomeForce}
        />
      )}
    </div>
  );
};

export default App;
