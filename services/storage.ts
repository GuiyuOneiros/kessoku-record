import { VideoLink, SiteStats } from '../types';
import { INITIAL_VIDEOS } from '../constants';

const STORAGE_KEY = 'bili_navi_data_v3';
const STATS_STORAGE_KEY = 'bili_navi_stats_v1';
const API_URL = '/api/data';
const STATS_API_URL = '/api/stats';

const DEFAULT_STATS: SiteStats = {
  totalViews: 0,
  totalClicks: 0,
  categoryViews: {},
  categoryClicks: {},
  videoClicks: {},
  tagClicks: {},
  lastUpdated: new Date().toISOString()
};

const KEYWORD_SYNONYM_MAP: Record<string, string[]> = {
  '青山吉能': ['青山吉能', '青山', 'yoppi', '吉P', '吉p'],
  '铃代纱弓': ['铃代纱弓', '鈴代紗弓', '铃代', '纱弓', '紗弓', 'sayumi'],
  '水野朔': ['水野朔', '水野', 'saku'],
  '长谷川育美': ['长谷川育美', '長谷川育美', '长谷川', '育美', '193', '长谷美', 'ikumi'],
  '守乃まも': ['守乃まも', '守乃真步', '守乃守', 'mamo'],
  '大竹美希': ['大竹美希'],
  '小山内花凛': ['小山内花凛', '小山内花凜'],
  '大森未来衣': ['大森未来衣'],
  '河内美里': ['河内美里'],
  '月川玲': ['月川玲'],
  '冈菜菜美': ['冈菜菜美', '岡菜々美'],
  '津久井有咲': ['津久井有咲'],
  '内田真礼': ['内田真礼', '内田真禮', '内桑', '真扎'],
  '千本木彩花': ['千本木彩花', '千本木'],
  '小岩井小鸟': ['小岩井小鸟', '小岩井', 'PA桑', 'pa桑', 'PA小姐'],
  '间岛淳司': ['间岛淳司'],
  '音羽-otoha-': ['音羽-otoha-', 'otoha', '音羽'],
  '木谷龙也': ['木谷龙也', 'キタニタツヤ'],
  '滨路晶': ['滨路晶', 'はまじあき', 'hamaji']
};

export const inferTagsFromVideo = (video: Partial<VideoLink>): string[] => {
  const existing = Array.isArray(video.tags) ? [...video.tags] : [];
  const haystack = `${video.title || ''} ${video.subCategory || ''}`.toLowerCase();
  const inferred = new Set<string>(existing);

  for (const [canonicalTag, keywords] of Object.entries(KEYWORD_SYNONYM_MAP)) {
    for (const kw of keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        inferred.add(canonicalTag);
        break;
      }
    }
  }
  return Array.from(inferred);
};

export const normalizeVideoList = (list: VideoLink[]): VideoLink[] => {
  return list.map(v => {
    const tags = Array.isArray(v.tags) && v.tags.length > 0 ? v.tags : inferTagsFromVideo(v);
    let addedAt = typeof v.addedAt === 'string' && v.addedAt.trim() ? v.addedAt.trim() : '';
    if (!addedAt) {
      const ts = typeof v.dateAdded === 'number' ? v.dateAdded : Number(v.id);
      if (!isNaN(ts) && ts > 946684800000) {
        addedAt = new Date(ts).toISOString().split('T')[0];
      } else {
        addedAt = '2024-01-01';
      }
    }
    return {
      ...v,
      id: String(v.id),
      title: v.title || '未命名视频',
      url: v.url || '',
      addedAt,
      tags
    };
  });
};

// Local Storage Fallback for Videos
export const getLocalVideos = (): VideoLink[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const normalized = normalizeVideoList(INITIAL_VIDEOS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return normalizeVideoList(INITIAL_VIDEOS);
    }
    return normalizeVideoList(parsed);
  } catch (e) {
    console.error('Failed to load local videos', e);
    return normalizeVideoList(INITIAL_VIDEOS);
  }
};

