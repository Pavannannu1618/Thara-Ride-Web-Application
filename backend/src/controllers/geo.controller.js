const redis = require('../config/redis');

const googleFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`Google Maps API ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

// ── GET /api/v1/geo/search?q=&lat=&lng=&bounded= ─────────────────────────────
exports.search = async (req, res, next) => {
  try {
    const { q, lat, lng, bounded = '0' } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API key not configured' });

    const cacheKey = `geo:search:${q}:${lat}:${lng}:${bounded}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* miss */ }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`
      + `?input=${encodeURIComponent(q)}`
      + `&key=${apiKey}`
      + `&components=country:in`
      + `&language=en`;

    if (lat && lng) {
      const radius = bounded === '1' ? 30000 : 100000;
      url += `&location=${lat},${lng}&radius=${radius}`;
    }

    const data = await googleFetch(url);

    if (data.status === 'ZERO_RESULTS') return res.json([]);

    if (data.status !== 'OK') {
      console.error('[Geo Search] Google error:', data.status, data.error_message);
      return res.json([]);
    }

    const results = (data.predictions || []).map(p => ({
      place_id:     p.place_id,
      display_name: p.description,
      main_text:    p.structured_formatting?.main_text    || p.description,
      secondary_text: p.structured_formatting?.secondary_text || '',
      lat: null,
      lon: null,
    }));

    try { await redis.setex(cacheKey, 300, JSON.stringify(results)); } catch { /* non-fatal */ }

    res.json(results);
  } catch (err) {
    console.error('[Geo Search] Error:', err.message);
    if (err.status >= 400) return res.json([]);
    next(err);
  }
};

// ── GET /api/v1/geo/reverse?lat=&lng= ────────────────────────────────────────
exports.reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API key not configured' });

    const cacheKey = `geo:rev:${(+lat).toFixed(4)}:${(+lng).toFixed(4)}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* miss */ }

    const url = `https://maps.googleapis.com/maps/api/geocode/json`
      + `?latlng=${lat},${lng}`
      + `&key=${apiKey}`
      + `&language=en`
      + `&result_type=street_address|route|locality|administrative_area_level_2`;

    const data = await googleFetch(url);

    if (data.status === 'ZERO_RESULTS') return res.json(null);

    if (data.status !== 'OK') {
      console.error('[Geo Reverse] Google error:', data.status);
      return res.json(null);
    }

    const result = data.results[0];
    if (!result) return res.json(null);

    const comps = {};
    result.address_components.forEach(c => {
      if (c.types.includes('locality'))                       comps.city    = c.long_name;
      if (c.types.includes('administrative_area_level_1'))    comps.state   = c.long_name;
      if (c.types.includes('administrative_area_level_2'))    comps.district = c.long_name;
      if (c.types.includes('country'))                        comps.country = c.long_name;
      if (c.types.includes('postal_code'))                    comps.postcode = c.long_name;
    });

    const out = {
      place_id:     result.place_id,
      display_name: result.formatted_address,
      lat:          result.geometry.location.lat,
      lon:          result.geometry.location.lng,
      address:      comps,
    };

    try { await redis.setex(cacheKey, 600, JSON.stringify(out)); } catch { /* non-fatal */ }

    res.json(out);
  } catch (err) {
    console.error('[Geo Reverse] Error:', err.message);
    if (err.status >= 400) return res.json(null);
    next(err);
  }
};

// ── GET /api/v1/geo/details?place_id= ────────────────────────────────────────
exports.details = async (req, res, next) => {
  try {
    const { place_id } = req.query;
    if (!place_id) return res.status(400).json({ error: 'place_id is required' });

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API key not configured' });

    const cacheKey = `geo:details:${place_id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* miss */ }

    const url = `https://maps.googleapis.com/maps/api/place/details/json`
      + `?place_id=${place_id}`
      + `&key=${apiKey}`
      + `&fields=place_id,formatted_address,geometry,name,address_components`
      + `&language=en`;

    const data = await googleFetch(url);

    if (data.status !== 'OK') {
      console.error('[Geo Details] Google error:', data.status);
      return res.status(400).json({ error: `Google Maps error: ${data.status}` });
    }

    const result = data.result;
    const comps  = {};

    result.address_components.forEach(c => {
      if (c.types.includes('locality'))                    comps.city    = c.long_name;
      if (c.types.includes('administrative_area_level_1')) comps.state   = c.long_name;
      if (c.types.includes('country'))                     comps.country = c.long_name;
      if (c.types.includes('postal_code'))                 comps.postcode = c.long_name;
    });

    const out = {
      place_id:     result.place_id,
      display_name: result.formatted_address,
      name:         result.name,
      lat:          result.geometry.location.lat,
      lon:          result.geometry.location.lng,
      address:      comps,
    };

    try { await redis.setex(cacheKey, 1800, JSON.stringify(out)); } catch { /* non-fatal */ }

    res.json(out);
  } catch (err) {
    console.error('[Geo Details] Error:', err.message);
    if (err.status >= 400) return res.json(null);
    next(err);
  }
};