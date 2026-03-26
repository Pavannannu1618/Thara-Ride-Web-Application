import api from '../services/api';

// ── Search places via backend → Google Places Autocomplete ───────────────────
export const smartSearch = async (query, coords = null) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const params = { q: query.trim(), bounded: coords ? '1' : '0' };
    if (coords) {
      params.lat = coords[1]; // [lng, lat] → lat
      params.lng = coords[0];
    }
    const res = await api.get('/geo/search', { params });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('[geoUtils] search failed:', err.message);
    return [];
  }
};

// ── Get lat/lng + full address from a place_id ───────────────────────────────
export const getPlaceDetails = async (placeId) => {
  if (!placeId) return null;
  try {
    const res = await api.get('/geo/details', { params: { place_id: placeId } });
    const d   = res.data;
    if (!d || !d.lat) return null;
    return {
      address:     d.display_name,
      coordinates: [d.lon, d.lat], // [lng, lat] — GeoJSON order
      placeId:     d.place_id,
      city:        d.address?.city || '',
    };
  } catch (err) {
    console.warn('[geoUtils] details failed:', err.message);
    return null;
  }
};

// ── Reverse geocode lat/lng → address string ─────────────────────────────────
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await api.get('/geo/reverse', { params: { lat, lng } });
    return res.data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

// ── Haversine distance (km) between two [lng,lat] points ─────────────────────
export const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};