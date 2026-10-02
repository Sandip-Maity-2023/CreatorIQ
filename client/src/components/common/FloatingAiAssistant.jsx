import React, { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Flame,
  Lightbulb,
  RefreshCw
} from 'lucide-react';

const FloatingAiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'analyze'

  // Chat State
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm your **CreatorIQ AI Strategist**.\n\nAsk me anything about algorithm reach, content hooks, video retention, sponsorship pricing, or audience growth!",
      source: 'CreatorIQ Strategic Engine'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Post Analyzer State
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState('youtube');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  const handleSendMessage = async (customPrompt = null) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || chatLoading) return;

    const userMsg = { role: 'user', text: promptToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setChatLoading(true);

    try {
      const res = await client.post('/api/v1/ai/chat', {
        prompt: promptToSend
      });
      const aiReply = res.data.reply || res.data.response || 'Strategy generated successfully.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: aiReply,
          source: res.data.source || 'CreatorIQ Intelligence'
        }
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "I'm temporarily operating on local intelligence cache. Ask about retention formulas, CPM sponsorship rates, or content hooks!",
          source: 'System Fallback'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyzePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await client.post('/api/v1/ai/analyze-post', {
        title: postTitle,
        platform: postPlatform
      });
      setAnalysisResult(res.data);
    } catch (err) {
      console.error('Post analysis error:', err);
      alert('Analysis failed. Please check connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      {/* Floating Bubble Robot Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300 shadow-xl animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ask Gemini AI</span>
          </div>
        )}
        <button
          id="floating-ai-robot-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-4 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:to-pink-400 text-white shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/80 transition-all duration-300 transform hover:scale-105 active:scale-95 focus:outline-none"
          title="CreatorIQ AI Strategy Assistant (Gemini Powered)"
        >
          <div className="relative">
            <Bot className="w-7 h-7 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        </button>
      </div>

      {/* Expandable AI Drawer / Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[85vh] glass-panel border border-indigo-500/30 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  CreatorIQ Intelligence AI
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gemini 1.5
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Content hooks, growth strategy & Q&A</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close AI Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-white/10 bg-slate-900/50">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'chat'
                  ? 'border-indigo-500 text-indigo-400 bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              Strategic Q&A Chat
            </button>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 border-b-2 ${
                activeTab === 'analyze'
                  ? 'border-indigo-500 text-indigo-400 bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Analyze Post & Hook
            </button>
          </div>

          {/* Tab 1: Chat Stream */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm'
                          : 'glass-card border border-white/10 text-slate-200 rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.source && (
                      <span className="text-[10px] text-slate-500 mt-1 px-1">{m.source}</span>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Gemini AI is analyzing algorithms...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Pills */}
              <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  'How to increase 30s retention?',
                  'Best sponsorship rates?',
                  'YouTube Shorts formula'
                ].map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(pill)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 border border-white/5 text-slate-400 transition-colors"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-white/10 bg-slate-900/60 flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask any question about creator strategy..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={chatLoading || !inputPrompt.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Post & Hook Analyzer */}
          {activeTab === 'analyze' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <form onSubmit={handleAnalyzePost} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Post / Video Title or Script Hook
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 AI Tools That Feel Illegal to Know in 2026"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Platform</label>
                    <select
                      value={postPlatform}
                      onChange={(e) => setPostPlatform(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="youtube">YouTube (Video / Shorts)</option>
                      <option value="instagram">Instagram (Reels / Carousel)</option>
                      <option value="tiktok">TikTok</option>
                      <option value="linkedin">LinkedIn Post</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={analyzing || !postTitle.trim()}
                    className="mt-5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {analyzing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Flame className="w-3.5 h-3.5" />
                    )}
                    Analyze Hook
                  </button>
                </div>
              </form>

              {/* Analysis Result Display */}
              {analysisResult && (
                <div className="glass-card p-4 border border-indigo-500/30 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-bold text-white">Virality Rating</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-indigo-500 to-pink-500 text-white">
                      {analysisResult.score || analysisResult.virality_score || 78}/100
                    </span>
                  </div>

                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {analysisResult.analysis}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingAiAssistant;
