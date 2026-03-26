const redis  = require('../config/redis');

// ── helpers ──────────────────────────────────────────────────────────────────

const googleMapsFetch = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`Google Maps API ${res.status}`);
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

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Google Maps API key not configured' });

    // Cache key — avoid hammering Google Maps API for identical queries
    const cacheKey = `geo:search:${q}:${lat}:${lng}:${bounded}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));
    } catch { /* redis miss — continue */ }

    // Build Google Places API URL
    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&components=country:in`;

    // Add location bias for more accurate results
    if (lat && lng) {
      // Use location bias with a radius (in meters)
      const radius = bounded === '1' ? 50000 : 100000; // 50km for bounded, 100km for wider search
      url += `&location=${lat},${lng}&radius=${radius}&strictbounds=${bounded === '1' ? 'true' : 'false'}`;
    }

    const data = await googleMapsFetch(url);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(400).json({ error: `Google Maps API error: ${data.status}` });
    }

    // Transform Google Places response to match Nominatim format for frontend compatibility
    const transformedResults = (data.predictions || []).map(prediction => ({
      place_id: prediction.place_id,
      display_name: prediction.description,
      lat: null, // Will be fetched when needed
      lon: null, // Will be fetched when needed
      address: {
        city: city || null,
        state: null,
        country: 'India'
      },
      type: 'place',
      importance: 0.5
    }));

    // Cache for 5 minutes — place names don't change frequently
    try { await redis.setex(cacheKey, 300, JSON.stringify(transformedResults)); } catch { /* non-fatal */ }

    res.json(transformedResults);
  } catch (err) {
    console.error('Geo search error:', err);
    // If API error, return empty instead of crashing
    if (err.status >= 400) return res.json([]);
    next(err);
  }
};

// ── GET /api/v1/geo/reverse?lat=...&lng=... ──────────────────────────────────
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

    // Use Google Maps Geocoding API for reverse geocoding
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=street_address|route|locality|administrative_area_level_1|country`;

    const data = await googleMapsFetch(url);

    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Google Maps API error: ${data.status}` });
    }

    // Transform Google Geocoding response to match Nominatim format
    const result = data.results[0];
    if (!result) return res.json(null);

    // Extract address components
    const addressComponents = {};
    result.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) addressComponents.city = component.long_name;
      if (types.includes('administrative_area_level_1')) addressComponents.state = component.long_name;
      if (types.includes('country')) addressComponents.country = component.long_name;
      if (types.includes('postal_code')) addressComponents.postcode = component.long_name;
    });

    const transformedResult = {
      place_id: result.place_id,
      display_name: result.formatted_address,
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      address: addressComponents,
      type: 'reverse_geocode'
    };

    // Cache reverse results for 10 minutes
    try { await redis.setex(cacheKey, 600, JSON.stringify(transformedResult)); } catch { /* non-fatal */ }

    res.json(transformedResult);
  } catch (err) {
    console.error('Geo reverse error:', err);
    if (err.status >= 400) return res.json(null);
    next(err);
  }
};

// ── GET /api/v1/geo/details?place_id=... ──────────────────────────────────
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

    // Get place details from Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${apiKey}&fields=place_id,formatted_address,geometry,name,address_components`;

    const data = await googleMapsFetch(url);

    if (data.status !== 'OK') {
      return res.status(400).json({ error: `Google Maps API error: ${data.status}` });
    }

    const result = data.result;

    // Extract address components
    const addressComponents = {};
    result.address_components.forEach(component => {
      const types = component.types;
      if (types.includes('locality')) addressComponents.city = component.long_name;
      if (types.includes('administrative_area_level_1')) addressComponents.state = component.long_name;
      if (types.includes('country')) addressComponents.country = component.long_name;
      if (types.includes('postal_code')) addressComponents.postcode = component.long_name;
    });

    const transformedResult = {
      place_id: result.place_id,
      display_name: result.formatted_address,
      name: result.name,
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      address: addressComponents,
      type: 'place_details'
    };

    // Cache place details for 30 minutes
    try { await redis.setex(cacheKey, 1800, JSON.stringify(transformedResult)); } catch { /* non-fatal */ }

    res.json(transformedResult);
  } catch (err) {
    console.error('Geo details error:', err);
    if (err.status >= 400) return res.json(null);
    next(err);
  }
};