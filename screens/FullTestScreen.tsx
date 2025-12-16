import React, { useState, useEffect } from 'react';
import { ScoreReport, SectionReport } from '../types';

interface FullTestScreenProps {
  onComplete: (report: ScoreReport) => void;
  onExit: () => void;
}

const FullTestScreen: React.FC<FullTestScreenProps> = ({ onComplete, onExit }) => {
  const [currentSection, setCurrentSection] = useState<'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING' | 'COMPLETE'>('READING');
  const [sectionStartTime, setSectionStartTime] = useState<number>(Date.now());
  const [sectionScores, setSectionScores] = useState<{
    reading?: SectionReport;
    listening?: SectionReport;
    speaking?: SectionReport;
    writing?: SectionReport;
  }>({});

  const sections = [
    { name: 'READING', label: 'Reading', duration: 35, icon: 'fa-book-open' },
    { name: 'LISTENING', label: 'Listening', duration: 36, icon: 'fa-headphones' },
    { name: 'SPEAKING', label: 'Speaking', duration: 16, icon: 'fa-microphone' },
    { name: 'WRITING', label: 'Writing', duration: 29, icon: 'fa-pen' },
  ];

  const currentSectionIndex = sections.findIndex(s => s.name === currentSection);
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  const handleSectionComplete = (report: SectionReport) => {
    const timeSpent = Math.floor((Date.now() - sectionStartTime) / 1000);
    const currentSectionInfo = sections.find(s => s.name === currentSection);
    const maxTime = currentSectionInfo ? currentSectionInfo.duration * 60 : 0; // Convert minutes to seconds
    const updatedReport = { ...report, timeSpent, maxTime };
    
    const newScores = {
      ...sectionScores,
      [currentSection.toLowerCase()]: updatedReport
    };
    setSectionScores(newScores);

    // Move to next section
    if (currentSection === 'READING') {
      setCurrentSection('LISTENING');
      setSectionStartTime(Date.now());
    } else if (currentSection === 'LISTENING') {
      setCurrentSection('SPEAKING');
      setSectionStartTime(Date.now());
    } else if (currentSection === 'SPEAKING') {
      setCurrentSection('WRITING');
      setSectionStartTime(Date.now());
    } else if (currentSection === 'WRITING') {
      setCurrentSection('COMPLETE');
      // Generate final score report
      generateFinalReport(newScores);
    }
  };

  const generateFinalReport = (scores: typeof sectionScores) => {
    // Convert raw scores to TOEFL scaled scores (0-30 per section)
    const readingScaled = scores.reading ? Math.min(30, Math.round((scores.reading.rawScore / scores.reading.maxScore) * 30)) : 0;
    const listeningScaled = scores.listening ? Math.min(30, Math.round((scores.listening.rawScore / scores.listening.maxScore) * 30)) : 0;
    const speakingScaled = scores.speaking ? Math.min(30, Math.round((scores.speaking.rawScore / scores.speaking.maxScore) * 30)) : 0;
    const writingScaled = scores.writing ? Math.min(30, Math.round((scores.writing.rawScore / scores.writing.maxScore) * 30)) : 0;
    
    const totalScore = readingScaled + listeningScaled + speakingScaled + writingScaled;

    const report: ScoreReport = {
      id: `full_test_${Date.now()}`,
      date: new Date().toISOString(),
      readingScore: readingScaled,
      listeningScore: listeningScaled,
      speakingScore: speakingScaled,
      writingScore: writingScaled,
      totalScore,
      sections: {
        reading: scores.reading || createEmptyReport(),
        listening: scores.listening || createEmptyReport(),
        speaking: scores.speaking || createEmptyReport(),
        writing: scores.writing || createEmptyReport(),
      }
    };

    // Save to localStorage
    const existingReports = JSON.parse(localStorage.getItem('toefl_score_reports') || '[]');
    existingReports.push(report);
    localStorage.setItem('toefl_score_reports', JSON.stringify(existingReports));

    onComplete(report);
  };

  const createEmptyReport = (): SectionReport => ({
    score: 0,
    maxScore: 30,
    rawScore: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timeSpent: 0,
    breakdown: []
  });

  if (currentSection === 'COMPLETE') {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Complete!</h1>
          <p className="text-slate-600 mb-6">Generating your score report...</p>
          <div className="animate-spin text-4xl text-blue-600">
            <i className="fas fa-spinner"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans">
      {/* Progress Bar */}
      <div className="bg-white shadow-md">
        <div className="h-2 bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        <div className="px-6 py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">
              Full TOEFL Test - {sections[currentSectionIndex].label} Section
            </h1>
            <button 
              onClick={onExit}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>Exit Test
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-center gap-4">
            {sections.map((section, idx) => (
              <div 
                key={section.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  idx < currentSectionIndex
                    ? 'bg-green-100 text-green-700'
                    : idx === currentSectionIndex
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <i className={`fas ${section.icon}`}></i>
                <span className="font-medium">{section.label}</span>
                {idx < currentSectionIndex && <i className="fas fa-check-circle text-green-600"></i>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-blue-600">
            <div className="text-center">
              <i className={`fas ${sections[currentSectionIndex].icon} text-6xl text-blue-600 mb-6`}></i>
              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                {sections[currentSectionIndex].label} Section
              </h2>
              <p className="text-slate-600 mb-8">
                Time Limit: {sections[currentSectionIndex].duration} minutes
              </p>
              
              <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-bold text-slate-800 mb-3">Instructions:</h3>
                <ul className="space-y-2 text-slate-700">
                  {currentSection === 'READING' && (
                    <>
                      <li>• Read 2 academic passages and answer 20 questions</li>
                      <li>• Each passage is approximately 700 words</li>
                      <li>• You may return to previous questions</li>
                    </>
                  )}
                  {currentSection === 'LISTENING' && (
                    <>
                      <li>• Listen to 3 conversations/lectures and answer questions</li>
                      <li>• You may take notes while listening</li>
                      <li>• Audio plays only once</li>
                    </>
                  )}
                  {currentSection === 'SPEAKING' && (
                    <>
                      <li>• Complete 4 speaking tasks</li>
                      <li>• You will have preparation time before recording</li>
                      <li>• Speak clearly into your microphone</li>
                    </>
                  )}
                  {currentSection === 'WRITING' && (
                    <>
                      <li>• Complete 2 writing tasks</li>
                      <li>• Integrated Writing: 20 minutes</li>
                      <li>• Independent Writing: 30 minutes</li>
                    </>
                  )}
                </ul>
              </div>

              <button
                onClick={() => {
                  // Here we would trigger the actual test for this section
                  // For now, simulate completion with accurate time tracking
                  const actualTimeSpent = Math.floor((Date.now() - sectionStartTime) / 1000);
                  const mockReport: SectionReport = {
                    score: 25,
                    maxScore: 30,
                    rawScore: 8,
                    correctAnswers: 8,
                    totalQuestions: 10,
                    timeSpent: actualTimeSpent, // Use actual time spent
                    breakdown: []
                  };
                  handleSectionComplete(mockReport);
                }}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg shadow-lg"
              >
                Begin {sections[currentSectionIndex].label} Section
                <i className="fas fa-arrow-right ml-3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullTestScreen;
