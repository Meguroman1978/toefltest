import React, { useState, useEffect } from 'react';
import { ScoreReport } from '../types';

interface PastScoreReportsScreenProps {
  onHome: () => void;
  onViewReport: (report: ScoreReport) => void;
}

const PastScoreReportsScreen: React.FC<PastScoreReportsScreenProps> = ({ onHome, onViewReport }) => {
  const [reports, setReports] = useState<ScoreReport[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Load past score reports from localStorage
    const storedReports = localStorage.getItem('toefl_score_reports');
    if (storedReports) {
      const parsedReports: ScoreReport[] = JSON.parse(storedReports);
      // Sort by date (newest first)
      parsedReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReports(parsedReports);
    }
  }, []);

  const calculateAverages = () => {
    if (reports.length === 0) return null;

    const avgReading = reports.reduce((sum, r) => sum + r.readingScore, 0) / reports.length;
    const avgListening = reports.reduce((sum, r) => sum + r.listeningScore, 0) / reports.length;
    const avgSpeaking = reports.reduce((sum, r) => sum + r.speakingScore, 0) / reports.length;
    const avgWriting = reports.reduce((sum, r) => sum + r.writingScore, 0) / reports.length;
    const avgTotal = reports.reduce((sum, r) => sum + r.totalScore, 0) / reports.length;

    return {
      reading: Math.round(avgReading * 10) / 10,
      listening: Math.round(avgListening * 10) / 10,
      speaking: Math.round(avgSpeaking * 10) / 10,
      writing: Math.round(avgWriting * 10) / 10,
      total: Math.round(avgTotal * 10) / 10,
    };
  };

  const calculateTrends = () => {
    if (reports.length < 2) return null;

    const latest = reports[0];
    const oldest = reports[reports.length - 1];

    return {
      reading: latest.readingScore - oldest.readingScore,
      listening: latest.listeningScore - oldest.listeningScore,
      speaking: latest.speakingScore - oldest.speakingScore,
      writing: latest.writingScore - oldest.writingScore,
      total: latest.totalScore - oldest.totalScore,
    };
  };

  const generateAnalysis = () => {
    if (reports.length === 0) {
      return 'まだスコアレポートがありません。Full Testを受講してスコアを記録しましょう。';
    }

    const averages = calculateAverages()!;
    const trends = calculateTrends();

    let analysisText = `## 📊 過去のスコアデータ分析\n\n`;
    analysisText += `受講回数: **${reports.length}回**\n\n`;

    analysisText += `### 平均スコア\n`;
    analysisText += `- 総合: **${averages.total}** / 120\n`;
    analysisText += `- Reading: **${averages.reading}** / 30\n`;
    analysisText += `- Listening: **${averages.listening}** / 30\n`;
    analysisText += `- Speaking: **${averages.speaking}** / 30\n`;
    analysisText += `- Writing: **${averages.writing}** / 30\n\n`;

    if (trends) {
      analysisText += `### 📈 成長トレンド (最新 vs 最古)\n`;
      const formatTrend = (val: number) => val > 0 ? `+${val}` : `${val}`;
      analysisText += `- 総合: **${formatTrend(trends.total)}** 点\n`;
      analysisText += `- Reading: **${formatTrend(trends.reading)}** 点\n`;
      analysisText += `- Listening: **${formatTrend(trends.listening)}** 点\n`;
      analysisText += `- Speaking: **${formatTrend(trends.speaking)}** 点\n`;
      analysisText += `- Writing: **${formatTrend(trends.writing)}** 点\n\n`;
    }

    // Find strongest and weakest sections
    const latest = reports[0];
    const scores = [
      { name: 'Reading', score: latest.readingScore },
      { name: 'Listening', score: latest.listeningScore },
      { name: 'Speaking', score: latest.speakingScore },
      { name: 'Writing', score: latest.writingScore },
    ];
    scores.sort((a, b) => b.score - a.score);

    analysisText += `### 💪 現在の強み\n`;
    analysisText += `最も優れているセクションは **${scores[0].name}** (${scores[0].score}/30) です。\n`;
    if (scores[0].score >= 24) {
      analysisText += `これは「Advanced」レベルで、非常に優れた成績です。この強みを維持しましょう。\n\n`;
    } else if (scores[0].score >= 18) {
      analysisText += `「Intermediate」レベルで良好です。さらに上のレベルを目指しましょう。\n\n`;
    } else {
      analysisText += `まだ伸びしろがあります。継続的な学習で改善しましょう。\n\n`;
    }

    analysisText += `### 📝 改善が必要なセクション\n`;
    analysisText += `最も改善が必要なセクションは **${scores[3].name}** (${scores[3].score}/30) です。\n`;
    
    if (scores[3].name === 'Reading') {
      analysisText += `\n**Reading改善のための対策:**\n`;
      analysisText += `- 毎日15-20分の学術的な英文記事を読む習慣をつける\n`;
      analysisText += `- 段落の要約練習を行い、主旨を素早く掴む訓練をする\n`;
      analysisText += `- Vocabulary Bookで単語力を強化する\n`;
    } else if (scores[3].name === 'Listening') {
      analysisText += `\n**Listening改善のための対策:**\n`;
      analysisText += `- TED Talksや学術講義を聴いてノートテイキングの練習をする\n`;
      analysisText += `- シャドーイング練習で音声認識力を向上させる\n`;
      analysisText += `- 会話の流れとキーポイントを意識して聴く習慣をつける\n`;
    } else if (scores[3].name === 'Speaking') {
      analysisText += `\n**Speaking改善のための対策:**\n`;
      analysisText += `- 毎日3-5分の英語での自己録音練習を行う\n`;
      analysisText += `- 様々なトピックについて15秒で意見をまとめる訓練をする\n`;
      analysisText += `- 発音とイントネーションを意識して練習する\n`;
    } else if (scores[3].name === 'Writing') {
      analysisText += `\n**Writing改善のための対策:**\n`;
      analysisText += `- エッセイの構造（Introduction-Body-Conclusion）を意識する\n`;
      analysisText += `- 毎日1つのトピックについて200-300語のエッセイを書く\n`;
      analysisText += `- 文法の正確性と語彙の多様性を重視する\n`;
    }

    analysisText += `\n### 🎯 今後の学習計画\n`;
    analysisText += `1. **短期目標 (1-2週間)**: ${scores[3].name}セクションに集中し、スコアを+3点上げることを目指す\n`;
    analysisText += `2. **中期目標 (1ヶ月)**: すべてのセクションで平均20点以上を達成する\n`;
    analysisText += `3. **長期目標 (3ヶ月)**: 総合スコア100点突破を目指す\n\n`;
    
    analysisText += `定期的にFull Testを受講して、進捗を確認しましょう。頑張ってください！ 🚀`;

    return analysisText;
  };

  useEffect(() => {
    if (reports.length > 0) {
      setIsAnalyzing(true);
      // Simulate analysis loading
      setTimeout(() => {
        setAnalysis(generateAnalysis());
        setIsAnalyzing(false);
      }, 800);
    }
  }, [reports]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <span className="text-green-600">↗️ +{current - previous}</span>;
    if (current < previous) return <span className="text-red-600">↘️ {current - previous}</span>;
    return <span className="text-slate-600">→ 0</span>;
  };

  const handleDelete = (index: number) => {
    if (window.confirm('このスコアレポートを削除しますか？')) {
      const updatedReports = reports.filter((_, i) => i !== index);
      setReports(updatedReports);
      localStorage.setItem('toefl_score_reports', JSON.stringify(updatedReports));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('すべてのスコアレポートを削除しますか？この操作は取り消せません。')) {
      setReports([]);
      localStorage.removeItem('toefl_score_reports');
    }
  };

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">過去のスコアレポート</h2>
            <p className="text-slate-600 mb-8">
              まだFull Testを受講していません。<br />
              Full Testを受講すると、ここに過去のスコアと詳細な分析が表示されます。
            </p>
            <button
              onClick={onHome}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-lg"
            >
              <i className="fas fa-home mr-2"></i>ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const averages = calculateAverages()!;
  const trends = calculateTrends();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-slate-100 overflow-y-auto p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-xl font-bold text-slate-800">📊 過去のスコアレポート</h1>
              <p className="text-xs text-slate-600">全{reports.length}回</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClearAll}
                className="bg-red-600 text-white px-3 py-1.5 text-xs rounded hover:bg-red-700 transition-colors font-bold"
              >
                <i className="fas fa-trash mr-1"></i>全削除
              </button>
              <button
                onClick={onHome}
                className="bg-slate-800 text-white px-3 py-1.5 text-xs rounded hover:bg-slate-900 transition-colors font-bold"
              >
                <i className="fas fa-home mr-1"></i>ホーム
              </button>
            </div>
          </div>

          {/* Average Scores Summary */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded p-3 text-white mb-2">
            <h2 className="text-sm font-bold mb-2">📈 平均スコア</h2>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <div className="text-xl font-extrabold">{averages.total}</div>
                <div className="text-[9px] text-blue-100">総合</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold">{averages.reading}</div>
                <div className="text-[9px] text-blue-100">R</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold">{averages.listening}</div>
                <div className="text-[9px] text-blue-100">L</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold">{averages.speaking}</div>
                <div className="text-[9px] text-blue-100">S</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold">{averages.writing}</div>
                <div className="text-[9px] text-blue-100">W</div>
              </div>
            </div>
          </div>
        </div>

        {/* Past Reports List - Compact */}
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          {reports.map((report, index) => {
            const previousReport = reports[index + 1];
            return (
              <div key={report.id} className="bg-white rounded-lg shadow p-3 border-l-2 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(report.date).toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-blue-900">{report.totalScore}</div>
                    <div className="text-[9px] text-slate-500">/120</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-2">
                  <div className="text-center p-1 bg-blue-50 rounded">
                    <div className="text-sm font-bold text-blue-900">{report.readingScore}</div>
                    <div className="text-[9px] text-slate-600">R</div>
                  </div>
                  <div className="text-center p-1 bg-green-50 rounded">
                    <div className="text-sm font-bold text-green-900">{report.listeningScore}</div>
                    <div className="text-[9px] text-slate-600">L</div>
                  </div>
                  <div className="text-center p-1 bg-orange-50 rounded">
                    <div className="text-sm font-bold text-orange-900">{report.speakingScore}</div>
                    <div className="text-[9px] text-slate-600">S</div>
                  </div>
                  <div className="text-center p-1 bg-purple-50 rounded">
                    <div className="text-sm font-bold text-purple-900">{report.writingScore}</div>
                    <div className="text-[9px] text-slate-600">W</div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => onViewReport(report)}
                    className="flex-1 bg-blue-600 text-white py-1 text-[10px] rounded hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <i className="fas fa-eye mr-1"></i>詳細
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="bg-red-500 text-white px-2 py-1 text-[10px] rounded hover:bg-red-600 transition-colors"
                    title="削除"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comprehensive Analysis - Compact */}
        <div className="bg-white rounded-lg shadow p-3">
          <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
              <i className="fas fa-chart-line text-[10px]"></i>
            </div>
            AI分析
          </h2>

          {isAnalyzing ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-xs text-slate-600 mt-2">分析中...</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none max-h-[400px] overflow-y-auto pr-2 custom-scroll">
              <div className="whitespace-pre-wrap text-slate-700 text-[10px] leading-relaxed">
                {analysis.split('\n').map((line, index) => {
                  if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xs font-bold text-slate-800 mt-2 mb-1">{line.substring(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-[11px] font-bold text-slate-700 mt-2 mb-1">{line.substring(4)}</h3>;
                  } else if (line.startsWith('- ')) {
                    return <li key={index} className="ml-4 mb-1 text-[10px]">{line.substring(2)}</li>;
                  } else if (line.trim() === '') {
                    return <br key={index} />;
                  } else {
                    return <p key={index} className="mb-1">{line}</p>;
                  }
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Compact */}
        <div className="mt-3 text-center">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-1.5 text-xs rounded hover:bg-blue-700 transition-colors font-bold"
          >
            <i className="fas fa-print mr-1"></i>印刷/PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastScoreReportsScreen;
