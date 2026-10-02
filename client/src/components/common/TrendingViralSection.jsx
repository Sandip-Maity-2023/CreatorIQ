import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { 
  Flame, 
  Eye, 
  ThumbsUp, 
  ExternalLink, 
  RefreshCw, 
  Play
} from 'lucide-react';
import { YoutubeIcon } from './SocialIcons';

const TrendingViralSection = () => {
  const [trending, setTrending] = useState([]);
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('US');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrending = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (region) params.append('region', region);

      const res = await client.get(`/api/v1/analytics/trending?${params.toString()}`);
      setTrending(res.data.items || []);
    } catch (e) {
      console.error("Failed to fetch trending videos", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, [category, region]);

  const categories = [
    { id: '', label: 'All Trends' },
    { id: 'tech', label: 'Tech & Gadgets' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'music', label: 'Music' },
    { id: 'entertainment', label: 'Entertainment' }
  ];

  const regions = [
    { code: 'US', label: '🇺🇸 United States' },
    { code: 'IN', label: '🇮🇳 India' },
    { code: 'GB', label: '🇬🇧 United Kingdom' },
    { code: 'CA', label: '🇨🇦 Canada' }
  ];

  return (
    <div className="glass-panel p-6 border border-white/10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-1.5 border border-rose-500/20">
            <Flame className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
            Live YouTube Viral Intelligence
          </div>
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            Most Trending Videos & Viral Content
          </h3>
          <p className="text-xs text-slate-400">
            Real-time multi-database cache from live YouTube Data API v3 (Archived in MongoDB, cached via Redis)
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Region selector */}
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {regions.map((r) => (
              <option key={r.code} value={r.code}>{r.label}</option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={() => fetchTrending(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Refresh Live YouTube Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              category === c.id
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-900/80 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
            <span className="text-xs text-slate-400 font-medium">Polling live viral trends...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trending.map((item, idx) => (
            <div
              key={item.id || idx}
              className="glass-card group overflow-hidden border border-white/5 hover:border-rose-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image Container */}
                <div className="relative aspect-video overflow-hidden rounded-t-xl bg-slate-900">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-rose-400 border border-rose-500/30 flex items-center gap-1 shadow-lg">
                    <Flame className="h-3 w-3 fill-rose-500 text-rose-500" />
                    #{item.rank || idx + 1} Viral
                  </div>

                  {/* Play Overlay */}
                  <a
                    href={item.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <div className="h-10 w-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/50">
                      <Play className="h-5 w-5 fill-white ml-0.5" />
                    </div>
                  </a>
                </div>

                {/* Body Content */}
                <div className="p-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <YoutubeIcon className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-400 truncate">
                      {item.channel_title}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-relaxed group-hover:text-rose-300 transition-colors">
                    {item.title}
                  </h4>
                </div>
              </div>

              {/* Card Footer: Metrics */}
              <div className="p-3.5 pt-0 border-t border-white/5 mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-semibold text-slate-300">
                    <Eye className="h-3 w-3 text-slate-500" />
                    {item.views >= 1000000
                      ? `${(item.views / 1000000).toFixed(1)}M`
                      : item.views >= 1000
                      ? `${(item.views / 1000).toFixed(0)}k`
                      : item.views}
                  </span>
                  {item.likes > 0 && (
                    <span className="flex items-center gap-1 font-medium text-slate-400">
                      <ThumbsUp className="h-3 w-3 text-slate-500" />
                      {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(0)}k` : item.likes}
                    </span>
                  )}
                </div>

                <a
                  href={item.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <span>Watch</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingViralSection;
