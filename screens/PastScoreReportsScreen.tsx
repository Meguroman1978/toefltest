import React, { useState, useEffect } from 'react';
import { ScoreReport } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PastScoreReportsScreenProps {
  onViewReport: (report: ScoreReport) => void;
  onClose: () => void;
}

const PastScoreReportsScreen: React.FC<PastScoreReportsScreenProps> = ({ onViewReport, onClose }) => {
  const [reports, setReports] = useState<ScoreReport[]>([]);
  const [trend, setTrend] = useState<'improving' | 'stagnant' | 'declining'>('stagnant');

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem('toefl_score_reports') || '[]') as ScoreReport[];
    // Sort by date, newest first
    savedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setReports(savedReports);
    
    // Analyze trend
    if (savedReports.length >= 2) {
      const recent = savedReports.slice(0, 3);
      const avgRecentScore = recent.reduce((sum, r) => sum + r.totalScore, 0) / recent.length;
      const older = savedReports.slice(3, 6);
      const avgOlderScore = older.length > 0 ? older.reduce((sum, r) => sum + r.totalScore, 0) / older.length : avgRecentScore;
      
      if (avgRecentScore > avgOlderScore + 5) {
        setTrend('improving');
      } else if (avgRecentScore < avgOlderScore - 5) {
        setTrend('declining');
      } else {
        setTrend('stagnant');
      }
    }
  }, []);

  const getChartData = () => {
    const sortedReports = [...reports].reverse(); // Oldest first for chart
    return {
      labels: sortedReports.map((r, idx) => `Test ${idx + 1}`),
      datasets: [
        {
          label: 'Reading',
          data: sortedReports.map(r => r.readingScore),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Listening',
          data: sortedReports.map(r => r.listeningScore),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Speaking',
          data: sortedReports.map(r => r.speakingScore),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.3,
        },
        {
          label: 'Writing',
          data: sortedReports.map(r => r.writingScore),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Score Progress Over Time',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 30,
        ticks: {
          stepSize: 5,
        },
      },
    },
  };

  const getTrendIcon = () => {
    if (trend === 'improving') return { icon: 'fa-arrow-trend-up', color: 'text-green-600', bg: 'bg-green-50' };
    if (trend === 'declining') return { icon: 'fa-arrow-trend-down', color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: 'fa-arrows-left-right', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  };

  const trendInfo = getTrendIcon();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold">Past Score Reports</h2>
            <p className="text-blue-100 mt-1">{reports.length} test{reports.length !== 1 ? 's' : ''} completed</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {reports.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-chart-line text-6xl text-slate-300 mb-4"></i>
              <h3 className="text-2xl font-bold text-slate-600 mb-2">No Tests Completed Yet</h3>
              <p className="text-slate-500">Complete a Full Test to see your progress here</p>
            </div>
          ) : (
            <>
              {/* Trend Analysis */}
              <div className={`rounded-xl p-6 mb-8 border-2 ${trendInfo.bg} border-${trendInfo.color.replace('text-', '')}-200`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full ${trendInfo.bg} flex items-center justify-center`}>
                    <i className={`fas ${trendInfo.icon} text-3xl ${trendInfo.color}`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {trend === 'improving' && 'Great Progress! 🎉'}
                      {trend === 'stagnant' && 'Steady Performance'}
                      {trend === 'declining' && 'Needs Attention'}
                    </h3>
                    <p className="text-slate-600">
                      {trend === 'improving' && 'Your scores are consistently improving. Keep up the excellent work!'}
                      {trend === 'stagnant' && 'Your scores are stable. Consider focusing on weaker areas for improvement.'}
                      {trend === 'declining' && 'Recent scores show a downward trend. Review your study strategy.'}
                    </p>
                  </div>
                </div>

                {/* AI Advice */}
                <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                  <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                    <i className="fas fa-robot"></i> AI Coach Recommendation
                  </h4>
                  <p className="text-sm text-slate-700">
                    {trend === 'improving' && 'Continue your current study routine and gradually increase difficulty levels. Focus on maintaining consistency across all sections.'}
                    {trend === 'stagnant' && 'Try mixing up your study methods. Use the Knowledge Base updates and target your weakest question types for breakthrough improvement.'}
                    {trend === 'declining' && 'Take a structured approach: Review fundamentals, increase practice frequency, and ensure adequate rest. Consider retaking sections where you scored lowest.'}
                  </p>
                </div>
              </div>

              {/* Chart */}
              {reports.length >= 2 && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border">
                  <div style={{ height: '300px' }}>
                    <Line data={getChartData()} options={chartOptions} />
                  </div>
                </div>
              )}

              {/* Reports List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800 mb-4">All Test Reports</h3>
                {reports.map((report, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div 
                      key={report.id}
                      className={`bg-white rounded-xl shadow-md p-6 border-2 transition-all hover:shadow-lg cursor-pointer ${
                        isLatest ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
                      }`}
                      onClick={() => onViewReport(report)}
                    >
                      {isLatest && (
                        <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                          LATEST TEST
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800">
                            Test #{reports.length - idx}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {new Date(report.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-extrabold text-blue-600">
                            {report.totalScore}
                          </div>
                          <p className="text-xs text-slate-500">/ 120</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'R', score: report.readingScore, full: 'Reading' },
                          { label: 'L', score: report.listeningScore, full: 'Listening' },
                          { label: 'S', score: report.speakingScore, full: 'Speaking' },
                          { label: 'W', score: report.writingScore, full: 'Writing' },
                        ].map(section => (
                          <div key={section.label} className="bg-slate-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-slate-500 mb-1">{section.full}</div>
                            <div className="text-2xl font-bold text-slate-800">{section.score}</div>
                            <div className="text-xs text-slate-400">/ 30</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 text-right">
                        <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                          View Detailed Report <i className="fas fa-arrow-right ml-1"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear History */}
              <div className="mt-8 pt-8 border-t text-center">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all score reports? This cannot be undone.')) {
                      localStorage.removeItem('toefl_score_reports');
                      setReports([]);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  <i className="fas fa-trash mr-2"></i>Clear All History
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PastScoreReportsScreen;
