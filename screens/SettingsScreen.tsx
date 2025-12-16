import React, { useState, useEffect } from 'react';
import { hasApiKey, setApiKey as saveApiKey } from '../services/geminiService';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [apiKey, setApiKeyLocal] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const configured = hasApiKey();
    setIsConfigured(configured);
    if (configured) {
      const stored = localStorage.getItem('GEMINI_API_KEY') || '';
      setApiKeyLocal(stored);
    }
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'API Keyを入力してください' });
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setMessage({ type: 'error', text: 'Gemini API Keyは"AIza"で始まります' });
      return;
    }

    saveApiKey(apiKey);
    setIsConfigured(true);
    setMessage({ type: 'success', text: 'API Keyが保存されました！' });
    
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const handleClear = () => {
    if (window.confirm('API Keyを削除しますか？')) {
      localStorage.removeItem('GEMINI_API_KEY');
      setApiKeyLocal('');
      setIsConfigured(false);
      setMessage({ type: 'success', text: 'API Keyが削除されました' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left text-slate-600"></i>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
              <p className="text-sm text-slate-500">Gemini API Key の設定</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            {isConfigured ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                <i className="fas fa-check-circle"></i>
                <span>API Key が設定されています</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                <i className="fas fa-exclamation-triangle"></i>
                <span>API Key が未設定です</span>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <i className={`fas fa-${message.type === 'success' ? 'check' : 'exclamation'}-circle mr-2`}></i>
              {message.text}
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKeyLocal(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-24"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                >
                  <i className={`fas fa-eye${showKey ? '-slash' : ''}`}></i>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                API KeyはブラウザのlocalStorageに保存されます（サーバーには送信されません）
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-save"></i>
                <span>保存</span>
              </button>
              
              {isConfigured && (
                <button
                  onClick={handleClear}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-trash"></i>
                  <span>削除</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i className="fas fa-question-circle text-indigo-600"></i>
            <span>API Keyの取得方法</span>
          </h2>
          
          <ol className="space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">1</span>
              <div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">
                  Google AI Studio <i className="fas fa-external-link-alt text-xs"></i>
                </a> にアクセス
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">2</span>
              <span>「Create API Key」をクリック</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">3</span>
              <span>生成されたAPI Key（AIza...で始まる文字列）をコピー</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">4</span>
              <span>上の入力欄に貼り付けて「保存」をクリック</span>
            </li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <i className="fas fa-shield-alt mr-2"></i>
            <strong>セキュリティ:</strong> API Keyはあなたのブラウザにのみ保存され、外部に送信されることはありません。
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
