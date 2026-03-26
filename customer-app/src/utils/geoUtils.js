import { haversine, roadDistance, calcFares, formatDuration } from './fareUtils';
import api from '../services/api';   // your existing axios instance (has auth header)

// ─────────────────────────────────────────────────────────────────────────────
// Google Maps API calls through backend proxy — no CORS, proper rate limiting
// ─────────────────────────────────────────────────────────────────────────────

/** Reverse-geocode lat/lng → Google Maps JSON via backend */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await api.get('/geo/reverse', { params: { lat, lng } });
    return res.data || null;
  } catch { return null; }
};

/** Get place details by place_id → Google Maps JSON via backend */
export const getPlaceDetails = async (placeId) => {
  try {
    const res = await api.get('/geo/details', { params: { place_id: placeId } });
    return res.data || null;
  } catch { return null; }
};

/** Extract city from a Google Maps address object */
export const extractCity = (address = {}) =>
  address.city || address.locality || address.administrative_area_level_2 || '';

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
// SMART SEARCH using Google Maps Places API
// Restricted to user's current city/area for accurate local results
// ─────────────────────────────────────────────────────────────────────────────
export const smartSearch = async (query, userLat, userLng, cityName) => {
  if (!query.trim()) return [];

  try {
    // Use Google Maps Places Autocomplete API through backend
    const results = await backendSearch(query, userLat, userLng, cityName, true);

    // Transform results to include coordinates by fetching place details for each
    const enrichedResults = await Promise.all(
      results.slice(0, 5).map(async (result) => {
        try {
          const details = await getPlaceDetails(result.place_id);
          if (!details) return null;

          const itemLat = parseFloat(details.lat);
          const itemLng = parseFloat(details.lon);
          const dist = (userLat && userLng)
            ? haversine(userLat, userLng, itemLat, itemLng)
            : null;

          // Skip places > 50 km away for better local relevance
          if (dist !== null && dist > 50) return null;

          return {
            ...result,
            lat: itemLat,
            lon: itemLng,
            display_name: details.display_name || result.display_name,
            address: details.address || result.address,
            distanceKm: dist,
            roadKm: dist !== null ? String(roadDistance(dist)) : null,
            duration: dist !== null ? formatDuration(dist) : null,
            fares: dist !== null ? calcFares(dist) : null,
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out null results and sort by distance
    const validResults = enrichedResults.filter(result => result !== null);
    validResults.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null)
        return a.distanceKm - b.distanceKm;
      return 0;
    });

    return validResults;
  } catch {
    return [];
  }
};

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