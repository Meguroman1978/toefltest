// Utility to handle Text-to-Speech with Native Voice Selection

let voices: SpeechSynthesisVoice[] = [];

const loadVoices = () => {
  voices = window.speechSynthesis.getVoices();
};

// Chrome loads voices asynchronously
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const getPreferredVoice = (): SpeechSynthesisVoice | null => {
  if (voices.length === 0) loadVoices();

  // Priority List for Natural English Voices
  const preferred = [
    'Google US English',       // Chrome (Excellent)
    'Samantha',                // macOS (Good)
    'Microsoft Zira',          // Windows (Good)
    'Daniel',                  // iOS (Good)
    'Google UK English Female' // Chrome (Alternative)
  ];

  // 1. Try exact name match from priority list
  for (const name of preferred) {
    const found = voices.find(v => v.name === name);
    if (found) return found;
  }

  // 2. Try any "en-US" voice
  const usVoice = voices.find(v => v.lang === 'en-US' && !v.name.includes('Archive'));
  if (usVoice) return usVoice;

  // 3. Fallback to any English voice
  return voices.find(v => v.lang.startsWith('en')) || null;
};

// Get voice by speaker type (Professor, Student, etc.)
export const getVoiceBySpeaker = (speaker: string): SpeechSynthesisVoice | null => {
  if (voices.length === 0) loadVoices();

  const speakerLower = speaker.toLowerCase();
  
  // Professor/Lecturer -> Male voice
  if (speakerLower.includes('professor') || speakerLower.includes('lecturer') || speakerLower.includes('instructor')) {
    const maleVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('Alex'))
    );
    if (maleVoices.length > 0) return maleVoices[0];
  }
  
  // Student -> Female voice
  if (speakerLower.includes('student')) {
    const femaleVoices = voices.filter(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen'))
    );
    if (femaleVoices.length > 0) return femaleVoices[0];
  }
  
  // Service staff -> Alternative voice
  if (speakerLower.includes('librarian') || speakerLower.includes('staff') || speakerLower.includes('employee')) {
    const altVoices = voices.filter(v => 
      v.lang.startsWith('en') && v.name !== getPreferredVoice()?.name
    );
    if (altVoices.length > 1) return altVoices[1];
  }
  
  // Default
  return getPreferredVoice();
};

// Parse transcript and separate by speaker
interface SpeakerSegment {
  speaker: string;
  text: string;
}

export const parseTranscriptBySpeaker = (transcript: string): SpeakerSegment[] => {
  const segments: SpeakerSegment[] = [];
  
  // Split by line breaks and parse "Speaker: text" format
  const lines = transcript.split('\n').filter(line => line.trim());
  
  let currentSpeaker = '';
  let currentText = '';
  
  for (const line of lines) {
    // Check for "Speaker:" pattern (case insensitive)
    const speakerMatch = line.match(/^([A-Za-z\s]+):\s*(.*)$/);
    
    if (speakerMatch) {
      // Save previous speaker's text
      if (currentSpeaker && currentText) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim() });
      }
      
      // Start new speaker
      currentSpeaker = speakerMatch[1].trim();
      currentText = speakerMatch[2];
    } else {
      // Continue current speaker's text
      currentText += ' ' + line;
    }
  }
  
  // Add last speaker
  if (currentSpeaker && currentText) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  }
  
  // If no speakers found, return entire text as one segment
  if (segments.length === 0) {
    segments.push({ speaker: 'Narrator', text: transcript });
  }
  
  return segments;
};

// Speak text with multi-speaker support
export const speakTextWithSpeakers = (text: string, rate: number = 1.0, onEnd?: () => void): void => {
  window.speechSynthesis.cancel();
  
  const segments = parseTranscriptBySpeaker(text);
  let currentIndex = 0;
  
  const speakNextSegment = () => {
    if (currentIndex >= segments.length) {
      if (onEnd) onEnd();
      return;
    }
    
    const segment = segments[currentIndex];
    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    
    const voice = getVoiceBySpeaker(segment.speaker);
    if (voice) {
      utterance.voice = voice;
      console.log(`${segment.speaker}: Using voice ${voice.name}`);
    }
    
    utterance.onend = () => {
      currentIndex++;
      // Small pause between speakers
      setTimeout(speakNextSegment, 300);
    };
    
    window.speechSynthesis.speak(utterance);
  };
  
  speakNextSegment();
};

export const speakText = (text: string, rate: number = 1.0, onEnd?: () => void): SpeechSynthesisUtterance => {
  // Check if text contains multiple speakers
  const hasSpeakers = /^[A-Za-z\s]+:/m.test(text);
  
  if (hasSpeakers) {
    speakTextWithSpeakers(text, rate, onEnd);
    return new SpeechSynthesisUtterance(); // Return dummy for compatibility
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;

  const voice = getPreferredVoice();
  if (voice) {
    utterance.voice = voice;
    console.log(`Using voice: ${voice.name} (${voice.lang})`);
  } else {
    console.warn("No English voice found. Using system default.");
  }

  if (onEnd) {
    utterance.onend = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const stopAudio = () => {
  window.speechSynthesis.cancel();
};
