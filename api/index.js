import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());

app.use('/api/', rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests, try again in a minute' },
}));

const STEAMGRIDDB_API_KEY = process.env.STEAMGRIDDB_API_KEY;

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, steamgriddb: Boolean(STEAMGRIDDB_API_KEY) });
});

app.get('/api/autocomplete', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json([]);
  try {
    const r = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)' } }
    );
    if (!r.ok) return res.json([]);
    const json = await r.json();
    res.json((json?.items || []).slice(0, 8).map(g => ({ id: g.id, name: g.name })));
  } catch {
    res.json([]);
  }
});

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

app.get('/api/search/gog', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing q' });

  try {
    const url = `https://catalog.gog.com/v1/catalog?limit=12&query=${encodeURIComponent(q)}&order=desc:score`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)', Accept: 'application/json' },
    });
    if (!r.ok) return res.status(r.status).json({ error: `gog ${r.status}` });
    const data = await r.json();
    const products = data?.products || [];

    const images = products.map((p) => ({
      id: `gog-${p.id}`,
      source: 'gog',
      title: p.title,
      thumb: p.coverVertical || p.coverHorizontal,
      full: p.coverVertical || p.coverHorizontal,
    })).filter((p) => p.full);

    const topProduct = products[0];
    const screenshots = (topProduct?.screenshots || [])
      .map((s, i) => {
        const raw = typeof s === 'string' ? s : (s.formatter_template_url || s.url || '');
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

app.get('/api/search/steam', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'missing q' });
  const knownAppId = (req.query.appid || '').toString().trim();

  try {
    let steamGame;
    if (knownAppId) {
      steamGame = { id: knownAppId, name: q };
    } else {
      const searchRes = await fetch(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)' } }
      );
      if (!searchRes.ok) {
        return res.status(searchRes.status).json({ error: `steam search ${searchRes.status}` });
      }
      const searchJson = await searchRes.json();
      steamGame = searchJson?.items?.[0];
    }
    if (!steamGame) return res.json({ game: null, screenshots: [], videos: [] });

    const detailsRes = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamGame.id}&l=english`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (boxart-generator)' } }
    );
    if (!detailsRes.ok) {
      return res.status(detailsRes.status).json({ error: `steam appdetails ${detailsRes.status}` });
    }
    const detailsJson = await detailsRes.json();
    const data = detailsJson?.[steamGame.id]?.data;
    if (!data) {
      return res.json({ game: { id: steamGame.id, name: steamGame.name }, screenshots: [], videos: [] });
    }

    const screenshots = (data.screenshots || []).map((s) => ({
      id: `steam-ss-${s.id}`,
      source: 'steam',
      thumb: s.path_thumbnail,
      full: s.path_full,
    }));

    const videos = (data.movies || []).map((m) => {
      const mp4  = (m.mp4?.['480']  || m.mp4?.max  || '').replace(/^http:\/\//, 'https://');
      const webm = (m.webm?.['480'] || m.webm?.max || '').replace(/^http:\/\//, 'https://');
      const hls  = m.hls_h264  || m.hls_av1  || '';
      const dash = m.dash_h264 || m.dash_av1 || '';
      const full = mp4 || webm || hls || dash;
      const ext  = mp4 ? 'mp4' : webm ? 'webm' : hls ? 'm3u8' : 'mpd';
      return { id: `steam-vid-${m.id}`, source: 'steam', title: m.name, thumb: m.thumbnail, full, ext, streaming: !mp4 && !webm };
    }).filter((v) => v.full);

    const esrbRating  = data.ratings?.esrb?.rating?.toLowerCase() ?? null;
    const releaseYear = parseInt(data.release_date?.date?.match(/\d{4}/)?.[0]) || null;

    res.json({ game: { id: steamGame.id, name: steamGame.name }, screenshots, videos, esrbRating, releaseYear });
  } catch (err) {
    console.error('[steam] fetch failed', err);
    res.status(502).json({ error: 'steam fetch failed' });
  }
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'hplant6/cathode-steam-scrapper';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

app.post('/api/report-bug', async (req, res) => {
  if (!GITHUB_TOKEN) {
    return res.status(503).json({ error: 'Bug reporting is not configured on this server.' });
  }
  const description = (req.body?.description || '').toString().trim();
  if (!description) return res.status(400).json({ error: 'description is required' });
  if (description.length > 4000) return res.status(400).json({ error: 'description too long' });

  if (RECAPTCHA_SECRET) {
    const captchaToken = (req.body?.captchaToken || '').toString();
    if (!captchaToken) return res.status(400).json({ error: 'CAPTCHA required.' });
    const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET, response: captchaToken }),
    });
    const verifyJson = await verify.json();
    if (!verifyJson.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }
  }

  const userAgent = req.headers['user-agent'] || 'unknown';
  const body = `${description}\n\n---\n**User-Agent:** \`${userAgent}\``;
  const firstLine = description.split('\n')[0].slice(0, 60);
  const title = firstLine.length < description.length ? `${firstLine}…` : firstLine;

  try {
    const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body }),
    });
    if (!r.ok) {
      const msg = await r.text();
      console.error('[report-bug] github error', r.status, msg);
      return res.status(502).json({ error: 'Failed to create issue.' });
    }
    const issue = await r.json();
    res.json({ url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error('[report-bug] fetch failed', err);
    res.status(502).json({ error: 'Failed to create issue.' });
  }
});

export default app;
