import React, { useState, useEffect } from 'react';

interface VocabItem {
  word: string;
  definition: string;
  example: string;
  date: string;
  question: string;
}

interface VocabBookScreenProps {
  onClose: () => void;
}

const VocabBookScreen: React.FC<VocabBookScreenProps> = ({ onClose }) => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'recent'>('all');

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

  const filteredList = filter === 'recent' 
    ? vocabList.slice(0, 20) 
    : vocabList;

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
              {filteredList.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1">
                        {item.word}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3">
                        {item.definition}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(index)}
                      className="ml-4 w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                      title="削除"
                    >
                      <i className="fas fa-times text-sm"></i>
                    </button>
                  </div>

                  {item.example && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-3 border-l-4 border-purple-400">
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">例文</span>
                      <p className="text-sm text-slate-700 italic">
                        {item.example}
                      </p>
                    </div>
                  )}

                  {item.question && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3 border-l-4 border-blue-400">
                      <span className="text-xs font-bold text-slate-400 uppercase block mb-1">出題された問題</span>
                      <p className="text-sm text-slate-700">
                        {item.question}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-slate-400 mt-3 pt-3 border-t">
                    <span>
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(item.date).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabBookScreen;
