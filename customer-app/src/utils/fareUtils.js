// ─────────────────────────────────────────────────────────────────────────────
// FARE CONFIG  (mirrors backend/src/services/surge.service.js exactly)
// ─────────────────────────────────────────────────────────────────────────────
export const FARE_CONFIG = {
  bike:  { base: 25,  perKm: 8,  perMin: 1.0, minFare: 30,  label: 'Bike',  icon: '🏍️' },
  auto:  { base: 30,  perKm: 12, perMin: 1.5, minFare: 40,  label: 'Auto',  icon: '🛺'  },
  mini:  { base: 50,  perKm: 14, perMin: 2.0, minFare: 60,  label: 'Mini',  icon: '🚗'  },
  sedan: { base: 70,  perKm: 18, perMin: 2.5, minFare: 80,  label: 'Sedan', icon: '🚙'  },
  suv:   { base: 100, perKm: 22, perMin: 3.0, minFare: 120, label: 'SUV',   icon: '🚐'  },
  pool:  { base: 20,  perKm: 6,  perMin: 0.8, minFare: 25,  label: 'Pool',  icon: '👥'  },
};

export const RIDE_TYPES = Object.entries(FARE_CONFIG).map(([type, cfg]) => ({
  type,
  ...cfg,
}));

// Average city speed assumption
const AVG_SPEED_KMH = 25;
// Road distance multiplier over straight-line
const ROAD_FACTOR = 1.35;

/** Haversine straight-line distance in km */
export const haversine = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Straight-line km → estimated road km */
export const roadDistance = (km) => +(km * ROAD_FACTOR).toFixed(1);

/** Road km → estimated city travel duration string */
export const formatDuration = (straightLineKm) => {
  const mins = Math.round((roadDistance(straightLineKm) / AVG_SPEED_KMH) * 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

/** Returns fare per ride type for a given straight-line distance */
export const calcFares = (straightLineKm) => {
  const dist = roadDistance(straightLineKm);
  const mins = (dist / AVG_SPEED_KMH) * 60;
  const out  = {};
  Object.entries(FARE_CONFIG).forEach(([type, cfg]) => {
    const raw = cfg.base + dist * cfg.perKm + mins * cfg.perMin;
    out[type] = Math.max(Math.ceil(raw), cfg.minFare);
  });
  return out; // { bike: 45, auto: 60, mini: 80, ... }
};