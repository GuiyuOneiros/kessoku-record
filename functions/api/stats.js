// This function runs on the server side (Edge)
// Handles GET (fetch analytics stats) and POST (increment site/category/video/tag counters or reset)
// Compatible with Cloudflare Pages Functions and EdgeOne Pages Functions

const DEFAULT_STATS = {
  totalSiteViews: 0,
  totalVideoClicks: 0,
  categoryViews: {},
  categoryClicks: {},
  videoClicks: {},
  tagClicks: {},
  lastUpdated: Date.now()
};

export async function onRequest(context) {
  const { request, env } = context;
  const KV = env.KESSOKU_KV;
  const ADMIN_SECRET = env.ADMIN_SECRET;

  if (!KV) {
    return new Response(JSON.stringify({ error: 'KV binding not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const STATS_KEY = 'site_stats_v1';

  try {
    if (request.method === 'GET') {
      const raw = await KV.get(STATS_KEY);
      const stats = raw ? JSON.parse(raw) : DEFAULT_STATS;
      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const raw = await KV.get(STATS_KEY);
      const stats = raw ? JSON.parse(raw) : { ...DEFAULT_STATS };

      // Ensure all sub-objects exist
      stats.categoryViews = stats.categoryViews || {};
      stats.categoryClicks = stats.categoryClicks || {};
      stats.videoClicks = stats.videoClicks || {};
      stats.tagClicks = stats.tagClicks || {};

      if (body.action === 'reset') {
        const authHeader = request.headers.get('Authorization');
        if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
          return new Response('Unauthorized', { status: 401 });
        }
        const resetData = { ...DEFAULT_STATS, lastUpdated: Date.now() };
        await KV.put(STATS_KEY, JSON.stringify(resetData));
        return new Response(JSON.stringify(resetData), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (body.type === 'site_view') {
        stats.totalSiteViews = (stats.totalSiteViews || 0) + 1;
      } else if (body.type === 'category_view' && body.category) {
        stats.categoryViews[body.category] = (stats.categoryViews[body.category] || 0) + 1;
      } else if (body.type === 'video_click' && body.videoId) {
        stats.totalVideoClicks = (stats.totalVideoClicks || 0) + 1;
        stats.videoClicks[body.videoId] = (stats.videoClicks[body.videoId] || 0) + 1;
        if (body.category) {
          stats.categoryClicks[body.category] = (stats.categoryClicks[body.category] || 0) + 1;
        }
        if (Array.isArray(body.tags)) {
          body.tags.forEach(tag => {
            if (tag) {
              stats.tagClicks[tag] = (stats.tagClicks[tag] || 0) + 1;
            }
          });
        }
      } else if (body.type === 'tag_click' && body.tag) {
        stats.tagClicks[body.tag] = (stats.tagClicks[body.tag] || 0) + 1;
      }

      stats.lastUpdated = Date.now();
      await KV.put(STATS_KEY, JSON.stringify(stats));

      return new Response(JSON.stringify(stats), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
