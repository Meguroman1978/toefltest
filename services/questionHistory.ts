// Question History Management System
// Prevents duplicate questions and ensures variety in test generation

export interface QuestionFingerprint {
  id: string;
  type: 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  topic: string;
  keywords: string[];
  generatedDate: string;
  hash: string; // Unique hash based on content
}

export interface QuestionHistoryStore {
  questions: QuestionFingerprint[];
  lastCleanup: string;
}

/**
 * Generate unique hash for question content
 */
const generateHash = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Extract keywords from text (for similarity detection)
 */
const extractKeywords = (text: string): string[] => {
  // Remove common words and extract meaningful terms
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Get top 10 most frequent words
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

/**
 * Create fingerprint for a generated question
 */
export const createQuestionFingerprint = (
  type: 'Reading' | 'Listening' | 'Speaking' | 'Writing',
  content: any
): QuestionFingerprint => {
  
  let combinedText = '';
  let topic = 'Unknown';

  if (type === 'Reading') {
    combinedText = content.title + ' ' + content.paragraphs.join(' ');
    topic = content.title;
  } else if (type === 'Listening') {
    combinedText = content.title + ' ' + content.transcript;
    topic = content.title;
  } else if (type === 'Speaking') {
    combinedText = content.prompt + ' ' + (content.reading || '') + ' ' + (content.listeningTranscript || '');
    topic = content.prompt.substring(0, 50);
  } else if (type === 'Writing') {
    combinedText = content.title + ' ' + content.question + ' ' + (content.reading || '');
    topic = content.title;
  }

  const keywords = extractKeywords(combinedText);
  const hash = generateHash(combinedText);

  return {
    id: `${type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    topic,
    keywords,
    generatedDate: new Date().toISOString(),
    hash
  };
};

/**
 * Load question history from localStorage
 */
export const loadQuestionHistory = (): QuestionHistoryStore => {
  const stored = localStorage.getItem('toefl_question_history');
  if (!stored) {
    return {
      questions: [],
      lastCleanup: new Date().toISOString()
    };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return {
      questions: [],
      lastCleanup: new Date().toISOString()
    };
  }
};

/**
 * Save question history to localStorage
 */
export const saveQuestionHistory = (history: QuestionHistoryStore): void => {
  localStorage.setItem('toefl_question_history', JSON.stringify(history));
};

/**
 * Add new question to history
 */
export const addQuestionToHistory = (fingerprint: QuestionFingerprint): void => {
  const history = loadQuestionHistory();
  history.questions.push(fingerprint);
  saveQuestionHistory(history);
};

/**
 * Check if question is similar to any in history
 */
export const isQuestionDuplicate = (
  fingerprint: QuestionFingerprint,
  threshold: number = 0.6
): boolean => {
  const history = loadQuestionHistory();
  
  // Check exact hash match
  const exactMatch = history.questions.some(q => q.hash === fingerprint.hash);
  if (exactMatch) return true;

  // Check keyword similarity
  const recentQuestions = history.questions
    .filter(q => q.type === fingerprint.type)
    .slice(-20); // Check last 20 questions of same type

  for (const q of recentQuestions) {
    const similarity = calculateKeywordSimilarity(fingerprint.keywords, q.keywords);
    if (similarity > threshold) {
      console.log(`Similar question detected (${(similarity * 100).toFixed(0)}% match):`, q.topic);
      return true;
    }
  }

  return false;
};

/**
 * Calculate similarity between two keyword sets (Jaccard similarity)
 */
const calculateKeywordSimilarity = (keywords1: string[], keywords2: string[]): number => {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Get topic statistics (most/least used topics)
 */
export const getTopicStatistics = (
  type?: 'Reading' | 'Listening' | 'Speaking' | 'Writing'
): { topic: string; count: number }[] => {
  const history = loadQuestionHistory();
  const questions = type 
    ? history.questions.filter(q => q.type === type)
    : history.questions;

  const topicCount: Record<string, number> = {};
  questions.forEach(q => {
    topicCount[q.topic] = (topicCount[q.topic] || 0) + 1;
  });

  return Object.entries(topicCount)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
};

/**
 * Get underused topics for variety
 */
export const getUnderusedTopics = (
  type: 'Reading' | 'Listening' | 'Speaking' | 'Writing',
  allTopics: string[]
): string[] => {
  const stats = getTopicStatistics(type);
  const usedTopics = new Set(stats.map(s => s.topic.toLowerCase()));
  
  // Find topics that haven't been used or used rarely
  const underused = allTopics.filter(topic => {
    const topicLower = topic.toLowerCase();
    const stat = stats.find(s => s.topic.toLowerCase() === topicLower);
    return !stat || stat.count < 2;
  });

  return underused;
};

/**
 * Clean up old history (keep last 3 months)
 */
export const cleanupHistory = (): void => {
  const history = loadQuestionHistory();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  history.questions = history.questions.filter(q => {
    const questionDate = new Date(q.generatedDate);
    return questionDate > threeMonthsAgo;
  });

  history.lastCleanup = new Date().toISOString();
  saveQuestionHistory(history);
  
  console.log(`Cleaned up history. Remaining questions: ${history.questions.length}`);
};

/**
 * Check if cleanup is needed (once per week)
 */
export const needsCleanup = (): boolean => {
  const history = loadQuestionHistory();
  const lastCleanup = new Date(history.lastCleanup);
  const now = new Date();
  const daysDiff = (now.getTime() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDiff > 7;
};

/**
 * Get diversity score (0-1, higher is better)
 */
export const getDiversityScore = (type?: 'Reading' | 'Listening' | 'Speaking' | 'Writing'): number => {
  const stats = getTopicStatistics(type);
  if (stats.length === 0) return 1;

  // Calculate entropy
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const probabilities = stats.map(s => s.count / total);
  const entropy = -probabilities.reduce((sum, p) => sum + (p * Math.log2(p)), 0);
  
  // Normalize to 0-1 (max entropy is log2(n))
  const maxEntropy = Math.log2(stats.length);
  return entropy / maxEntropy;
};

/**
 * Clear all history (for testing or reset)
 */
export const clearHistory = (): void => {
  localStorage.removeItem('toefl_question_history');
  console.log('Question history cleared');
};

/**
 * Get recent questions for display
 */
export const getRecentQuestions = (
  count: number = 10,
  type?: 'Reading' | 'Listening' | 'Speaking' | 'Writing'
): QuestionFingerprint[] => {
  const history = loadQuestionHistory();
  const questions = type
    ? history.questions.filter(q => q.type === type)
    : history.questions;

  return questions.slice(-count).reverse();
};
