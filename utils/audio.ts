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

export const speakText = (text: string, rate: number = 1.0, onEnd?: () => void): SpeechSynthesisUtterance => {
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
