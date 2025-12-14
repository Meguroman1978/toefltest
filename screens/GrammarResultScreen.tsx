import React from 'react';
import { GrammarQuestion, GrammarLevel } from '../types';

interface GrammarResultScreenProps {
  level: GrammarLevel;
  questions: GrammarQuestion[];
  results: { questionId: string; correct: boolean }[];
  onHome: () => void;
  onRetry: () => void;
}

const GrammarResultScreen: React.FC<GrammarResultScreenProps> = ({
  level,
  questions,
  results,
  onHome,
  onRetry
}) => {
  const correctCount = results.filter(r => r.correct).length;
  const totalCount = results.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const getLevelColor = () => {
    switch (level) {
      case 'BEGINNER': return 'green';
      case 'INTERMEDIATE': return 'blue';
      case 'ADVANCED': return 'purple';
      default: return 'gray';
    }
  };

  const getLevelName = () => {
    switch (level) {
      case 'BEGINNER': return '初級';
      case 'INTERMEDIATE': return '中級';
      case 'ADVANCED': return '上級';
      default: return '';
    }
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { title: '素晴らしい！', icon: '🏆', color: 'text-yellow-600' };
    if (percentage >= 70) return { title: 'よくできました！', icon: '🎉', color: 'text-green-600' };
    if (percentage >= 50) return { title: '合格！', icon: '✅', color: 'text-blue-600' };
    return { title: '復習しましょう', icon: '📚', color: 'text-orange-600' };
  };

  const color = getLevelColor();
  const performance = getPerformanceMessage();

  // Group results by grammar point
  const grammarPointStats = questions.reduce((acc, q) => {
    const result = results.find(r => r.questionId === q.id);
    if (!acc[q.grammarPoint]) {
      acc[q.grammarPoint] = { correct: 0, total: 0 };
    }
    acc[q.grammarPoint].total += 1;
    if (result?.correct) {
      acc[q.grammarPoint].correct += 1;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4">{performance.icon}</div>
          <h1 className={`text-4xl font-bold mb-2 ${performance.color}`}>
            {performance.title}
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            文法特訓 - {getLevelName()} テスト結果
          </p>

          {/* Score Display */}
          <div className={`inline-block bg-${color}-50 border-4 border-${color}-200 rounded-2xl p-8 mb-6`}>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-7xl font-extrabold text-${color}-600 mb-2`}>
                  {percentage}%
                </div>
                <p className="text-slate-600 font-semibold">正答率</p>
              </div>
              <div className="h-20 w-px bg-slate-300"></div>
              <div className="text-center">
                <div className="text-5xl font-bold text-slate-800 mb-2">
                  {correctCount} / {totalCount}
                </div>
                <p className="text-slate-600 font-semibold">正解数</p>
              </div>
            </div>
          </div>

          {/* Progress Ring */}
          <div className="relative inline-block">
            <svg className="transform -rotate-90" width="120" height="120">
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-200"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className={`text-${color}-500`}
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - percentage / 100)}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Grammar Point Breakdown */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <i className="fas fa-chart-bar text-indigo-600"></i>
            文法項目別成績
          </h2>

          <div className="space-y-4">
            {Object.entries(grammarPointStats).map(([point, stats]) => {
              const pointPercentage = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={point} className="border-2 border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">{point}</span>
                    <span className="text-sm font-semibold text-slate-600">
                      {stats.correct} / {stats.total} 問正解
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        pointPercentage >= 80
                          ? 'bg-green-500'
                          : pointPercentage >= 60
                          ? 'bg-blue-500'
                          : pointPercentage >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      } transition-all duration-500`}
                      style={{ width: `${pointPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pointPercentage}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <i className="fas fa-list-check text-indigo-600"></i>
            問題別結果
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const result = results.find(r => r.questionId === q.id);
              const isCorrect = result?.correct;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border-2 ${
                    isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{q.grammarPoint}</p>
                      <p className="text-sm text-slate-600 line-clamp-1">{q.question}</p>
                    </div>
                    <div className="text-2xl">
                      {isCorrect ? (
                        <i className="fas fa-check-circle text-green-500"></i>
                      ) : (
                        <i className="fas fa-times-circle text-red-500"></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onHome}
            className="px-8 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
          >
            <i className="fas fa-home mr-2"></i>ホームに戻る
          </button>
          <button
            onClick={onRetry}
            className={`px-8 py-4 bg-${color}-600 hover:bg-${color}-700 text-white rounded-xl font-bold text-lg shadow-lg transition-colors`}
          >
            <i className="fas fa-redo mr-2"></i>もう一度挑戦
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarResultScreen;
