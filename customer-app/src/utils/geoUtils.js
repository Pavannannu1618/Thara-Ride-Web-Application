import { haversine, roadDistance, calcFares, formatDuration } from './fareUtils';
import api from '../services/api';   // your existing axios instance (has auth header)

// ─────────────────────────────────────────────────────────────────────────────
// All Nominatim calls go through your backend proxy — no CORS, no rate limits
// ─────────────────────────────────────────────────────────────────────────────

/** Reverse-geocode lat/lng → Nominatim JSON via backend */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await api.get('/geo/reverse', { params: { lat, lng } });
    return res.data || null;
  } catch { return null; }
};

/** Extract city from a Nominatim address object */
export const extractCity = (address = {}) =>
  address.city            ||
  address.town            ||
  address.county          ||
  address.state_district  ||
  '';

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY SEARCH
// ─────────────────────────────────────────────────────────────────────────────

const TYPO_MAP = {
  'hitech':         'hi-tech',
  'hitec':          'hitech',
  'jublee':         'jubilee',
  'jubili':         'jubilee',
  'madapur':        'madhapur',
  'begampet':       'begumpet',
  'begumpet':       'begampet',
  'secundrabad':    'secunderabad',
  'sec bad':        'secunderabad',
  'kphb':           'kphb colony',
  'dilsukh':        'dilsukhnagar',
  'gachi':          'gachibowli',
  'kondapur':       'kondapur',
  'banjara':        'banjara hills',
  'jubilee':        'jubilee hills',
  'nanakram':       'nanakramguda',
  'financial':      'financial district',
  'sr nagar':       'srinagar colony',
  'ameerpet':       'ameerpet',
};

export const typoVariants = (query) => {
  const variants = new Set([query.trim()]);
  if (query.length > 3) variants.add(query.trim().slice(0, -1));
  const lower = query.toLowerCase();
  Object.entries(TYPO_MAP).forEach(([wrong, right]) => {
    if (lower.includes(wrong)) variants.add(lower.replace(wrong, right));
  });
  return [...variants];
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE backend search call (replaces nominatimSearch)
// ─────────────────────────────────────────────────────────────────────────────
const backendSearch = async (q, lat, lng, city, bounded = false) => {
  try {
    const res = await api.get('/geo/search', {
      params: { q, lat, lng, city, bounded: bounded ? '1' : '0' },
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch { return []; }
};

// Deduplicate by place_id
const dedup = (arr) => {
  const seen = new Set();
  return arr.filter((r) => {
    if (seen.has(r.place_id)) return false;
    seen.add(r.place_id);
    return true;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SMART SEARCH  — ONE call per search (not 3+ parallel)
// Fuzzy variants are tried only if the primary call returns no results
// ─────────────────────────────────────────────────────────────────────────────
export const smartSearch = async (query, userLat, userLng, cityName) => {
  if (!query.trim()) return [];

  const [primary, ...fallbacks] = typoVariants(query.trim());

  // 1. Try primary query (bounded = city-only)
  let raw = await backendSearch(primary, userLat, userLng, cityName, true);

  // 2. If nothing found, try soft-bounded (wider area)
  if (raw.length === 0) {
    raw = await backendSearch(primary, userLat, userLng, cityName, false);
  }

  // 3. If STILL nothing, try fuzzy variants one by one (stop at first hit)
  if (raw.length === 0) {
    for (const variant of fallbacks) {
      raw = await backendSearch(variant, userLat, userLng, cityName, false);
      if (raw.length > 0) break;
    }
  }

  const results = [];
  dedup(raw).forEach((item) => {
    const itemLat = parseFloat(item.lat);
    const itemLng = parseFloat(item.lon);
    const dist    = (userLat && userLng)
      ? haversine(userLat, userLng, itemLat, itemLng)
      : null;

    if (dist !== null && dist > 40) return;   // skip places > 40 km away

    results.push({
      ...item,
      distanceKm: dist,
      roadKm:     dist !== null ? String(roadDistance(dist)) : null,
      duration:   dist !== null ? formatDuration(dist)       : null,
      fares:      dist !== null ? calcFares(dist)            : null,
    });
  });

  results.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null)
      return a.distanceKm - b.distanceKm;
    return 0;
  });

  return results.slice(0, 6);
};

/** Format display_name → { main, secondary } */
export const formatPlace = (display_name = '') => {
  const parts = display_name.split(',');
  return {
    main:      parts.slice(0, 2).join(',').trim(),
    secondary: parts.slice(2, 5).join(',').trim(),
  };
};

/** Enrich a saved/map-selected location with distance + fares */
export const enrichLocation = (rawLoc, userLat, userLng) => {
  if (!userLat || !userLng || !rawLoc?.coordinates) return rawLoc;
  const dist = haversine(
    userLat, userLng,
    rawLoc.coordinates[1], rawLoc.coordinates[0]
  );
  return {
    ...rawLoc,
    distanceKm: dist,
    roadKm:     String(roadDistance(dist)),
    duration:   formatDuration(dist),
    fares:      calcFares(dist),
  };
};