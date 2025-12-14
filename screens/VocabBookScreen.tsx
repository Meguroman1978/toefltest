import React, { useState, useEffect } from 'react';

interface VocabItem {
  word: string;
  definition: string;
  example: string; // Legacy field for backward compatibility
  examples?: {
    academic?: string;
    daily?: string;
    business?: string;
    political?: string;
  };
  date: string;
  question: string; // Will be removed from display
  mistakes: number; // 間違えた回数
  lastMistake: string; // 最後に間違えた日時
}

interface VocabBookScreenProps {
  onClose: () => void;
}

const VocabBookScreen: React.FC<VocabBookScreenProps> = ({ onClose }) => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  useEffect(() => {
    // Load vocab from localStorage
    const saved = localStorage.getItem('toefl_vocab_book');
    if (saved) {
      const parsed = JSON.parse(saved);
      setVocabList(parsed);
    }
  }, []);

  const handleRemove = (index: number) => {
    if (window.confirm('この単語を単語帳から削除しますか？')) {
      const updated = vocabList.filter((_, i) => i !== index);
      setVocabList(updated);
      localStorage.setItem('toefl_vocab_book', JSON.stringify(updated));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('すべての単語を削除しますか？この操作は取り消せません。')) {
      setVocabList([]);
      localStorage.removeItem('toefl_vocab_book');
    }
  };

  const handleGenerateExamples = async (index: number) => {
    const item = vocabList[index];
    if (item.examples) {
      alert('この単語にはすでに例文が生成されています。');
      return;
    }

    setGeneratingFor(item.word);
    try {
      const examples = await generateContextExamples(item.word, item.definition);
      const updated = [...vocabList];
      updated[index] = { ...item, examples };
      setVocabList(updated);
      localStorage.setItem('toefl_vocab_book', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to generate examples:', error);
      alert('例文の生成に失敗しました。もう一度お試しください。');
    } finally {
      setGeneratingFor(null);
    }
  };

  // スコア計算: 間違えた回数 × 最近度（日数の逆数）
  const calculateScore = (item: VocabItem): number => {
    const daysSinceLastMistake = Math.max(
      1,
      Math.floor((Date.now() - new Date(item.lastMistake).getTime()) / (1000 * 60 * 60 * 24))
    );
    // 間違えた回数が多く、最近間違えたものほどスコアが高い
    const recencyFactor = Math.max(1, 30 - daysSinceLastMistake) / 30;
    return item.mistakes * (1 + recencyFactor * 2);
  };

  // ランキング順にソート（スコアの高い順）
  const sortedList = [...vocabList].sort((a, b) => calculateScore(b) - calculateScore(a));

  const filteredList = filter === 'recent' 
    ? sortedList.slice(0, 20) 
    : sortedList;

  // 最大の間違い回数を取得（バー表示用）
  const maxMistakes = Math.max(...vocabList.map(item => item.mistakes), 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-book"></i>
              単語・熟語帳
            </h2>
            <p className="text-purple-100 text-sm mt-1">間違えた単語・熟語の一覧</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <div className="flex gap-4">
            <div>
              <span className="text-2xl font-bold text-slate-800">{vocabList.length}</span>
              <span className="text-sm text-slate-500 ml-1">単語</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                filter === 'all' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                filter === 'recent' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border'
              }`}
            >
              最近の20件
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <i className="fas fa-trash-alt mr-1"></i>
              すべて削除
            </button>
          </div>
        </div>

        {/* Vocab List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <i className="fas fa-book-open text-6xl mb-4 opacity-20"></i>
              <p className="text-lg font-medium">まだ単語がありません</p>
              <p className="text-sm mt-2">テストで間違えた単語・熟語がここに保存されます</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredList.map((item, index) => {
                const score = calculateScore(item);
                const barWidth = (item.mistakes / maxMistakes) * 100;
                const originalIndex = vocabList.findIndex(v => v.word === item.word && v.date === item.date);
                
                return (
                  <div 
                    key={index}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {/* ランキングバッジ */}
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-bl-lg font-bold text-sm shadow-md">
                      #{index + 1}
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-12">
                        <h3 className="text-xl font-bold text-slate-800 mb-1">
                          {item.word}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">
                          {item.definition}
                        </p>
                        
                        {/* 間違い回数バー */}
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-slate-500">
                              間違い回数: {item.mistakes}回
                            </span>
                            <span className="text-xs font-bold text-purple-600">
                              重要度スコア: {score.toFixed(1)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 rounded-full transition-all duration-500"
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(originalIndex)}
                        className="ml-4 w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                        title="削除"
                      >
                        <i className="fas fa-times text-sm"></i>
                      </button>
                    </div>

                  {/* Generate Examples Button */}
                  {!item.examples && (
                    <div className="mb-3">
                      <button
                        onClick={() => handleGenerateExamples(originalIndex)}
                        disabled={generatingFor === item.word}
                        className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {generatingFor === item.word ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            例文を生成中...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic"></i>
                            4パターンの例文を生成
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Context-Specific Examples */}
                  <div className="space-y-2 mb-3">
                    {item.examples?.academic && (
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                        <span className="text-xs font-bold text-blue-700 uppercase block mb-1">
                          <i className="fas fa-graduation-cap mr-1"></i>Academic Context
                        </span>
                        <p className="text-sm text-slate-700 italic">
                          {item.examples.academic}
                        </p>
                      </div>
                    )}
                    
                    {item.examples?.daily && (
                      <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                        <span className="text-xs font-bold text-green-700 uppercase block mb-1">
                          <i className="fas fa-comments mr-1"></i>Daily Conversation
                        </span>
                        <p className="text-sm text-slate-700 italic">
                          {item.examples.daily}
                        </p>
                      </div>
                    )}
                    
                    {item.examples?.business && (
                      <div className="bg-orange-50 rounded-lg p-3 border-l-4 border-orange-400">
                        <span className="text-xs font-bold text-orange-700 uppercase block mb-1">
                          <i className="fas fa-briefcase mr-1"></i>Business Context
                        </span>
                        <p className="text-sm text-slate-700 italic">
                          {item.examples.business}
                        </p>
                      </div>
                    )}
                    
                    {item.examples?.political && (
                      <div className="bg-purple-50 rounded-lg p-3 border-l-4 border-purple-400">
                        <span className="text-xs font-bold text-purple-700 uppercase block mb-1">
                          <i className="fas fa-landmark mr-1"></i>Political Context
                        </span>
                        <p className="text-sm text-slate-700 italic">
                          {item.examples.political}
                        </p>
                      </div>
                    )}
                    
                    {/* Fallback to legacy example if no context-specific examples */}
                    {!item.examples && item.example && (
                      <div className="bg-slate-50 rounded-lg p-3 border-l-4 border-slate-400">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                          <i className="fas fa-quote-left mr-1"></i>Example
                        </span>
                        <p className="text-sm text-slate-700 italic">
                          {item.example}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 mt-3 pt-3 border-t">
                    <span>
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(item.date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabBookScreen;