export const saveLocalVideos = (videos: VideoLink[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  } catch (e) {
    console.error('Failed to save local videos', e);
  }
};

// Remote API Operations for Videos
export const fetchVideos = async (): Promise<VideoLink[]> => {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = normalizeVideoList(data);
        saveLocalVideos(normalized);
        return normalized;
      }
    }
  } catch {
    console.warn('API fetch failed or running locally, falling back to local storage.');
  }
  return getLocalVideos();
};

export const saveVideosToCloud = async (videos: VideoLink[], adminKey: string): Promise<{ success: boolean; message: string }> => {
  saveLocalVideos(videos);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminKey}`,
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify(videos)
    });

    if (response.status === 401) {
      return { success: false, message: '密钥错误 (Unauthorized)' };
    }

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, message: `云端同步失败 (${response.status}): ${errText}。已保存到本地缓存。` };
    }

    return { success: true, message: '保存成功 (已同步至云端 KV)' };
  } catch {
    return {
      success: true,
      message: '已保存到本地 (未检测到云端函数环境)'
    };
  }
};

export const extractBvid = (url: string): string | undefined => {
  const match = url.match(/(BV[a-zA-Z0-9]{10})/);
  return match ? match[1] : undefined;
};

// ==========================================
// Analytics & Statistics Operations
// ==========================================

export const getLocalStats = (): SiteStats => {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(DEFAULT_STATS));
      return { ...DEFAULT_STATS };
    }
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
};

export const saveLocalStats = (stats: SiteStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage quota errors
  }
};

export const fetchSiteStats = async (): Promise<SiteStats> => {
  const local = getLocalStats();
  try {
    const res = await fetch(STATS_API_URL);
    if (res.ok) {
      const remote = await res.json();
      if (remote && typeof remote.totalViews === 'number') {
        const merged: SiteStats = {
          totalViews: Math.max(local.totalViews, remote.totalViews || 0),
          totalClicks: Math.max(local.totalClicks, remote.totalClicks || 0),
          categoryViews: { ...local.categoryViews, ...(remote.categoryViews || {}) },
          categoryClicks: { ...local.categoryClicks, ...(remote.categoryClicks || {}) },
          videoClicks: { ...local.videoClicks, ...(remote.videoClicks || {}) },
          tagClicks: { ...local.tagClicks, ...(remote.tagClicks || {}) },
          lastUpdated: remote.lastUpdated || local.lastUpdated
        };
        saveLocalStats(merged);
        return merged;
      }
    }
  } catch {
    // Fallback to local stats silently
  }
  return local;
};

export const recordAnalyticsEvent = async (payload: {
  type: 'site_view' | 'category_view' | 'video_click';
  category?: string;
  videoId?: string;
  tags?: string[];
}): Promise<SiteStats> => {
  const stats = getLocalStats();

  if (payload.type === 'site_view') {
    stats.totalViews = (stats.totalViews || 0) + 1;
  } else if (payload.type === 'category_view' && payload.category) {
    stats.categoryViews[payload.category] = (stats.categoryViews[payload.category] || 0) + 1;
  } else if (payload.type === 'video_click') {
    stats.totalClicks = (stats.totalClicks || 0) + 1;
    if (payload.category) {
      stats.categoryClicks[payload.category] = (stats.categoryClicks[payload.category] || 0) + 1;
    }
    if (payload.videoId) {
      stats.videoClicks[payload.videoId] = (stats.videoClicks[payload.videoId] || 0) + 1;
    }
    if (Array.isArray(payload.tags)) {
      payload.tags.forEach(t => {
        stats.tagClicks[t] = (stats.tagClicks[t] || 0) + 1;
      });
    }
  }

  stats.lastUpdated = new Date().toISOString();
  saveLocalStats(stats);

  try {
    const res = await fetch(STATS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const remote = await res.json();
      if (remote && typeof remote.totalViews === 'number') {
        saveLocalStats(remote);
        return remote;
      }
    }
  } catch {
    // Ignore network errors in static/offline preview
  }

  return stats;
};
