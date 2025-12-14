import React from 'react';
import { ScoreReport } from '../types';

interface ScoreReportScreenProps {
  report: ScoreReport;
  onHome: () => void;
  onBackToReports?: () => void; // Optional callback to return to Past Reports screen
}

const ScoreReportScreen: React.FC<ScoreReportScreenProps> = ({ report, onHome, onBackToReports }) => {
  // Use real profile photos from provided images
  // We use a deterministic selection based on report ID to ensure the same photo appears for the same report
  const profilePhotos = [
    'https://www.genspark.ai/api/files/s/RkniAVJj',
    'https://www.genspark.ai/api/files/s/ILmU31a1',
    'https://www.genspark.ai/api/files/s/DGuTzy5t',
    'https://www.genspark.ai/api/files/s/fDzupcx5',
    'https://www.genspark.ai/api/files/s/AdHqekhL'
  ];
  // Use report ID to deterministically select a photo (same report = same photo)
  const photoIndex = report.id ? parseInt(report.id.replace(/\D/g, '')) % profilePhotos.length : Math.floor(Math.random() * profilePhotos.length);
  const profilePhotoUrl = profilePhotos[photoIndex];
  
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
    <div className="fixed inset-0 w-full bg-white overflow-y-auto font-sans">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Official TOEFL Header */}
        <div className="bg-white border-2 border-slate-300 mb-6">
          {/* Logo and Title Bar */}
          <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">TOEFL iBT®</div>
            </div>
            <div className="flex gap-3">
              {onBackToReports && (
                <button 
                  onClick={onBackToReports}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors text-sm font-semibold"
                >
                  <i className="fas fa-arrow-left mr-2"></i>Back to Reports
                </button>
              )}
              <button 
                onClick={onHome}
                className="bg-white text-blue-900 px-4 py-2 rounded hover:bg-slate-100 transition-colors text-sm font-semibold"
              >
                <i className="fas fa-home mr-2"></i>Return Home
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-b-2 border-slate-300">
            <h1 className="text-2xl font-bold text-slate-800">Test Taker Score Report</h1>
          </div>

          {/* Student Information Table */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <div className="font-semibold text-slate-700">Name:</div>
                    <div className="text-slate-900">Test Taker</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Test Date:</div>
                    <div className="text-slate-900">
                      {new Date(report.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Registration Number:</div>
                    <div className="text-slate-900">{report.id}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Report Date:</div>
                    <div className="text-slate-900">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Native Language:</div>
                    <div className="text-slate-900">Japanese</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-700">Test Center:</div>
                    <div className="text-slate-900">Online Practice</div>
                  </div>
                </div>
              </div>
              
              {/* Profile Photo */}
              <div className="flex justify-end">
                <div className="w-32 h-40 border-2 border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center">
                  <img 
                    src={profilePhotoUrl} 
                    alt="Test Taker Photo" 
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // Fallback to a placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div class="text-center text-slate-400"><i class="fas fa-user text-5xl"></i></div>';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Scores Table */}
            <div className="border-2 border-slate-300 mt-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left py-3 px-4 font-bold text-slate-800 text-sm">SECTION</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-800 text-sm">SCORE</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-800 text-sm">LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 font-semibold text-slate-700">Reading</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-2xl font-bold ${getScoreColor(report.readingScore)}`}>
                        {report.readingScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">
                      {getScoreLevel(report.readingScore)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 font-semibold text-slate-700">Listening</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-2xl font-bold ${getScoreColor(report.listeningScore)}`}>
                        {report.listeningScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">
                      {getScoreLevel(report.listeningScore)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-4 font-semibold text-slate-700">Speaking</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-2xl font-bold ${getScoreColor(report.speakingScore)}`}>
                        {report.speakingScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">
                      {getScoreLevel(report.speakingScore)}
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-300">
                    <td className="py-3 px-4 font-semibold text-slate-700">Writing</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-2xl font-bold ${getScoreColor(report.writingScore)}`}>
                        {report.writingScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">
                      {getScoreLevel(report.writingScore)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-4 px-4 font-bold text-slate-800 text-lg">TOTAL SCORE</td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-4xl font-extrabold text-blue-900">
                        {report.totalScore}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-sm font-semibold text-slate-700">
                      {getTotalScoreLevel(report.totalScore)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
