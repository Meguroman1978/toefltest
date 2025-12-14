import React, { useState, useEffect } from 'react';
import { 
  analyzeYouTubeVideo, 
  batchAnalyzeVideos, 
  buildKnowledgeBase,
  saveKnowledgeBase,
  loadKnowledgeBase,
  needsUpdate,
  TOEFL_YOUTUBE_CHANNELS,
  SAMPLE_VIDEOS,
  YouTubeAnalysisResult,
  KnowledgeBase
} from '../services/youtubeAnalyzer';
import { getDiversityScore, getTopicStatistics, clearHistory } from '../services/questionHistory';

interface KnowledgeUpdateScreenProps {
  onClose: () => void;
}

const KnowledgeUpdateScreen: React.FC<KnowledgeUpdateScreenProps> = ({ onClose }) => {
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentVideo, setCurrentVideo] = useState('');
  const [analysisResults, setAnalysisResults] = useState<YouTubeAnalysisResult[]>([]);
  const [customUrl, setCustomUrl] = useState('');

  useEffect(() => {
    const loaded = loadKnowledgeBase();
    setKb(loaded);
  }, []);

  const handleQuickUpdate = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      // Analyze sample videos
      const results: YouTubeAnalysisResult[] = [];
      const videos = SAMPLE_VIDEOS.slice(0, 5); // Limit to 5 for quick update

      for (let i = 0; i < videos.length; i++) {
        setCurrentVideo(videos[i]);
        setProgress(((i + 1) / videos.length) * 100);
        
        try {
          const section = i % 4 === 0 ? 'Reading' : i % 4 === 1 ? 'Listening' : i % 4 === 2 ? 'Speaking' : 'Writing';
          const result = await analyzeYouTubeVideo(videos[i], section as any);
          results.push(result);
        } catch (error) {
          console.error(`Failed to analyze ${videos[i]}:`, error);
        }
      }

      setAnalysisResults(results);
      
      // Build and save knowledge base
      const newKb = buildKnowledgeBase(results);
      saveKnowledgeBase(newKb);
      setKb(newKb);
      
      alert('✅ Knowledge base updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('❌ Update failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentVideo('');
    }
  };

  const handleAnalyzeCustomUrl = async () => {
    if (!customUrl) {
      alert('Please enter a YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    setCurrentVideo(customUrl);

    try {
      const result = await analyzeYouTubeVideo(customUrl, 'General');
      setAnalysisResults([result]);
      
      // Merge with existing knowledge base
      const existingKb = loadKnowledgeBase();
      const newKb = existingKb || buildKnowledgeBase([]);
      const mergedKb = buildKnowledgeBase([...analysisResults, result]);
      
      // Merge strategies
      newKb.reading.strategies = [...new Set([...newKb.reading.strategies, ...mergedKb.reading.strategies])];
      newKb.listening.strategies = [...new Set([...newKb.listening.strategies, ...mergedKb.listening.strategies])];
      newKb.speaking.strategies = [...new Set([...newKb.speaking.strategies, ...mergedKb.speaking.strategies])];
      newKb.writing.strategies = [...new Set([...newKb.writing.strategies, ...mergedKb.writing.strategies])];
      newKb.lastUpdated = new Date().toISOString();
      
      saveKnowledgeBase(newKb);
      setKb(newKb);
      
      alert('✅ Video analyzed and knowledge base updated!');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('❌ Analysis failed. Please check the URL and try again.');
    } finally {
      setIsAnalyzing(false);
      setCurrentVideo('');
      setCustomUrl('');
    }
  };

  const diversityScore = getDiversityScore();
  const topicStats = getTopicStatistics();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <i className="fas fa-graduation-cap"></i>
              Knowledge Base Manager
            </h2>
            <p className="text-indigo-100 text-sm mt-1">YouTube analysis & question diversity tracking</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Last Updated</div>
            <div className="font-bold text-slate-800">
              {kb ? new Date(kb.lastUpdated).toLocaleDateString() : 'Never'}
            </div>
            {kb && needsUpdate(kb) && (
              <span className="text-xs text-orange-600">⚠️ Needs update</span>
            )}
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Diversity Score</div>
            <div className="font-bold text-slate-800">
              {(diversityScore * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-500">
              {diversityScore > 0.7 ? '✅ Excellent' : diversityScore > 0.5 ? '⚠️ Good' : '❌ Needs variety'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Total Questions</div>
            <div className="font-bold text-slate-800">
              {topicStats.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <div className="text-xs text-slate-500">Generated</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Quick Update */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-indigo-900">
              <i className="fas fa-bolt"></i> Quick Update
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Analyze sample videos from top TOEFL YouTube channels to update strategies and tips.
            </p>
            <button
              onClick={handleQuickUpdate}
              disabled={isAnalyzing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Analyzing... {progress.toFixed(0)}%
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i> Update Knowledge Base
                </>
              )}
            </button>
            
            {isAnalyzing && currentVideo && (
              <div className="mt-4 text-xs text-slate-500">
                Analyzing: <span className="font-mono">{currentVideo}</span>
              </div>
            )}
          </div>

          {/* Custom URL Analysis */}
          <div className="mb-6 bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-slate-800">
              <i className="fas fa-link"></i> Analyze Custom Video
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Paste a YouTube URL to analyze specific TOEFL content.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleAnalyzeCustomUrl}
                disabled={isAnalyzing || !customUrl}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-lg font-bold transition-all"
              >
                <i className="fas fa-search"></i> Analyze
              </button>
            </div>
          </div>

          {/* Knowledge Base Summary */}
          {kb && (
            <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                <i className="fas fa-database"></i> Knowledge Base Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-blue-600 mb-2">📖 Reading</div>
                  <div className="text-slate-600">
                    {kb.reading.strategies.length} strategies<br/>
                    {kb.reading.tips.length} tips
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-green-600 mb-2">🎧 Listening</div>
                  <div className="text-slate-600">
                    {kb.listening.strategies.length} strategies<br/>
                    {kb.listening.tips.length} tips
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-orange-600 mb-2">🗣️ Speaking</div>
                  <div className="text-slate-600">
                    {kb.speaking.strategies.length} strategies<br/>
                    {Object.keys(kb.speaking.templates).length} templates
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600 mb-2">✍️ Writing</div>
                  <div className="text-slate-600">
                    {kb.writing.strategies.length} strategies<br/>
                    {Object.keys(kb.writing.templates).length} templates
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Topic Statistics */}
          {topicStats.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                <i className="fas fa-chart-bar"></i> Topic Distribution
              </h3>
              <div className="space-y-2">
                {topicStats.slice(0, 10).map((stat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium text-slate-700 truncate">
                      {stat.topic}
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-end px-2 transition-all duration-500"
                        style={{ width: `${(stat.count / topicStats[0].count) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-white">{stat.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-6 bg-red-50 p-6 rounded-xl border border-red-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-red-800">
              <i className="fas fa-exclamation-triangle"></i> Reset Data
            </h3>
            <p className="text-sm text-red-600 mb-4">
              Clear all question history and knowledge base. This action cannot be undone.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Are you sure? This will clear all generated question history.')) {
                  clearHistory();
                  localStorage.removeItem('toefl_knowledge_base');
                  setKb(null);
                  alert('✅ All data has been reset.');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
            >
              <i className="fas fa-trash-alt mr-2"></i> Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeUpdateScreen;
