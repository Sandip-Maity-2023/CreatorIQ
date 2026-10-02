import React, { useState } from 'react';
import client from '../api/client';
import {
  Hash,
  AtSign,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  Key,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon } from '../components/common/SocialIcons';

const SocialTools = () => {
  const [activeTab, setActiveTab] = useState('hashtag'); // 'hashtag' | 'username'
  const [copiedTag, setCopiedTag] = useState('');

  // Hashtag State
  const [hashtag, setHashtag] = useState('growthhacks');
  const [hashPlatform, setHashPlatform] = useState('instagram');
  const [hashtagData, setHashtagData] = useState(null);
  const [hashLoading, setHashLoading] = useState(false);

  // Username State
  const [username, setUsername] = useState('creatorhub');
  const [usernameData, setUsernameData] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  const handleCheckHashtag = async (e, tagOverride = null) => {
    if (e) e.preventDefault();
    const queryTag = tagOverride || hashtag;
    if (!queryTag.trim() || hashLoading) return;

    setHashLoading(true);
    try {
      const res = await client.post('/api/v1/tools/hashtag-analytics', {
        hashtag: queryTag,
        platform: hashPlatform
      });
      setHashtagData(res.data);
      if (tagOverride) setHashtag(tagOverride.replace('#', ''));
    } catch (err) {
      console.error('Hashtag query error:', err);
    } finally {
      setHashLoading(false);
    }
  };

  const handleCheckUsername = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || userLoading) return;

    setUserLoading(true);
    try {
      const res = await client.post('/api/v1/tools/username-availability', {
        username: username
      });
      setUsernameData(res.data);
    } catch (err) {
      console.error('Username check error:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(text);
    setTimeout(() => setCopiedTag(''), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
            <Zap className="h-3.5 w-3.5" />
            Zernio Standard Built-In Utility Endpoints (Zero Account Balance Charge)
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Free Social Media <span className="gradient-text">Creator Tools</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Scan trending hashtags on Instagram & TikTok to evaluate algorithmic potential reach, or instantly verify handle availability across 6 social networks simultaneously.
          </p>
        </div>

        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-emerald-600/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('hashtag')}
          className={`px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'hashtag'
              ? 'border-indigo-500 text-indigo-400 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4 text-pink-400" />
          Hashtag Checker & Analytics
        </button>
        <button
          onClick={() => setActiveTab('username')}
          className={`px-6 py-3 font-bold text-sm transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'username'
              ? 'border-indigo-500 text-indigo-400 bg-white/5'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AtSign className="w-4 h-4 text-cyan-400" />
          Universal Username Availability
        </button>
      </div>

      {/* TAB 1: HASHTAG CHECKER */}
      {activeTab === 'hashtag' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <form onSubmit={handleCheckHashtag} className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-400">Platform:</span>
                <select
                  value={hashPlatform}
                  onChange={(e) => setHashPlatform(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>

              <div className="relative flex-1 w-full">
                <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="Enter hashtag without # (e.g. contentcreator, techtrends, fitness)"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={hashLoading || !hashtag.trim()}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {hashLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Scan Hashtag Reach</span>
              </button>
            </form>
          </div>

          {/* Hashtag Results Display */}
          {hashtagData && (
            <div className="space-y-6 animate-fade-in">
              {/* Metric Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Potential Reach</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {hashtagData.potential_reach?.toLocaleString() || '1,840,000'}
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">{hashtagData.growth_velocity || '+24% this week'}</p>
                </div>

                <div className="glass-card p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Competition Level</span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {hashtagData.competition_label || 'Medium'}
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${hashtagData.competition_score || 55}%` }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Avg Engagement / Post</span>
                    <Sparkles className="w-4 h-4 text-pink-400" />
                  </div>
                  <div className="text-2xl font-black text-white">
                    {hashtagData.avg_likes?.toLocaleString() || '12,400'} Likes
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    ~{hashtagData.avg_comments?.toLocaleString() || '620'} comments / post
                  </p>
                </div>

                <div className="glass-card p-5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Prime Posting Window</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-amber-400">
                    {hashtagData.best_posting_window || '18:00 - 21:00 UTC'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Algorithmic peak feed velocity</p>
                </div>
              </div>

              {/* Recommendation & Related Tags Cloud */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 md:col-span-1 border border-white/5 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Strategy Recommendation
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {hashtagData.niche_recommendation ||
                      'Combine this broad tag with 3 high-intent micro tags to bypass oversaturation.'}
                  </p>
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300">
                    💡 <b>Pro Tip:</b> Do not paste more than 5 hashtags in the first line of captions; place extended tags at the end.
                  </div>
                </div>

                <div className="glass-panel p-6 md:col-span-2 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white">Recommended High-Velocity Hashtags</h3>
                    <span className="text-xs text-slate-500">Click any tag to scan or copy</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hashtagData.related_hashtags?.map((tag, idx) => (
                      <div
                        key={idx}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/30 text-xs font-medium text-slate-300 transition-all cursor-pointer"
                      >
                        <span onClick={() => handleCheckHashtag(null, tag)}>{tag}</span>
                        <button
                          onClick={() => copyToClipboard(tag)}
                          className="opacity-0 group-hover:opacity-100 hover:text-indigo-400 transition-opacity ml-1"
                          title="Copy to clipboard"
                        >
                          {copiedTag === tag ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERNAME AVAILABILITY */}
      {activeTab === 'username' && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <form onSubmit={handleCheckUsername} className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter handle to verify across platforms (e.g. techdaily, alexrivera)"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={userLoading || !username.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {userLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Check Multi-Network Availability</span>
              </button>
            </form>
          </div>

          {/* Username Results */}
          {usernameData && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between p-4 rounded-xl glass-panel border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-sm">
                    {usernameData.username}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{usernameData.summary}</h3>
                    <p className="text-xs text-slate-400">Simultaneous real-time endpoint telemetry</p>
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {usernameData.available_count} Available
                </div>
              </div>

              {/* Network Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(usernameData.platforms || usernameData.networks || []).map((net, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-4 border border-white/5 flex items-center justify-between hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-white/10">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{net.platform}</span>
                        <a
                          href={net.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 mt-0.5"
                        >
                          Visit Platform <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold ${
                          net.available
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {net.available ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Available
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Taken
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialTools;
