const fetch = require('node-fetch');  // npm i node-fetch@2
const redis  = require('../config/redis');

// Nominatim requires a descriptive User-Agent per their usage policy
const UA = 'TharaRide/1.0 (contact@thararide.com)';

// ── helpers ──────────────────────────────────────────────────────────────────

const nominatimFetch = async (url) => {
  const res = await fetch(url, {
    headers: {
      'User-Agent':      UA,
      'Accept-Language': 'en',
      'Referer':         'https://thararide.com',
    },
  });
  if (!res.ok) {
    const err = new Error(`Nominatim ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

// ── GET /api/v1/geo/search?q=...&lat=...&lng=...&city=...&bounded=0|1 ────────
exports.search = async (req, res, next) => {
  try {
    const { q, lat, lng, city, bounded = '0' } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });

    // Cache key — avoid hammering Nominatim for identical queries
    const cacheKey = `geo:search:${q}:${lat}:${lng}:${bounded}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* redis miss — continue */ }

    const params = new URLSearchParams({
      q:               city ? `${q}, ${city}` : q,
      format:          'json',
      addressdetails:  '1',
      limit:           '8',
      countrycodes:    'in',
      'accept-language': 'en',
    });

    if (lat && lng) {
      const deg = 0.25;
      params.set('viewbox', `${+lng - deg},${+lat - deg},${+lng + deg},${+lat + deg}`);
      params.set('bounded', bounded);
    }

    const data = await nominatimFetch(
      `https://nominatim.openstreetmap.org/search?${params}`
    );

    // Cache for 5 minutes — place names don't change
    try { await redis.setex(cacheKey, 300, JSON.stringify(data)); } catch { /* non-fatal */ }

    res.json(data);
  } catch (err) {
    // If Nominatim rate-limits us, return empty instead of crashing
    if (err.status === 429) return res.json([]);
    next(err);
  }
};

// ── GET /api/v1/geo/reverse?lat=...&lng=... ──────────────────────────────────
exports.reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const cacheKey = `geo:rev:${(+lat).toFixed(4)}:${(+lng).toFixed(4)}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* miss */ }

    const params = new URLSearchParams({ lat, lon: lng, format: 'json' });
    const data   = await nominatimFetch(
      `https://nominatim.openstreetmap.org/reverse?${params}`
    );

    // Cache reverse results for 10 minutes
    try { await redis.setex(cacheKey, 600, JSON.stringify(data)); } catch { /* non-fatal */ }

    res.json(data);
    }
    catch (err) {
    if (err.status === 429) return res.json(null);
    next(err);
  }
};