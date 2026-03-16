const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const { setEx, getKey } = require('../config/redis');

const FARE_CONFIG = {
  bike:  { base: 25,  perKm: 8,  perMin: 1.0, minFare: 30  },
  auto:  { base: 30,  perKm: 12, perMin: 1.5, minFare: 40  },
  mini:  { base: 50,  perKm: 14, perMin: 2.0, minFare: 60  },
  sedan: { base: 70,  perKm: 18, perMin: 2.5, minFare: 80  },
  suv:   { base: 100, perKm: 22, perMin: 3.0, minFare: 120 },
  pool:  { base: 30,  perKm: 7,  perMin: 1.0, minFare: 25  },
};

const getDriversInArea = async (coordinates, radiusKm) => {
  return Driver.countDocuments({
    isOnline: true,
    approvalStatus: 'approved',
    activeRide: null,
    currentLocation: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

const getRidesInArea = async (coordinates, radiusKm) => {
  return Ride.countDocuments({
    status: { $in: ['searching', 'accepted', 'started'] },
    'pickup.location': {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  });
};

const getSurgeMultiplier = async (coordinates) => {
  // Generate a geohash-like key for caching
  const geoHash = `${Math.round(coordinates[1] * 100)}_${Math.round(coordinates[0] * 100)}`;
  const cacheKey = `surge:${geoHash}`;

  const cached = await getKey(cacheKey);
  if (cached !== null && cached !== undefined) return parseFloat(cached);

  const [activeRides, onlineDrivers] = await Promise.all([
    getRidesInArea(coordinates, 3),
    getDriversInArea(coordinates, 3),
  ]);

  const ratio = activeRides / (onlineDrivers || 1);

  let multiplier = 1.0;
  if (ratio < 1.5)       multiplier = 1.0;
  else if (ratio < 2.0)  multiplier = 1.2;
  else if (ratio < 3.0)  multiplier = 1.5;
  else                   multiplier = Math.min(1 + ratio * 0.3, 3.0);

  // Time-of-day adjustment
  const hour = new Date().getHours();
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20)) {
    multiplier = Math.min(multiplier * 1.1, 3.0); // Peak hours +10%
  }

  await setEx(cacheKey, 30, multiplier.toString());
  return multiplier;
};

const calculateFare = async ({ rideType, distanceKm, durationMins, pickup }) => {
  const config = FARE_CONFIG[rideType];
  if (!config) throw new Error(`Invalid ride type: ${rideType}`);

  const baseFare = config.base + distanceKm * config.perKm + durationMins * config.perMin;
  const surge = await getSurgeMultiplier(pickup.coordinates);
  const total = Math.max(baseFare * surge, config.minFare);

  return {
    baseFare: Math.ceil(baseFare),
    surgeMultiplier: surge,
    totalFare: Math.ceil(total),
    breakdown: {
      base: config.base,
      distanceCharge: Math.ceil(distanceKm * config.perKm),
      timeCharge: Math.ceil(durationMins * config.perMin),
    },
  };
};

module.exports = { calculateFare, getSurgeMultiplier, FARE_CONFIG };