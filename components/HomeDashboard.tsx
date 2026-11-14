import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Radio, Mic2, Music, Sparkles, Calendar, ArrowRight, Search, X } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { VideoLink, CategoryConfig } from '../types';
import { VideoCard } from './VideoCard';

interface HomeDashboardProps {
  videos: VideoLink[];
  onVideoClick?: (video: VideoLink) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ videos, onVideoClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv': return <Tv className="w-7 h-7" />;
      case 'Radio': return <Radio className="w-7 h-7" />;
      case 'Mic2': return <Mic2 className="w-7 h-7" />;
      case 'Music': return <Music className="w-7 h-7" />;
      case 'Sparkles': return <Sparkles className="w-7 h-7" />;
      case 'Calendar': return <Calendar className="w-7 h-7" />;
      default: return <Tv className="w-7 h-7" />;
    }
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of videos) {
      map[v.category] = (map[v.category] || 0) + 1;
    }
    return map;
  }, [videos]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return videos
      .filter(v => {
        const inTitle = (v.title || '').toLowerCase().includes(q);
        const inSub = (v.subCategory || '').toLowerCase().includes(q);
        const inTags = (v.tags || []).some(t => t.toLowerCase().includes(q));
        return inTitle || inSub || inTags;
      })
      .sort((a, b) => {
        const timeA = a.dateAdded || new Date(a.addedAt || 0).getTime() || 0;
        const timeB = b.dateAdded || new Date(b.addedAt || 0).getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, 30);
  }, [videos, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-3">
        <div className="inline-block px-3 py-1 rounded-full bg-pink-50 text-bili-pink text-xs font-bold tracking-widest uppercase mb-1">
          Unofficial Archives
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight font-display">
          BOCCHI THE <span className="text-bili-pink">RECORD</span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base font-normal">
          结束乐队 (Kessoku Band) 视频索引数据库 · 非官方粉丝站
        </p>

        {/* Clean Search Bar */}
        <div className="max-w-md mx-auto pt-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="快速搜索标题、子分类或声优/演员..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-800 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-bili-pink/20 focus:border-bili-pink transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instant Search Results (Only visible when typing) */}
      {searchQuery.trim() !== '' && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">
              搜索结果 {searchResults.length > 0 ? `(前 ${searchResults.length} 条)` : '(0)'}
            </h2>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              清除搜索
            </button>
          </div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onVideoClick={onVideoClick}
                  onTagSelect={tag => setSearchQuery(tag)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
              没有找到匹配的记录
            </div>
          )}
        </div>
      )}

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat: CategoryConfig) => {
          const count = counts[cat.id] || 0;

          return (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between h-48 hover:-translate-y-1"
            >
              {/* Decorative Background Circle */}
              <div
                className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 pointer-events-none"
                style={{ backgroundColor: cat.color }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: cat.color }}
                  >
                    {getIcon(cat.iconName)}
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                    {count} ITEMS
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 group-hover:text-bili-pink transition-colors">
                  {cat.label}
                </h2>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {cat.description}
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-gray-400 group-hover:text-gray-800 transition-colors mt-auto pt-4">
                <span>浏览分区</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};