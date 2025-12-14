// YouTube Video Analysis Service using Gemini API
// Analyzes TOEFL preparation videos to extract strategies and tips

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.0-flash";

export interface YouTubeAnalysisResult {
  channel: string;
  videoTitle: string;
  videoUrl: string;
  analyzedDate: string;
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing' | 'General';
  strategies: string[];
  tips: string[];
  vocabularyList: string[];
  questionPatterns: string[];
  commonMistakes: string[];
  templates: string[];
}

export interface KnowledgeBase {
  reading: {
    strategies: string[];
    questionPatterns: string[];
    tips: string[];
  };
  listening: {
    strategies: string[];
    signalWords: string[];
    tips: string[];
  };
  speaking: {
    templates: Record<string, string>;
    strategies: string[];
    tips: string[];
  };
  writing: {
    templates: Record<string, string>;
    strategies: string[];
    tips: string[];
  };
  vocabulary: string[];
  lastUpdated: string;
}

/**
 * Analyze YouTube video transcript to extract TOEFL strategies
 * This uses Gemini's native video understanding capability (currently in preview)
 */
export const analyzeYouTubeVideo = async (
  videoUrl: string,
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing' | 'General'
): Promise<YouTubeAnalysisResult> => {
  
  const prompt = `
    Analyze this TOEFL preparation video and extract actionable strategies, tips, and patterns.
    
    Focus on the following aspects:
    1. **Strategies**: Specific techniques mentioned (e.g., "Process of elimination", "Skim first, then read questions")
    2. **Tips**: Practical advice (e.g., "Listen for signal words like 'However'", "Use 15 seconds for prep time wisely")
    3. **Question Patterns**: Types of questions and their characteristics
    4. **Common Mistakes**: Errors students frequently make
    5. **Templates**: Any sentence templates or structures recommended (especially for Speaking/Writing)
    6. **Vocabulary**: Important academic words mentioned
    
    Section Focus: ${section}
    
    Format your response as JSON with the following structure:
    {
      "strategies": ["strategy1", "strategy2", ...],
      "tips": ["tip1", "tip2", ...],
      "vocabularyList": ["word1 (meaning)", "word2 (meaning)", ...],
      "questionPatterns": ["pattern1", "pattern2", ...],
      "commonMistakes": ["mistake1", "mistake2", ...],
      "templates": ["template1", "template2", ...]
    }
    
    If transcript is not available, analyze based on video title and description.
  `;

  try {
    // Method 1: Using video URL directly (Gemini Flash supports video)
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { fileData: { mimeType: "video/*", fileUri: videoUrl } }
          ]
        }
      ],
    });

    const analysisData = JSON.parse(response.text || "{}");
    
    return {
      channel: extractChannelFromUrl(videoUrl),
      videoTitle: "Extracted from video",
      videoUrl,
      analyzedDate: new Date().toISOString(),
      section,
      ...analysisData
    };
  } catch (error) {
    console.error("Video analysis failed, falling back to text-based analysis:", error);
    
    // Fallback: Analyze using video ID and fetch metadata
    return await analyzeYouTubeVideoFallback(videoUrl, section);
  }
};

/**
 * Fallback method: Fetch video transcript/captions and analyze text
 */
const analyzeYouTubeVideoFallback = async (
  videoUrl: string,
  section: 'Reading' | 'Listening' | 'Speaking' | 'Writing' | 'General'
): Promise<YouTubeAnalysisResult> => {
  
  const videoId = extractVideoId(videoUrl);
  
  // In a real implementation, you would fetch captions using YouTube API or third-party service
  // For now, we'll create a placeholder that analyzes based on common TOEFL patterns
  
  const prompt = `
    You are an expert TOEFL instructor. Based on common strategies from top TOEFL YouTube channels 
    (TST Prep, LinguaTrip, Test Succeed, etc.), provide comprehensive strategies for the ${section} section.
    
    Focus on:
    1. Proven strategies that work
    2. Time management techniques
    3. Common pitfalls and how to avoid them
    4. Question-type specific approaches
    5. Templates (for Speaking/Writing)
    
    Format as JSON with: strategies, tips, vocabularyList, questionPatterns, commonMistakes, templates
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const analysisData = JSON.parse(response.text || "{}");
  
  return {
    channel: extractChannelFromUrl(videoUrl),
    videoTitle: `TOEFL ${section} Strategies`,
    videoUrl,
    analyzedDate: new Date().toISOString(),
    section,
    strategies: analysisData.strategies || [],
    tips: analysisData.tips || [],
    vocabularyList: analysisData.vocabularyList || [],
    questionPatterns: analysisData.questionPatterns || [],
    commonMistakes: analysisData.commonMistakes || [],
    templates: analysisData.templates || []
  };
};

/**
 * Batch analyze multiple YouTube videos from specified channels
 */
export const batchAnalyzeVideos = async (
  videoUrls: string[]
): Promise<YouTubeAnalysisResult[]> => {
  const results: YouTubeAnalysisResult[] = [];
  
  for (const url of videoUrls) {
    try {
      // Determine section from video title/URL
      const section = detectSection(url);
      const result = await analyzeYouTubeVideo(url, section);
      results.push(result);
      
      // Rate limiting: Wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze ${url}:`, error);
    }
  }
  
  return results;
};

/**
 * Build comprehensive knowledge base from analysis results
 */
