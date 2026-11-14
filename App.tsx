import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { CategoryView } from './components/CategoryView';
import { AdminPanel } from './components/AdminPanel';
import {
  fetchVideos,
  fetchSiteStats,
  getLocalStats,
  recordAnalyticsEvent,
  normalizeVideoList
} from './services/storage';
import { VideoLink, CategoryType, SiteStats } from './types';
import { INITIAL_VIDEOS } from './constants';

export const App: React.FC = () => {
  const [videos, setVideos] = useState<VideoLink[]>(() => normalizeVideoList(INITIAL_VIDEOS));
  const [stats, setStats] = useState<SiteStats>(() => getLocalStats());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      const [videoData, remoteStats] = await Promise.all([
        fetchVideos(),
        fetchSiteStats()
      ]);
      if (!mounted) return;
      setVideos(videoData);
      setStats(remoteStats);
      setLoading(false);

      // Record site visit once per session
      const sessionKey = 'kessoku_visited_session';
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, '1');
        const updatedStats = await recordAnalyticsEvent({ type: 'site_view' });
        if (mounted) setStats(updatedStats);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryView = useCallback(async (category: CategoryType) => {
    const updated = await recordAnalyticsEvent({
      type: 'category_view',
      category
    });
    setStats(updated);
  }, []);

  const handleVideoClick = useCallback(async (video: VideoLink) => {
    const updated = await recordAnalyticsEvent({
      type: 'video_click',
      category: video.category,
      videoId: video.id,
      tags: video.tags
    });
    setStats(updated);
  }, []);

  const handleRefreshStats = useCallback(async () => {
    const fresh = await fetchSiteStats();
    setStats(fresh);
  }, []);

  const isSandboxed = window.location.protocol === 'blob:';
  const initialHashPath = window.location.hash
    ? window.location.hash.replace(/^#/, '') || '/'
    : '/';

  const content = (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans text-gray-900">
      <Navbar />
      <main className="flex-grow relative">
        {loading && (
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-100 overflow-hidden z-50">
            <div className="h-full bg-bili-pink animate-pulse w-1/3 mx-auto"></div>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={<HomeDashboard videos={videos} onVideoClick={handleVideoClick} />}
          />
          <Route
            path="/category/:type"
            element={
              <CategoryView
                videos={videos}
                onCategoryView={handleCategoryView}
                onVideoClick={handleVideoClick}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminPanel
                onDataChange={setVideos}
                stats={stats}
                onRefreshStats={handleRefreshStats}
              />
            }
          />
        </Routes>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} BOCCHI THE RECORD.
            <span className="hidden sm:inline mx-1">·</span>
            <br className="sm:hidden" />
            Designed for performance & simplicity.
          </p>
        </div>
      </footer>
    </div>
  );

  return isSandboxed ? (
    <MemoryRouter initialEntries={[initialHashPath]}>{content}</MemoryRouter>
  ) : (
    <HashRouter>{content}</HashRouter>
  );
};
