import React from 'react';
import { ScoreReport } from '../types';

interface ScoreReportScreenProps {
  report: ScoreReport;
  onHome: () => void;
  onBackToReports?: () => void; // Optional callback to return to Past Reports screen
}

const ScoreReportScreen: React.FC<ScoreReportScreenProps> = ({ report, onHome, onBackToReports }) => {
  // Use real profile photos from provided images
  // Select a random photo each time the score report is displayed
  const profilePhotos = [
    'https://www.genspark.ai/api/files/s/RkniAVJj',
    'https://www.genspark.ai/api/files/s/ILmU31a1',
    'https://www.genspark.ai/api/files/s/DGuTzy5t',
    'https://www.genspark.ai/api/files/s/fDzupcx5',
    'https://www.genspark.ai/api/files/s/AdHqekhL'
  ];
  // Random selection - different image each time
  const [profilePhotoUrl] = React.useState(() => 
    profilePhotos[Math.floor(Math.random() * profilePhotos.length)]
  );
  
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
      <div className="p-4 max-w-6xl mx-auto">
        {/* Official TOEFL Header */}
        <div className="bg-white border-2 border-slate-300 mb-3">
          {/* Logo and Title Bar */}
          <div className="bg-blue-900 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">TOEFL iBT®</div>
            </div>
            <div className="flex gap-3">
              {onBackToReports && (
                <button 
                  onClick={onBackToReports}
                  className="bg-indigo-600 text-white px-3 py-1 text-xs rounded hover:bg-indigo-700 transition-colors font-semibold"
                >
                  <i className="fas fa-arrow-left mr-2"></i>Back to Reports
                </button>
              )}
              <button 
                onClick={onHome}
                className="bg-white text-blue-900 px-3 py-1 text-xs rounded hover:bg-slate-100 transition-colors font-semibold"
              >
                <i className="fas fa-home mr-2"></i>Return Home
              </button>
            </div>
          </div>

          <div className="px-4 py-2 bg-slate-50 border-b-2 border-slate-300">
            <h1 className="text-lg font-bold text-slate-800">Test Taker Score Report</h1>
          </div>

          {/* Student Information Table */}
          <div className="p-3">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                <div className="w-24 h-32 border-2 border-slate-300 bg-slate-100 overflow-hidden flex items-center justify-center">
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
            <div className="border-2 border-slate-300 mt-3">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-300">
                    <th className="text-left py-1 px-2 font-bold text-slate-800 text-xs">SECTION</th>
                    <th className="text-center py-1 px-2 font-bold text-slate-800 text-xs">SCORE</th>
                    <th className="text-center py-1 px-2 font-bold text-slate-800 text-xs">LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-2 font-semibold text-slate-700 text-xs">Reading</td>
                    <td className="py-1 px-2 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(report.readingScore)}`}>
                        {report.readingScore}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center text-xs text-slate-600">
                      {getScoreLevel(report.readingScore)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-2 font-semibold text-slate-700 text-xs">Listening</td>
                    <td className="py-1 px-2 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(report.listeningScore)}`}>
                        {report.listeningScore}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center text-xs text-slate-600">
                      {getScoreLevel(report.listeningScore)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="py-1 px-2 font-semibold text-slate-700 text-xs">Speaking</td>
                    <td className="py-1 px-2 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(report.speakingScore)}`}>
                        {report.speakingScore}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center text-xs text-slate-600">
                      {getScoreLevel(report.speakingScore)}
                    </td>
                  </tr>
                  <tr className="border-b-2 border-slate-300">
                    <td className="py-1 px-2 font-semibold text-slate-700 text-xs">Writing</td>
                    <td className="py-1 px-2 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(report.writingScore)}`}>
                        {report.writingScore}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center text-xs text-slate-600">
                      {getScoreLevel(report.writingScore)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="py-2 px-2 font-bold text-slate-800 text-sm">TOTAL SCORE</td>
                    <td className="py-2 px-2 text-center">
                      <span className="text-2xl font-extrabold text-blue-900">
                        {report.totalScore}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center text-xs font-semibold text-slate-700">
                      {getTotalScoreLevel(report.totalScore)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detailed Section Analysis - Compact Version */}
        <div className="grid md:grid-cols-4 gap-2">
          {[
            { key: 'reading', label: 'Reading', icon: 'fa-book-open', data: report.sections.reading, score: report.readingScore },
            { key: 'listening', label: 'Listening', icon: 'fa-headphones', data: report.sections.listening, score: report.listeningScore },
            { key: 'speaking', label: 'Speaking', icon: 'fa-microphone', data: report.sections.speaking, score: report.speakingScore },
            { key: 'writing', label: 'Writing', icon: 'fa-pen', data: report.sections.writing, score: report.writingScore },
          ].map(section => (
            <div key={section.key} className="bg-white rounded-lg shadow p-2 border-l-2 border-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getScoreBgColor(section.score)}`}>
                  <i className={`fas ${section.icon} text-xs ${getScoreColor(section.score)}`}></i>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">{section.label}</h3>
                  <p className="text-[10px] text-slate-500">{section.score}/30</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="bg-slate-50 rounded p-1">
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">
                      {section.data.correctAnswers}/{section.data.totalQuestions}
                    </div>
                    <p className="text-[9px] text-slate-500">Correct</p>
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-sm font-bold text-slate-700">
                      {Math.floor(section.data.timeSpent / 60)}:{String(section.data.timeSpent % 60).padStart(2, '0')}
                      {section.data.maxTime && (
                        <span className="text-[10px] text-slate-500">
                          /{Math.floor(section.data.maxTime / 60)}:{String(section.data.maxTime % 60).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500">Time{section.data.maxTime ? ' Used/Max' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Recommendations */}
        <div className="mt-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow p-3 border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <i className="fas fa-lightbulb text-xs"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Quick Tips</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-2">
            <div className="bg-white rounded p-2 border-l-2 border-green-500">
              <h4 className="font-bold text-green-700 text-[10px] mb-1 flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Strengths
              </h4>
              <ul className="space-y-1 text-[9px] text-slate-700">
                {(() => {
                  const strengths = [];
                  const maxScore = Math.max(report.readingScore, report.listeningScore, report.speakingScore, report.writingScore);
                  
                  // Identify strongest section(s)
                  if (report.readingScore === maxScore && report.readingScore >= 20) {
                    strengths.push(<li key="reading">• Reading is strongest</li>);
                  }
                  if (report.listeningScore === maxScore && report.listeningScore >= 20) {
                    strengths.push(<li key="listening">• Listening is strongest</li>);
                  }
                  if (report.speakingScore === maxScore && report.speakingScore >= 20) {
                    strengths.push(<li key="speaking">• Speaking is strongest</li>);
                  }
                  if (report.writingScore === maxScore && report.writingScore >= 20) {
                    strengths.push(<li key="writing">• Writing is strongest</li>);
                  }
                  
                  // Overall performance
                  if (report.totalScore >= 90) {
                    strengths.push(<li key="excellent">• Excellent overall performance</li>);
                  } else if (report.totalScore >= 60) {
                    strengths.push(<li key="solid">• Solid foundation</li>);
                  }
                  
                  // If no strengths identified
                  if (strengths.length === 0) {
                    return <li className="text-slate-500 italic">Continue practicing to build strengths</li>;
                  }
                  
                  return strengths;
                })()}
              </ul>
            </div>

            <div className="bg-white rounded p-2 border-l-2 border-amber-500">
              <h4 className="font-bold text-amber-700 text-[10px] mb-1 flex items-center gap-1">
                <i className="fas fa-exclamation-triangle"></i> Improve
              </h4>
              <ul className="space-y-1 text-[9px] text-slate-700">
                {report.speakingScore < 20 && <li>• Speaking fluency</li>}
                {report.writingScore < 20 && <li>• Essay structure</li>}
                {report.listeningScore < 20 && <li>• Note-taking</li>}
                {report.readingScore < 20 && <li>• Reading speed</li>}
              </ul>
            </div>

            <div className="bg-white rounded p-2">
              <h4 className="font-bold text-indigo-700 text-[10px] mb-1 flex items-center gap-1">
                <i className="fas fa-route"></i> Next Steps
              </h4>
              <ul className="space-y-0.5 text-[9px] text-slate-700">
                <li>✓ Review incorrect answers</li>
                <li>✓ Practice weakest section</li>
                <li>✓ Retake test in 2-4 weeks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Print/Download Section - Compact */}
        <div className="mt-3 text-center">
          <button 
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-1.5 text-xs rounded hover:bg-blue-700 transition-colors font-bold shadow"
          >
            <i className="fas fa-download mr-1"></i>Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoreReportScreen;
