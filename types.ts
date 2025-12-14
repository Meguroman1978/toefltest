export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  INSERT_TEXT = 'INSERT_TEXT',
  PROSE_SUMMARY = 'PROSE_SUMMARY',
}

export type TestMode = 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING' | 'VOCAB_LESSON';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: Option[];
  correctAnswers: string[]; 
  paragraphReference?: number;
  
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string; 
  categoryLabel: string; // e.g., "内容一致問題"
  explanation: string;
  tips: string;
  relevantContext: string;
}

export interface Passage {
  id: string;
  title: string;
  paragraphs: string[];
  questions: Question[];
}

export interface ListeningSet {
  id: string;
  type: 'CONVERSATION' | 'LECTURE';
  title: string;
  transcript: string; // Used for TTS
  japaneseTranscript?: string; // For Beginner Mode Subtitles
  audioUrl?: string; // Optional if we had real audio
  imageDescription: string; // For generating a placeholder UI
  questions: Question[];
}

export interface SpeakingTask {
  id: string;
  type: 'INDEPENDENT' | 'INTEGRATED';
  prompt: string;
  reading?: string; // For Integrated
  listeningTranscript?: string; // For Integrated
  japaneseListeningTranscript?: string; // For Beginner Mode
  preparationTime: number; // Seconds
  recordingTime: number; // Seconds
}

export interface WritingTask {
  id: string;
  type: 'INTEGRATED' | 'ACADEMIC_DISCUSSION';
  title: string;
  reading?: string; // For Integrated
  listeningTranscript?: string; // For Integrated (simulated audio)
  question: string;
  professorAvatar?: string;
  studentResponses?: { name: string; text: string }[]; // For Academic Discussion
}

export interface PerformanceRecord {
  date: string;
  category: string;
  correct: number; // Score or Correct Count
  total: number; // Max Score or Total Count
}

export interface GeneratedContent {
  title: string;
  paragraphs: string[];
  questions: any[];
}