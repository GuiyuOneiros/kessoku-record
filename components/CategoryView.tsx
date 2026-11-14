import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Tv,
  Radio,
  Mic2,
  Music,
  Sparkles,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  X
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { VideoLink, CategoryType, DEFAULT_SUB_CATEGORIES } from '../types';
import { VideoCard } from './VideoCard';

interface CategoryViewProps {
  videos: VideoLink[];
  onCategoryView?: (category: CategoryType) => void;
  onVideoClick?: (video: VideoLink) => void;
}

const PAGE_SIZE = 40;

export const CategoryView: React.FC<CategoryViewProps> = ({
  videos,
  onCategoryView,
  onVideoClick
}) => {
  const { type } = useParams<{ type: string }>();
  const [selectedSubCat, setSelectedSubCat] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const categoryConfig = CATEGORIES.find(c => c.id === type);

  useEffect(() => {
    setSelectedSubCat('ALL');
    setSelectedTag('ALL');
    setSelectedYear('ALL');
    setSearchQuery('');
    setCurrentPage(1);
    if (categoryConfig) {
      onCategoryView?.(categoryConfig.id);
    }
  }, [type]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubCat, selectedTag, selectedYear, searchQuery]);

  if (!categoryConfig) {
    return <Navigate to="/" replace />;
  }

  const categoryVideos = useMemo(() => {
    return videos
      .filter(v => v.category === categoryConfig.id)
      .sort((a, b) => {
        const timeA = a.dateAdded || new Date(a.addedAt || 0).getTime() || 0;
        const timeB = b.dateAdded || new Date(b.addedAt || 0).getTime() || 0;
        return timeB - timeA;
      });
  }, [videos, categoryConfig.id]);

  // Subcategories ordered by preset first, then any custom ones
  const subCategories = useMemo(() => {
    const presetOrder = DEFAULT_SUB_CATEGORIES[categoryConfig.id] || [];
    const existingSet = new Set<string>();
    categoryVideos.forEach(v => {
      if (v.subCategory) existingSet.add(v.subCategory);
    });
    const ordered = presetOrder.filter(sc => existingSet.has(sc));
    const extras = Array.from(existingSet)
      .filter(sc => !presetOrder.includes(sc))
      .sort();
    return ['ALL', ...ordered, ...extras];
  }, [categoryVideos, categoryConfig.id]);

  // Available 3rd-level performer/cast tags in this category (or current subCategory)
  const availableTags = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseList =
      selectedSubCat === 'ALL'
        ? categoryVideos
        : categoryVideos.filter(v => v.subCategory === selectedSubCat);

    baseList.forEach(v => {
      (v.tags || []).forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [categoryVideos, selectedSubCat]);

  const years = useMemo(() => {
    const yrs = new Set<string>();
    categoryVideos.forEach(v => {
      const dateStr = v.addedAt || '';
      const year = dateStr.split('-')[0];
      if (year && /^\d{4}$/.test(year)) yrs.add(year);
    });
    return ['ALL', ...Array.from(yrs).sort().reverse()];
  }, [categoryVideos]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categoryVideos.filter(v => {
      const dateStr = v.addedAt || '';
      const titleStr = v.title || '';
      const matchSub = selectedSubCat === 'ALL' || v.subCategory === selectedSubCat;
      const matchTag = selectedTag === 'ALL' || (v.tags || []).includes(selectedTag);
      const matchYear = selectedYear === 'ALL' || dateStr.startsWith(selectedYear);
      const matchSearch =
        !q ||
        titleStr.toLowerCase().includes(q) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(q)) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(q)));
      return matchSub && matchTag && matchYear && matchSearch;
    });
  }, [categoryVideos, selectedSubCat, selectedTag, selectedYear, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / PAGE_SIZE));
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVideos.slice(start, start + PAGE_SIZE);
  }, [filteredVideos, currentPage]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Tv': return <Tv className="w-6 h-6" />;
      case 'Radio': return <Radio className="w-6 h-6" />;
      case 'Mic2': return <Mic2 className="w-6 h-6" />;
      case 'Music': return <Music className="w-6 h-6" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6" />;
      case 'Calendar': return <Calendar className="w-6 h-6" />;
      default: return <Tv className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-2xl text-white shadow-md"
            style={{ backgroundColor: categoryConfig.color }}
          >
            {getIcon(categoryConfig.iconName)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">{categoryConfig.label}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                {filteredVideos.length} / {categoryVideos.length}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{categoryConfig.description}</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索标题、子分类或出演者..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bili-pink/20 focus:border-bili-pink transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="py-5 space-y-3">
        {/* Row 1: Sub-categories & Year */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <Filter className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
            {subCategories.map(sub => (
              <button
                key={sub}
                onClick={() => setSelectedSubCat(sub)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedSubCat === sub
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                {sub === 'ALL' ? '全部子分类' : sub}
              </button>
            ))}
          </div>

          {years.length > 2 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">年份:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-bili-pink"
              >
                <option value="ALL">全部年份</option>
                {years
                  .filter(y => y !== 'ALL')
                  .map(y => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Row 2: 3rd-level Performer/Cast Tags (only shown when tags exist in this category) */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-400 mr-1">
              <Users className="w-3.5 h-3.5" />
              <span>出演/标签:</span>
            </span>
            <button
              onClick={() => setSelectedTag('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                selectedTag === 'ALL'
                  ? 'bg-bili-pink text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {availableTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? 'ALL' : tag)}
                className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1 ${
                  selectedTag === tag
                    ? 'bg-bili-pink text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tag}</span>
                <span className={`text-[10px] ${selectedTag === tag ? 'text-pink-100' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Grid */}
      {paginatedVideos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onVideoClick={onVideoClick}
                onTagSelect={tag => setSelectedTag(prev => (prev === tag ? 'ALL' : tag))}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-gray-500 px-3">
                第 {currentPage} / {totalPages} 页
              </span>
              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm">没有找到符合筛选条件的视频</p>
          <button
            onClick={() => {
              setSelectedSubCat('ALL');
              setSelectedTag('ALL');
              setSelectedYear('ALL');
              setSearchQuery('');
            }}
            className="mt-3 text-xs text-bili-pink hover:underline font-medium"
          >
            重置筛选条件
          </button>
        </div>
      )}
    </div>
  );
};
