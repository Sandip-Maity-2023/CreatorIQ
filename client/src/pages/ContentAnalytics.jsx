import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  TrendingUp,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { YoutubeIcon, InstagramIcon, LinkedinIcon } from '../components/common/SocialIcons';

const ContentAnalytics = () => {
  const [posts, setPosts] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Inspect other accounts state
  const [showInspector, setShowInspector] = useState(false);
  const [inspectHandle, setInspectHandle] = useState('');
  const [inspectPlatform, setInspectPlatform] = useState('youtube');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectedData, setInspectedData] = useState(null);

  const fetchPostsAndAccounts = async () => {
    try {
      setLoading(true);
      const [postRes, accRes] = await Promise.all([
        client.get(`/api/v1/analytics/content?platform=${filterPlatform}`),
        client.get('/api/v1/integrations/accounts').catch(() => ({ data: [] }))
      ]);
      setPosts(postRes.data);
      setConnectedAccounts(accRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndAccounts();
  }, [filterPlatform]);

  const handleSyncConnected = async () => {
    try {
      setSyncing(true);
      const res = await client.post('/api/v1/analytics/content/sync');
      setStatusMsg(res.data.message || 'Synchronized live post metrics across connected accounts!');
      setTimeout(() => setStatusMsg(''), 4000);
      await fetchPostsAndAccounts();
    } catch (e) {
      console.error(e);
      setStatusMsg('Failed to sync live content metrics.');
      setTimeout(() => setStatusMsg(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleInspectAccount = async (e) => {
    e.preventDefault();
    if (!inspectHandle.trim() || inspectLoading) return;
    try {
      setInspectLoading(true);
      const res = await client.post('/api/v1/analytics/content/inspect-account', {
        handle: inspectHandle,
        platform: inspectPlatform
      });
      setInspectedData(res.data);
    } catch (err) {
      console.error('Account inspect error:', err);
      alert('Could not inspect account metrics. Please verify handle.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Metric aggregates
  const displayedPosts = inspectedData ? inspectedData.posts : posts;
  const totalViews = displayedPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = displayedPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = displayedPosts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const totalShares = displayedPosts.reduce((acc, p) => acc + (p.shares || 0), 0);
  const avgEngagement = displayedPosts.length > 0 
    ? (displayedPosts.reduce((acc, p) => acc + (p.engagement_rate || 0), 0) / displayedPosts.length).toFixed(2)
    : '0.00';

  const getPlatformBadge = (plat) => {
    switch (plat?.toLowerCase()) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <YoutubeIcon className="h-3 w-3" /> YouTube
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <InstagramIcon className="h-3 w-3" /> Instagram
          </span>
        );
      case 'linkedin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <LinkedinIcon className="h-3 w-3" /> LinkedIn
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            TikTok
          </span>
        );
      default:
        return <span className="text-xs text-slate-400 capitalize">{plat}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {statusMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {statusMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-3 border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Live Post-Level Telemetry Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Content Performance <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Live views, likes, comments, shares, and engagement rates across your connected social channels or any inspected public account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-cyan-400 text-xs font-semibold transition-all"
          >
            <Search className="h-4 w-4" />
            <span>{showInspector ? 'Hide Account Inspector' : 'Inspect Other Accounts'}</span>
          </button>

          <button
            onClick={handleSyncConnected}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
            title="Fetch actual post metrics from connected YouTube & Zernio APIs"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Live Posts...' : 'Sync Connected Channels'}</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Inspect Any Account Drawer */}
      {showInspector && (
        <div className="glass-panel p-6 border border-cyan-500/20 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-cyan-400" />
              Inspect Post Metrics for Any Creator or Account
            </h3>
            {inspectedData && (
              <button
                onClick={() => setInspectedData(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Back to My Connected Posts
              </button>
            )}
          </div>

          <form onSubmit={handleInspectAccount} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-48">
              <select
                value={inspectPlatform}
                onChange={(e) => setInspectPlatform(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="youtube">YouTube Channel</option>
                <option value="instagram">Instagram Account</option>
                <option value="tiktok">TikTok Handle</option>
                <option value="linkedin">LinkedIn Profile</option>
              </select>
            </div>

            <div className="flex-1 w-full">
              <input
                type="text"
                required
                value={inspectHandle}
                onChange={(e) => setInspectHandle(e.target.value)}
                placeholder="Enter handle or channel name (e.g. @MrBeast, @mkbhd, @AlexRiveraTech)"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={inspectLoading || !inspectHandle.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {inspectLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              <span>Inspect Posts & Metrics</span>
            </button>
          </form>

          {inspectedData && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-semibold">
                Viewing live post performance for <b>{inspectedData.handle}</b> on <b>{inspectedData.platform}</b>
              </span>
              <span className="text-slate-400">
                {inspectedData.total_posts} uploads analyzed &bull; Avg Engagement: <b>{inspectedData.avg_engagement_rate}%</b>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Aggregate KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Posts</span>
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-white">{displayedPosts.length}</div>
          <span className="text-[10px] text-slate-500">Tracked uploads</span>
        </div>

        <div className="glass-card p-4 border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Actual Views</span>
            <Eye className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white">{totalViews.toLocaleString()}</div>
          <span className="text-[10px] text-cyan-400">Total Viewers</span>
        </div>

        <div className="glass-card p-4 border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Likes</span>
            <Heart className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-white">{totalLikes.toLocaleString()}</div>
          <span className="text-[10px] text-rose-400">Audience reactions</span>
        </div>

        <div className="glass-card p-4 border border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Comments</span>
            <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white">{totalComments.toLocaleString()}</div>
          <span className="text-[10px] text-amber-400">Direct discussions</span>
        </div>

        <div className="glass-card p-4 border border-white/5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Engagement Rate</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">{avgEngagement}%</div>
          <span className="text-[10px] text-slate-500">{totalShares.toLocaleString()} shares</span>
        </div>
      </div>

      {/* Posts Table Panel */}
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {inspectedData ? `Inspected Posts (${inspectedData.handle})` : 'Published Content & Actual Performance'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any title to view the post directly on the live platform
            </p>
          </div>

          {/* Filter Pills */}
          {!inspectedData && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-white/5">
              {['all', 'youtube', 'instagram', 'linkedin'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filterPlatform === p 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="px-6 py-4 text-xs font-semibold text-slate-400 border-b border-white/5 flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>Refreshing content telemetry...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 border-b border-white/5 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="px-6 py-4">Content Title & Media</th>
                <th className="px-6 py-4">Platform</th>
                <th className="px-6 py-4 text-right">Actual Views</th>
                <th className="px-6 py-4 text-right">Likes</th>
                <th className="px-6 py-4 text-right">Comments</th>
                <th className="px-6 py-4 text-right">Shares</th>
                <th className="px-6 py-4 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {displayedPosts.map((post) => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {post.thumbnail_url && (
                        <img
                          src={post.thumbnail_url}
                          alt="thumb"
                          className="w-14 h-9 object-cover rounded-lg border border-white/10 shrink-0"
                        />
                      )}
                      <div className="max-w-md">
                        {post.post_url ? (
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-white hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 group"
                          >
                            <span className="truncate">{post.title}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>
                        ) : (
                          <span className="font-semibold text-white truncate block">{post.title}</span>
                        )}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Published {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recent'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlatformBadge(post.platform)}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">
                    {(post.views || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-200">
                    {(post.likes || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-200">
                    {(post.comments || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-200">
                    {(post.shares || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full text-xs border border-emerald-500/20">
                      <TrendingUp className="h-3 w-3" />
                      {post.engagement_rate || 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalytics;
