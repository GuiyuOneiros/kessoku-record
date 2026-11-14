import React, { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Plus,
  Download,
  Upload,
  KeyRound,
  Save,
  CloudUpload,
  Edit2,
  RotateCcw,
  Loader2,
  Search,
  Wand2,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  BarChart3,
  Eye,
  MousePointerClick,
  Layers,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  VideoLink,
  CategoryType,
  SiteStats,
  DEFAULT_SUB_CATEGORIES,
  DEFAULT_TAG_GROUPS
} from '../types';
import { CATEGORIES, ADMIN_UUID, INITIAL_VIDEOS } from '../constants';
import {
  getLocalVideos,
  saveLocalVideos,
  saveVideosToCloud,
  extractBvid,
  inferTagsFromVideo,
  fetchSiteStats
} from '../services/storage';

interface AdminPanelProps {
  onDataChange: (videos: VideoLink[]) => void;
  stats: SiteStats;
  onRefreshStats: () => Promise<void>;
}

const ADMIN_PAGE_SIZE = 50;

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onDataChange,
  stats,
  onRefreshStats
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uuidInput, setUuidInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Admin Main Tab: 'videos' | 'stats'
  const [activeTab, setActiveTab] = useState<'videos' | 'stats'>('videos');
  const [refreshingStats, setRefreshingStats] = useState(false);

  const [videos, setVideos] = useState<VideoLink[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    msg: string;
    type: 'info' | 'success' | 'error';
  }>({
    loading: false,
    msg: '',
    type: 'info'
  });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<CategoryType>(CategoryType.ANIMATION);
  const [subCategory, setSubCategory] = useState('正片');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [isCustomSubCat, setIsCustomSubCat] = useState(false);

  // Table Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('ALL');
  const [filterSubCat, setFilterSubCat] = useState<string>('ALL');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Batch Operations State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchTagToAdd, setBatchTagToAdd] = useState('');
  const [batchSubCat, setBatchSubCat] = useState('');
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  useEffect(() => {
    const loaded = getLocalVideos();
    setVideos(loaded);
  }, []);

  useEffect(() => {
    if (!editingId) {
      const defaults = DEFAULT_SUB_CATEGORIES[category];
      if (defaults && defaults.length > 0) {
        setSubCategory(defaults[0]);
        setIsCustomSubCat(false);
      } else {
        setSubCategory('');
        setIsCustomSubCat(true);
      }
    }
  }, [category, editingId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCat, filterSubCat, filterTag]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (uuidInput.trim() === ADMIN_UUID) {
      setIsAuthenticated(true);
      setAuthError(false);
      setCustomDate(new Date().toISOString().split('T')[0]);
    } else {
      setAuthError(true);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setUrl('');
    setSelectedTags([]);
    setCustomTagInput('');
    setCustomDate(new Date().toISOString().split('T')[0]);
    const defaults = DEFAULT_SUB_CATEGORIES[category];
    setSubCategory(defaults ? defaults[0] : '');
    setIsCustomSubCat(false);
  };

  const handleEditClick = (video: VideoLink) => {
    setEditingId(video.id);
    setTitle(video.title);
    setUrl(video.url);
    setCategory(video.category);
    setCustomDate(video.addedAt);
    setSelectedTags(video.tags || []);

    const defaults = DEFAULT_SUB_CATEGORIES[video.category] || [];
    if (video.subCategory && !defaults.includes(video.subCategory)) {
      setIsCustomSubCat(true);
    } else {
      setIsCustomSubCat(false);
    }
    setSubCategory(video.subCategory || '');
  };

  const toggleTagInForm = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTagInForm = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleAutoInferFormTags = () => {
    const inferred = inferTagsFromVideo({
      title,
      subCategory,
      tags: selectedTags
    });
    setSelectedTags(inferred);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    const dateToUse = customDate || new Date().toISOString().split('T')[0];
    let updated: VideoLink[];

    if (editingId) {
      updated = videos.map(v => {
        if (v.id === editingId) {
          return {
            ...v,
            title,
            url,
            bvid: extractBvid(url),
            category,
            subCategory: subCategory || '其他',
            tags: selectedTags,
            addedAt: dateToUse
          };
        }
        return v;
      });
      setSyncStatus({
        loading: false,
        msg: '条目已更新，请记得点击“同步到云端”保存修改',
        type: 'info'
      });
    } else {
      const autoTags =
        selectedTags.length > 0
          ? selectedTags
          : inferTagsFromVideo({ title, subCategory });

      const newVideo: VideoLink = {
        id: Date.now().toString(),
        title,
        url,
        bvid: extractBvid(url),
        category,
        subCategory: subCategory || '其他',
        tags: autoTags,
        addedAt: dateToUse
      };
      updated = [newVideo, ...videos];
      setSyncStatus({
        loading: false,
        msg: '新条目已添加，请记得点击“同步到云端”',
        type: 'info'
      });
    }

    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    if (editingId === id) resetForm();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSyncStatus({ loading: false, msg: '条目已删除 (未同步到云端)', type: 'info' });
  };

  // Batch Operations
  const handleAutoTagAllVideos = () => {
    let enrichedCount = 0;
    const updated = videos.map(v => {
      const before = v.tags?.length || 0;
      const inferred = inferTagsFromVideo(v);
      if (inferred.length > before) enrichedCount++;
      return { ...v, tags: inferred };
    });
    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    setSyncStatus({
      loading: false,
      msg: `智能识别完成！共为 ${enrichedCount} 条视频补充了出演者标签。`,
      type: 'success'
    });
  };

  const handleBatchAddTag = () => {
    const tag = batchTagToAdd.trim();
    if (!tag || selectedIds.size === 0) return;
    const updated = videos.map(v => {
      if (!selectedIds.has(v.id)) return v;
      const nextTags = Array.from(new Set([...(v.tags || []), tag]));
      return { ...v, tags: nextTags };
    });
    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    setBatchTagToAdd('');
    setSyncStatus({
      loading: false,
      msg: `已为选中的 ${selectedIds.size} 条视频添加标签「#${tag}」`,
      type: 'success'
    });
  };

  const handleBatchSubCategory = () => {
    const sc = batchSubCat.trim();
    if (!sc || selectedIds.size === 0) return;
    const updated = videos.map(v => (selectedIds.has(v.id) ? { ...v, subCategory: sc } : v));
    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    setBatchSubCat('');
    setSyncStatus({
      loading: false,
      msg: `已将选中的 ${selectedIds.size} 条视频子分类修改为「${sc}」`,
      type: 'success'
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const updated = videos.filter(v => !selectedIds.has(v.id));
    setVideos(updated);
    saveLocalVideos(updated);
    onDataChange(updated);
    setSelectedIds(new Set());
    setSyncStatus({
      loading: false,
      msg: `已批量删除 ${count} 条视频记录`,
      type: 'info'
    });
  };

  const handleResetToDefault = () => {
    setVideos(INITIAL_VIDEOS);
    saveLocalVideos(INITIAL_VIDEOS);
    onDataChange(INITIAL_VIDEOS);
    setConfirmResetModal(false);
    setSyncStatus({
      loading: false,
      msg: `已恢复为默认初始数据 (${INITIAL_VIDEOS.length} 条)`,
      type: 'success'
    });
  };

  const handleCloudSync = async () => {
    setSyncStatus({ loading: true, msg: '正在同步至云端 KV...', type: 'info' });
    const result = await saveVideosToCloud(videos, uuidInput.trim());
    setSyncStatus({
      loading: false,
      msg: result.message,
      type: result.success ? 'success' : 'error'
    });
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(videos, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `kessoku_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          const normalized = imported.map(v => {
            let addedAt = typeof v.addedAt === 'string' && v.addedAt.trim() ? v.addedAt.trim() : '';
            if (!addedAt) {
              const ts = typeof v.dateAdded === 'number' ? v.dateAdded : Number(v.id);
              addedAt = !isNaN(ts) && ts > 946684800000
                ? new Date(ts).toISOString().split('T')[0]
                : '2024-01-01';
            }
            return {
              ...v,
              id: String(v.id),
              title: v.title || '未命名视频',
              url: v.url || '',
              addedAt,
              tags: Array.isArray(v.tags) && v.tags.length > 0 ? v.tags : inferTagsFromVideo(v)
            };
          });
          setVideos(normalized);
          saveLocalVideos(normalized);
          onDataChange(normalized);
          setSyncStatus({
            loading: false,
            msg: `成功导入 ${normalized.length} 条数据！请点击“同步到云端”保存`,
            type: 'success'
          });
        }
      } catch {
        setSyncStatus({
          loading: false,
          msg: 'JSON 文件格式错误，请检查文件内容',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

  // Filtered & Paginated Videos for Admin Table
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videos.filter(v => {
      const matchCat = filterCat === 'ALL' || v.category === filterCat;
      const matchSub = filterSubCat === 'ALL' || v.subCategory === filterSubCat;
      const matchTag = filterTag === 'ALL' || (v.tags && v.tags.includes(filterTag));
      const matchSearch =
        !q ||
        (v.title || '').toLowerCase().includes(q) ||
        (v.subCategory && v.subCategory.toLowerCase().includes(q)) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(q)));
      return matchCat && matchSub && matchTag && matchSearch;
    });
  }, [videos, searchQuery, filterCat, filterSubCat, filterTag]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ADMIN_PAGE_SIZE));
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_PAGE_SIZE;
    return filteredVideos.slice(start, start + ADMIN_PAGE_SIZE);
  }, [filteredVideos, currentPage]);

  const availableSubCats = useMemo(() => {
    const set = new Set<string>();
    videos.forEach(v => {
      if (filterCat === 'ALL' || v.category === filterCat) {
        if (v.subCategory) set.add(v.subCategory);
      }
    });
    return Array.from(set).sort();
  }, [videos, filterCat]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    videos.forEach(v => {
      if (filterCat === 'ALL' || v.category === filterCat) {
        (v.tags || []).forEach(t => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [videos, filterCat]);

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectCurrentPage = () => {
    const pageIds = paginatedVideos.map(v => v.id);
    const allSelected =
      pageIds.length > 0 && pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  // Analytics Computations for Stats Tab
  const categoryStatsList = useMemo(() => {
    const maxViews = Math.max(
      1,
      ...CATEGORIES.map(c => stats.categoryViews[c.id] || 0)
    );
    const maxClicks = Math.max(
      1,
      ...CATEGORIES.map(c => stats.categoryClicks[c.id] || 0)
    );

    return CATEGORIES.map(cat => {
      const itemCount = videos.filter(v => v.category === cat.id).length;
      const views = stats.categoryViews[cat.id] || 0;
      const clicks = stats.categoryClicks[cat.id] || 0;
      return {
        ...cat,
        itemCount,
        views,
        clicks,
        viewRatio: Math.round((views / maxViews) * 100),
        clickRatio: Math.round((clicks / maxClicks) * 100)
      };
    });
  }, [videos, stats]);

  const topClickedVideos = useMemo(() => {
    const entries = Object.entries(stats.videoClicks || {}) as [string, number][];
    if (entries.length === 0) return [];
    const videoMap = new Map<string, VideoLink>(videos.map(v => [v.id, v]));
    return entries
      .map(([id, clicks]) => ({
        video: videoMap.get(id),
        clicks
      }))
      .filter((item): item is { video: VideoLink; clicks: number } => Boolean(item.video && item.clicks > 0))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 15);
  }, [videos, stats.videoClicks]);

  const tagSummary = useMemo(() => {
    const videoCountByTag: Record<string, number> = {};
    videos.forEach(v => {
      (v.tags || []).forEach(t => {
        videoCountByTag[t] = (videoCountByTag[t] || 0) + 1;
      });
    });

    const allTags = new Set([
      ...Object.keys(videoCountByTag),
      ...Object.keys(stats.tagClicks || {})
    ]);

    return Array.from(allTags)
      .map(tag => ({
        tag,
        videoCount: videoCountByTag[tag] || 0,
        clicks: stats.tagClicks?.[tag] || 0
      }))
      .sort((a, b) => b.clicks - a.clicks || b.videoCount - a.videoCount);
  }, [videos, stats.tagClicks]);

  const handleRefreshStatsClick = async () => {
    setRefreshingStats(true);
    await onRefreshStats();
    setRefreshingStats(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-pink-50 rounded-full text-bili-pink">
              <KeyRound className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            管理员认证
          </h2>
          <p className="text-center text-gray-500 text-sm mb-6">
            请输入管理员密钥 (UUID) 以管理视频数据与查看访问统计
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={uuidInput}
                onChange={e => setUuidInput(e.target.value)}
                placeholder="在此粘贴 UUID..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bili-pink transition-all text-sm font-mono"
              />
              {authError && (
                <p className="text-red-500 text-xs mt-2 pl-1">
                  密钥无效，请重试。
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-bili-pink hover:bg-pink-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-pink-200 text-sm cursor-pointer"
            >
              进入管理后台
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">管理控制台</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              当前共收录 <span className="font-mono font-bold text-gray-800">{videos.length}</span> 条视频
            </p>
          </div>

          {/* Switch Tabs: 视频管理 | 数据统计 */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              视频管理 ({videos.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-white text-bili-pink shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>数据统计</span>
            </button>
          </div>
        </div>

        {activeTab === 'videos' ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCloudSync}
              disabled={syncStatus.loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-bili-blue to-cyan-500 text-white rounded-xl hover:shadow-md transition-all text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              {syncStatus.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              <span>同步到云端 KV</span>
            </button>

            <button
              onClick={handleAutoTagAllVideos}
              className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 text-bili-pink border border-pink-100 rounded-xl hover:bg-pink-100 transition-colors text-xs font-bold cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>智能识别出演者</span>
            </button>

            <button
              onClick={() => setConfirmResetModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-xs font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置默认</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-xs font-medium cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer text-xs font-medium">
              <Upload className="w-3.5 h-3.5" />
              <span>导入 JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <button
            onClick={handleRefreshStatsClick}
            disabled={refreshingStats}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingStats ? 'animate-spin text-bili-pink' : ''}`} />
            <span>刷新统计数据</span>
          </button>
        )}
      </div>

      {/* Reset Confirm Banner */}
      {confirmResetModal && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-amber-800">
            <span className="font-bold">确认重置数据？</span> 这将使用内置的 {INITIAL_VIDEOS.length} 条初始数据覆盖当前本地修改。
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer"
            >
              确认覆盖
            </button>
            <button
              onClick={() => setConfirmResetModal(false)}
              className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-lg text-xs hover:bg-gray-50 cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Status Notification */}
      {syncStatus.msg && (
        <div
          className={`mb-6 p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            syncStatus.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-600'
              : syncStatus.type === 'success'
              ? 'bg-green-50 border-green-100 text-green-600'
              : 'bg-blue-50 border-blue-100 text-blue-600'
          }`}
        >
          <span>{syncStatus.msg}</span>
          <button
            onClick={() => setSyncStatus({ ...syncStatus, msg: '' })}
            className="text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==========================================
          TAB 1: VIDEO MANAGEMENT
         ========================================== */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Add / Edit Form (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  {editingId ? (
                    <Edit2 className="w-4 h-4 text-bili-blue" />
                  ) : (
                    <Plus className="w-4 h-4 text-bili-pink" />
                  )}
                  <span>{editingId ? '编辑视频条目' : '添加新视频'}</span>
                </h3>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
                  >
                    取消编辑
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    视频标题
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="输入视频标题..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bili-pink/20 focus:border-bili-pink text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Bilibili 链接
                  </label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://www.bilibili.com/video/BV..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-bili-pink/20 focus:border-bili-pink text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      一级主分类
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as CategoryType)}
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-bili-pink text-xs bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      发布日期
                    </label>
                    <input
                      type="date"
                      required
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-bili-pink text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Second-level Subcategory */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-500">
                      二级子分类
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomSubCat(!isCustomSubCat);
                        setSubCategory('');
                      }}
                      className="text-[11px] text-bili-blue hover:underline cursor-pointer"
                    >
                      {isCustomSubCat ? '选择预设' : '自定义输入'}
                    </button>
                  </div>

                  {isCustomSubCat ? (
                    <input
                      type="text"
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      placeholder="输入自定义子分类..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-bili-pink text-xs"
                    />
                  ) : (
                    <select
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-bili-pink text-xs bg-white"
                    >
                      {DEFAULT_SUB_CATEGORIES[category]?.map(sub => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Third-level Tags Selector */}
                <div className="pt-1 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-500">
                      三级标签 (出演声优 / 舞台剧演员)
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoInferFormTags}
                      className="inline-flex items-center gap-1 text-[11px] text-bili-pink hover:underline font-medium cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      从标题自动提取
                    </button>
                  </div>

                  {/* Selected Tags */}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-lg bg-pink-50/60 border border-pink-100">
                      {selectedTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bili-pink text-white text-[11px] font-medium"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => toggleTagInForm(tag)}
                            className="hover:text-pink-200 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Preset Tag Groups */}
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                    {DEFAULT_TAG_GROUPS.map(group => (
                      <div key={group.group}>
                        <div className="text-[10px] font-bold text-gray-400 mb-1">
                          {group.group}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.tags.map(tag => {
                            const active = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTagInForm(tag)}
                                className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                                  active
                                    ? 'bg-gray-900 text-white font-medium'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Tag */}
                  <div className="flex gap-1.5 mt-2">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={e => setCustomTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomTagInForm();
                        }
                      }}
                      placeholder="添加自定义标签..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-bili-pink"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTagInForm}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium cursor-pointer"
                    >
                      添加
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs shadow-sm cursor-pointer ${
                    editingId
                      ? 'bg-bili-blue hover:bg-sky-600'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingId ? '更新视频条目' : '添加到列表'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Filterable Paginated Table (8 cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              {/* Filter Bar */}
              <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/40">
                <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="搜索标题、子分类或出演者标签..."
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-bili-pink"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <select
                      value={filterCat}
                      onChange={e => {
                        setFilterCat(e.target.value);
                        setFilterSubCat('ALL');
                      }}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                    >
                      <option value="ALL">全部分区</option>
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterSubCat}
                      onChange={e => setFilterSubCat(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                    >
                      <option value="ALL">全部子分类</option>
                      {availableSubCats.map(sc => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterTag}
                      onChange={e => setFilterTag(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                    >
                      <option value="ALL">全部三级标签</option>
                      {availableTags.map(t => (
                        <option key={t} value={t}>
                          #{t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Batch Action Bar */}
                {selectedIds.size > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-pink-50/80 border border-pink-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-bili-pink">
                      <span>已选 {selectedIds.size} 项</span>
                      <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-gray-500 hover:text-gray-800 font-normal underline cursor-pointer"
                      >
                        取消全选
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={batchTagToAdd}
                          onChange={e => setBatchTagToAdd(e.target.value)}
                          placeholder="批量打标签 (如: 青山吉能)"
                          className="px-2 py-1 rounded border border-pink-200 bg-white text-xs w-36 focus:outline-none"
                        />
                        <button
                          onClick={handleBatchAddTag}
                          className="px-2.5 py-1 bg-bili-pink text-white rounded font-medium hover:bg-pink-600 cursor-pointer"
                        >
                          +标签
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={batchSubCat}
                          onChange={e => setBatchSubCat(e.target.value)}
                          placeholder="批量改子分类"
                          className="px-2 py-1 rounded border border-pink-200 bg-white text-xs w-28 focus:outline-none"
                        />
                        <button
                          onClick={handleBatchSubCategory}
                          className="px-2.5 py-1 bg-gray-800 text-white rounded font-medium hover:bg-gray-700 cursor-pointer"
                        >
                          改子分类
                        </button>
                      </div>

                      <button
                        onClick={handleBatchDelete}
                        className="px-2.5 py-1 bg-red-500 text-white rounded font-medium hover:bg-red-600 cursor-pointer"
                      >
                        批量删除
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Fixed-Height Table Container */}
              <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 shadow-xs">
                    <tr className="text-[11px] text-gray-500 uppercase">
                      <th className="py-2.5 px-3 w-8">
                        <button
                          type="button"
                          onClick={toggleSelectCurrentPage}
                          className="text-gray-400 hover:text-gray-700 flex items-center cursor-pointer"
                          title="全选本页"
                        >
                          {paginatedVideos.length > 0 &&
                          paginatedVideos.every(v => selectedIds.has(v.id)) ? (
                            <CheckSquare className="w-4 h-4 text-bili-pink" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-2.5 px-3 font-semibold">视频标题</th>
                      <th className="py-2.5 px-3 font-semibold w-28">分类 / 子分类</th>
                      <th className="py-2.5 px-3 font-semibold w-44">三级标签</th>
                      <th className="py-2.5 px-3 font-semibold w-24">日期</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {paginatedVideos.map(video => {
                      const catConfig = CATEGORIES.find(c => c.id === video.category);
                      const isEditing = video.id === editingId;
                      const isSelected = selectedIds.has(video.id);
                      return (
                        <tr
                          key={video.id}
                          className={`transition-colors ${
                            isEditing
                              ? 'bg-blue-50/70'
                              : isSelected
                              ? 'bg-pink-50/40'
                              : 'hover:bg-gray-50/70'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => toggleSelectRow(video.id)}
                              className="text-gray-400 hover:text-gray-700 flex items-center cursor-pointer"
                            >
                              {isSelected ? (
                                <Check className="w-4 h-4 text-bili-pink" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-gray-900 max-w-xs">
                            <div className="line-clamp-1" title={video.title}>
                              {video.title}
                            </div>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-gray-400 hover:text-bili-blue font-mono truncate block max-w-[240px]"
                            >
                              {video.bvid || video.url}
                            </a>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
                              style={{ backgroundColor: catConfig?.color }}
                            />
                            <span className="text-gray-700 font-medium">
                              {catConfig?.label}
                            </span>
                            {video.subCategory && (
                              <span className="ml-1 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {video.subCategory}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(video.tags || []).map(tag => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                              {(!video.tags || video.tags.length === 0) && (
                                <span className="text-[10px] text-gray-300">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                            {video.addedAt}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditClick(video)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isEditing
                                    ? 'text-bili-blue bg-blue-100'
                                    : 'text-gray-400 hover:text-bili-blue hover:bg-blue-50'
                                }`}
                                title="编辑"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(video.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedVideos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                          没有匹配的记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination inside Table Card */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
                <div>
                  共筛选出 <span className="font-mono font-bold text-gray-800">{filteredVideos.length}</span> 条记录 · 每页 {ADMIN_PAGE_SIZE} 条
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono px-2">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ANALYTICS & STATISTICS (Hidden in Admin)
         ========================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">全站累计访问 (PV)</p>
                <p className="text-2xl font-black text-gray-900 font-mono mt-1">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-pink-50 text-bili-pink">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">视频累计点击跳转</p>
                <p className="text-2xl font-black text-gray-900 font-mono mt-1">
                  {stats.totalClicks.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-sky-50 text-bili-blue">
                <MousePointerClick className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">各大分区累计访问</p>
                <p className="text-2xl font-black text-gray-900 font-mono mt-1">
                  {(Object.values(stats.categoryViews) as number[])
                    .reduce((acc, v) => acc + v, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Category Breakdown Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">
                六大分类访问与视频点击明细
              </h2>
              <div className="space-y-4">
                {categoryStatsList.map(cat => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-sm text-gray-800">
                          {cat.label}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400">
                          ({cat.itemCount} 条视频)
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-gray-600">
                          访问: <strong className="text-gray-900">{cat.views}</strong>
                        </span>
                        <span className="text-bili-pink">
                          点击: <strong>{cat.clicks}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-1.5 rounded-full bg-gray-200/70 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(cat.views > 0 ? 6 : 0, cat.viewRatio)}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200/70 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-bili-pink transition-all duration-500"
                          style={{
                            width: `${Math.max(cat.clicks > 0 ? 6 : 0, cat.clickRatio)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Top Clicked Videos & Performer Tag Stats */}
            <div className="lg:col-span-5 space-y-6">
              {/* Top Clicked Videos */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">
                  热门被点击视频排行
                </h2>
                {topClickedVideos.length > 0 ? (
                  <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
                    {topClickedVideos.map(({ video, clicks }, idx) => (
                      <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-5 h-5 rounded text-[11px] font-mono font-bold flex items-center justify-center flex-shrink-0 ${
                              idx === 0
                                ? 'bg-amber-400 text-gray-900'
                                : idx === 1
                                ? 'bg-gray-200 text-gray-700'
                                : idx === 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs text-gray-800 group-hover:text-bili-pink truncate">
                            {video.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs font-mono font-bold text-bili-pink">
                            {clicks} 次
                          </span>
                          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-bili-pink" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 py-8 text-center">
                    暂无视频点击记录，在前台点击任意视频卡片后将在此显示排行
                  </p>
                )}
              </div>

              {/* Performer Tag Click & Coverage */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">
                  出演者 / 三级标签统计
                </h2>
                <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
                  {tagSummary.map(item => (
                    <div
                      key={item.tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/80 text-xs"
                    >
                      <span className="font-medium text-gray-700">{item.tag}</span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {item.videoCount}条
                      </span>
                      {item.clicks > 0 && (
                        <span className="text-[10px] font-mono font-bold text-bili-pink bg-pink-50 px-1 rounded">
                          {item.clicks}点击
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