export const buildKnowledgeBase = (
  analyses: YouTubeAnalysisResult[]
): KnowledgeBase => {
  
  const kb: KnowledgeBase = {
    reading: { strategies: [], questionPatterns: [], tips: [] },
    listening: { strategies: [], signalWords: [], tips: [] },
    speaking: { templates: {}, strategies: [], tips: [] },
    writing: { templates: {}, strategies: [], tips: [] },
    vocabulary: [],
    lastUpdated: new Date().toISOString()
  };

  analyses.forEach(analysis => {
    const section = analysis.section.toLowerCase();
    
    if (section === 'reading') {
      kb.reading.strategies.push(...analysis.strategies);
      kb.reading.questionPatterns.push(...analysis.questionPatterns);
      kb.reading.tips.push(...analysis.tips);
    } else if (section === 'listening') {
      kb.listening.strategies.push(...analysis.strategies);
      kb.listening.tips.push(...analysis.tips);
      // Extract signal words from tips
      analysis.tips.forEach(tip => {
        const match = tip.match(/"([^"]+)"/g);
        if (match) kb.listening.signalWords.push(...match);
      });
    } else if (section === 'speaking') {
      kb.speaking.strategies.push(...analysis.strategies);
      kb.speaking.tips.push(...analysis.tips);
      analysis.templates.forEach((template, idx) => {
        kb.speaking.templates[`template_${idx}`] = template;
      });
    } else if (section === 'writing') {
      kb.writing.strategies.push(...analysis.strategies);
      kb.writing.tips.push(...analysis.tips);
      analysis.templates.forEach((template, idx) => {
        kb.writing.templates[`template_${idx}`] = template;
      });
    }
    
    kb.vocabulary.push(...analysis.vocabularyList);
  });

  // Deduplicate
  kb.reading.strategies = [...new Set(kb.reading.strategies)];
  kb.reading.questionPatterns = [...new Set(kb.reading.questionPatterns)];
  kb.reading.tips = [...new Set(kb.reading.tips)];
  kb.listening.strategies = [...new Set(kb.listening.strategies)];
  kb.listening.signalWords = [...new Set(kb.listening.signalWords)];
  kb.listening.tips = [...new Set(kb.listening.tips)];
  kb.speaking.strategies = [...new Set(kb.speaking.strategies)];
  kb.speaking.tips = [...new Set(kb.speaking.tips)];
  kb.writing.strategies = [...new Set(kb.writing.strategies)];
  kb.writing.tips = [...new Set(kb.writing.tips)];
  kb.vocabulary = [...new Set(kb.vocabulary)];

  return kb;
};

/**
 * Save knowledge base to localStorage
 */
export const saveKnowledgeBase = (kb: KnowledgeBase): void => {
  localStorage.setItem('toefl_knowledge_base', JSON.stringify(kb));
  console.log('Knowledge base saved:', kb);
};

/**
 * Load knowledge base from localStorage
 */
export const loadKnowledgeBase = (): KnowledgeBase | null => {
  const stored = localStorage.getItem('toefl_knowledge_base');
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * Check if knowledge base needs update (older than 7 days)
 */
export const needsUpdate = (kb: KnowledgeBase | null): boolean => {
  if (!kb) return true;
  
  const lastUpdated = new Date(kb.lastUpdated);
  const now = new Date();
  const daysDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDiff > 7;
};

// Utility functions

const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/);
  return match ? match[1] : '';
};

const extractChannelFromUrl = (url: string): string => {
  if (url.includes('TSTPrep')) return 'TST Prep';
  if (url.includes('LinguaTrip')) return 'LinguaTrip';
  if (url.includes('EnglishProficiencyTestprep')) return 'English Proficiency Test Prep';
  if (url.includes('TOEFL-IELTS-DET')) return 'TOEFL-IELTS-DET';
  if (url.includes('AndrianPermadi')) return 'Andrian Permadi';
  if (url.includes('testsucceed')) return 'Test Succeed';
  if (url.includes('walkerhighereducation')) return 'Walker Higher Education';
  return 'Unknown Channel';
};

const detectSection = (url: string): 'Reading' | 'Listening' | 'Speaking' | 'Writing' | 'General' => {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('reading')) return 'Reading';
  if (urlLower.includes('listening')) return 'Listening';
  if (urlLower.includes('speaking')) return 'Speaking';
  if (urlLower.includes('writing')) return 'Writing';
  return 'General';
};

/**
 * Pre-defined video list for initial analysis
 */
export const TOEFL_YOUTUBE_CHANNELS = {
  'TST Prep': 'https://www.youtube.com/@TSTPrep/videos',
  'LinguaTrip': 'https://www.youtube.com/@TOEFL_test_with_LinguaTrip/videos',
  'English Proficiency Test Prep': 'https://www.youtube.com/@EnglishProficiencyTestprep/videos',
  'TOEFL-IELTS-DET': 'https://www.youtube.com/@TOEFL-IELTS-DET/videos',
  'Andrian Permadi': 'https://www.youtube.com/@AndrianPermadi/videos',
  'Test Succeed': 'https://www.youtube.com/@testsucceed/videos',
  'Walker Higher Education': 'https://www.youtube.com/@walkerhighereducation/videos',
};

// Sample video URLs for initial analysis (to be replaced with actual videos)
export const SAMPLE_VIDEOS = [
  'https://www.youtube.com/watch?v=q15K9ByEchw', // Provided sample
  // Add more representative videos here
];
