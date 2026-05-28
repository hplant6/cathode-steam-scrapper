import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5174;

app.use('/api/', rateLimit({
  windowMs: 60_000, // 1 minute
  max: 30,          // 30 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests, try again in a minute' },
}));
const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    steamgriddb: Boolean(STEAMGRIDDB_API_KEY),
  });
});

// SteamGridDB: search by name, then fetch grids (vertical 600x900 covers) + logos.
app.get('/api/search/steamgrid', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing q' });
  const apiKey = req.headers['x-sgdb-key'] || STEAMGRIDDB_API_KEY;
  if (!apiKey) {
    return res.status(401).json({ error: 'No SteamGridDB API key — add one in Settings.' });
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  try {
    const searchUrl = `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(q)}`;
    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) {
      return res.status(searchRes.status).json({ error: `steamgriddb search ${searchRes.status}` });
    }
    const searchJson = await searchRes.json();
    const game = searchJson?.data?.[0];
    if (!game) return res.json({ game: null, images: [], logos: [] });

    // Fetch grids and logos in parallel.
    const [gridRes, logoRes] = await Promise.all([
      fetch(`https://www.steamgriddb.com/api/v2/grids/game/${game.id}?dimensions=600x900&types=static`, { headers }),
      fetch(`https://www.steamgriddb.com/api/v2/logos/game/${game.id}?types=static`, { headers }),
    ]);

    const gridJson = gridRes.ok ? await gridRes.json() : { data: [] };
    const logoJson = logoRes.ok ? await logoRes.json() : { data: [] };

    const images = (gridJson?.data || []).map((g) => ({
      id: `sgdb-${g.id}`,
      source: 'steamgriddb',
      thumb: g.thumb || g.url,
      full: g.url,
      width: g.width,
      height: g.height,
    }));

    const logos = (logoJson?.data || []).map((g) => ({
      id: `sgdb-logo-${g.id}`,
      source: 'steamgriddb',
      thumb: g.thumb || g.url,
      full: g.url,
    }));

    res.json({ game: { id: game.id, name: game.name }, images, logos });
  } catch (err) {
    console.error('steamgriddb error', err);
    res.status(502).json({ error: 'steamgriddb fetch failed' });
  }
});

// GOG: catalog.gog.com search returns full product data including vertical cover art.
app.get('/api/search/gog', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  try {
    const url = `https://catalog.gog.com/v1/catalog?limit=12&query=${encodeURIComponent(q)}&order=desc:score`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (boxart-generator)',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return res.status(r.status).json({ error: `gog ${r.status}` });
    const data = await r.json();
    const products = (data?.products || []);
    const images = products.map((p) => ({
      id: `gog-${p.id}`,
      source: 'gog',
      title: p.title,
      thumb: p.coverVertical || p.coverHorizontal,
      full: p.coverVertical || p.coverHorizontal,
    })).filter((p) => p.full);

    // Screenshots come from the top result only — they represent the same game.
    const topProduct = products[0];
    const screenshots = (topProduct?.screenshots || [])
      .map((s, i) => {
        // GOG screenshots may be plain URL strings or objects with a url/formatter_template_url.
        const raw = typeof s === 'string' ? s : (s.formatter_template_url || s.url || '');
        // Replace GOG's formatter placeholder with a reasonable size.
        const url = raw.replace('{formatter}', 'product_card_v2_mobile_slider_639');
        if (!url || !/^https?:\/\//.test(url)) return null;
        return { id: `gog-ss-${i}`, source: 'gog', thumb: url, full: url };
      })
      .filter(Boolean);

    res.json({ images, screenshots });
  } catch (err) {
    console.error('gog error', err);
    res.status(502).json({ error: 'gog fetch failed', detail: String(err) });
  }
});

// Image proxy to dodge CORS when the canvas loads remote images.
app.get('/api/proxy', async (req, res) => {
  const url = (req.query.url || '').toString();
  if (!/^https?:\/\//.test(url)) return res.status(400).send('bad url');
  const allowed = /(^https:\/\/(cdn2?\.)?steamgriddb\.com\/)|(^https:\/\/images(-\d+)?\.gog(-statics)?\.com\/)|(^https:\/\/images\.gog-statics\.com\/)|(^https?:\/\/[a-z0-9.-]*\.steamstatic\.com\/)|(^https?:\/\/[a-z0-9.-]*\.akamai\.steamstatic\.com\/)|(^https?:\/\/steamcdn-a\.akamaihd\.net\/)/;
  if (!allowed.test(url)) return res.status(403).send('host not allowed');

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).send(`upstream ${r.status}`);
    res.setHeader('Content-Type', r.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const { Readable } = await import('stream');
    Readable.fromWeb(r.body).pipe(res);
  } catch (err) {
    console.error('proxy error', err);
    res.status(502).send('proxy failed');
  }
});

// Steam Store: search for appid, then fetch screenshots and video trailers.
app.get('/api/search/steam', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  try {
    const searchRes = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)' } }
    );
    if (!searchRes.ok) {
      console.error(`[steam] storesearch HTTP ${searchRes.status}`);
      return res.status(searchRes.status).json({ error: `steam search ${searchRes.status}` });
    }
    const searchJson = await searchRes.json();
    const steamGame = searchJson?.items?.[0];
    console.log(`[steam] storesearch "${q}" → ${steamGame ? `"${steamGame.name}" (${steamGame.id})` : 'no results'}`);
    if (!steamGame) return res.json({ game: null, screenshots: [], videos: [] });

    const detailsRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamGame.id}&l=english`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)' } }
    );
    if (!detailsRes.ok) {
      console.error(`[steam] appdetails HTTP ${detailsRes.status}`);
      return res.status(detailsRes.status).json({ error: `steam appdetails ${detailsRes.status}` });
    }
    const detailsJson = await detailsRes.json();
    const data = detailsJson?.[steamGame.id]?.data;
    if (!data) {
      console.warn(`[steam] appdetails returned no data for ${steamGame.id} (success=${detailsJson?.[steamGame.id]?.success})`);
      return res.json({ game: { id: steamGame.id, name: steamGame.name }, screenshots: [], videos: [] });
    }

    const screenshots = (data.screenshots || []).map((s) => ({
      id: `steam-ss-${s.id}`,
      source: 'steam',
      thumb: s.path_thumbnail,
      full: s.path_full,
    }));

    const videos = (data.movies || []).map((m) => {
      // Legacy format: direct mp4/webm (older games)
      const mp4 = (m.mp4?.['480'] || m.mp4?.max || '').replace(/^http:\/\//, 'https://');
      const webm = (m.webm?.['480'] || m.webm?.max || '').replace(/^http:\/\//, 'https://');
      // Current Steam format: HLS and DASH streams
      const hls = m.hls_h264 || m.hls_av1 || '';
      const dash = m.dash_h264 || m.dash_av1 || '';

      const full = mp4 || webm || hls || dash;
      const ext = mp4 ? 'mp4' : webm ? 'webm' : hls ? 'm3u8' : 'mpd';
      const streaming = !mp4 && !webm;

      return {
        id: `steam-vid-${m.id}`,
        source: 'steam',
        title: m.name,
        thumb: m.thumbnail,
        full,
        ext,
        streaming,
      };
    }).filter((v) => v.full);

    res.json({ game: { id: steamGame.id, name: steamGame.name }, screenshots, videos });
  } catch (err) {
    console.error('[steam] fetch failed', err);
    res.status(502).json({ error: 'steam fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  if (!STEAMGRIDDB_API_KEY) {
    console.warn('[server] STEAMGRIDDB_API_KEY is not set — copy .env.example to .env and add your key');
  }
});
