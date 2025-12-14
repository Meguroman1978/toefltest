import React from 'react';
import { ScoreReport } from '../types';

interface ScoreReportScreenProps {
  report: ScoreReport;
  onHome: () => void;
}

const ScoreReportScreen: React.FC<ScoreReportScreenProps> = ({ report, onHome }) => {
  const getScoreColor = (score: number) => {
    if (score >= 24) return 'text-green-600';
    if (score >= 18) return 'text-blue-600';
    if (score >= 12) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 24) return 'bg-green-50 border-green-200';
    if (score >= 18) return 'bg-blue-50 border-blue-200';
    if (score >= 12) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 24) return 'Advanced';
    if (score >= 18) return 'Intermediate';
    if (score >= 12) return 'Basic';
    return 'Developing';
  };

  const getTotalScoreLevel = (total: number) => {
    if (total >= 95) return 'C2 - Proficient';
    if (total >= 72) return 'C1 - Advanced';
    if (total >= 42) return 'B2 - Upper Intermediate';
    return 'B1 - Intermediate';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-slate-100 overflow-y-auto font-sans">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-t-8 border-blue-600">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-800 mb-2">TOEFL Score Report</h1>
              <p className="text-slate-500">
                Test Date: {new Date(report.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-xs text-slate-400 mt-1">Report ID: {report.id}</p>
            </div>
            <button 
              onClick={onHome}
              className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-colors font-bold shadow-lg"
            >
              <i className="fas fa-home mr-2"></i>Return Home
            </button>
          </div>

          {/* Total Score Display */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm uppercase tracking-wide mb-2">Total Score</p>
                <div className="text-7xl font-extrabold mb-2">{report.totalScore}</div>
                <p className="text-blue-100 text-lg">{getTotalScoreLevel(report.totalScore)}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl mb-4">🎓</div>
                <p className="text-blue-100">Out of 120</p>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'reading', label: 'Reading', icon: 'fa-book-open', score: report.readingScore },
              { key: 'listening', label: 'Listening', icon: 'fa-headphones', score: report.listeningScore },
              { key: 'speaking', label: 'Speaking', icon: 'fa-microphone', score: report.speakingScore },
              { key: 'writing', label: 'Writing', icon: 'fa-pen', score: report.writingScore },
            ].map(section => (
              <div 
                key={section.key}
                className={`rounded-xl p-6 border-2 ${getScoreBgColor(section.score)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <i className={`fas ${section.icon} text-2xl ${getScoreColor(section.score)}`}></i>
                  <p className="font-bold text-slate-700">{section.label}</p>
                </div>
                <div className={`text-5xl font-extrabold mb-1 ${getScoreColor(section.score)}`}>
                  {section.score}
                </div>
                <p className="text-xs text-slate-500">/ 30 - {getScoreLevel(section.score)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Section Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { key: 'reading', label: 'Reading', icon: 'fa-book-open', data: report.sections.reading, score: report.readingScore },
            { key: 'listening', label: 'Listening', icon: 'fa-headphones', data: report.sections.listening, score: report.listeningScore },
            { key: 'speaking', label: 'Speaking', icon: 'fa-microphone', data: report.sections.speaking, score: report.speakingScore },
            { key: 'writing', label: 'Writing', icon: 'fa-pen', data: report.sections.writing, score: report.writingScore },
          ].map(section => (
            <div key={section.key} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(section.score)}`}>
                  <i className={`fas ${section.icon} text-xl ${getScoreColor(section.score)}`}></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{section.label} Analysis</h3>
                  <p className="text-sm text-slate-500">Score: {section.score} / 30</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {section.data.correctAnswers}/{section.data.totalQuestions}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Correct Answers</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-700">
                        {Math.floor(section.data.timeSpent / 60)}:{String(section.data.timeSpent % 60).padStart(2, '0')}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Time Spent</p>
                    </div>
                  </div>
                </div>

                {section.data.breakdown && section.data.breakdown.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3">Performance by Category</h4>
                    <div className="space-y-2">
                      {section.data.breakdown.map((cat, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{cat.category}</span>
                            <span className="font-medium text-slate-700">
                              {cat.correct}/{cat.total} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                cat.percentage >= 80 ? 'bg-green-500' : 
                                cat.percentage >= 60 ? 'bg-blue-500' : 
                                cat.percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 border border-indigo-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <i className="fas fa-lightbulb text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Personalized Recommendations</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
              <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                <i className="fas fa-check-circle"></i> Strengths
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {report.readingScore >= report.listeningScore && report.readingScore >= report.speakingScore && report.readingScore >= report.writingScore && (
                  <li>• Reading comprehension is your strongest skill</li>
                )}
                {report.totalScore >= 90 && <li>• Overall performance is excellent</li>}
                {report.totalScore >= 60 && report.totalScore < 90 && <li>• Solid foundation across all sections</li>}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-amber-500">
              <h4 className="font-bold text-amber-700 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i> Areas for Improvement
              </h4>
              <ul className="space-y-2 text-sm text-slate-700">
                {report.speakingScore < 20 && <li>• Focus on speaking fluency and pronunciation</li>}
                {report.writingScore < 20 && <li>• Practice essay structure and grammar</li>}
                {report.listeningScore < 20 && <li>• Improve note-taking while listening</li>}
                {report.readingScore < 20 && <li>• Work on reading speed and comprehension</li>}
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg p-6">
            <h4 className="font-bold text-indigo-700 mb-3 flex items-center gap-2">
              <i className="fas fa-route"></i> Next Steps
            </h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>✓ Review your incorrect answers in detail</li>
              <li>✓ Practice your weakest section with intensive training</li>
              <li>✓ Take another full test in 2-4 weeks to track progress</li>
              <li>✓ Use the Vocabulary Book to memorize important words</li>
            </ul>
          </div>
        </div>

        {/* Print/Download Section */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
          >
            <i className="fas fa-download mr-2"></i>Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreReportScreen;
