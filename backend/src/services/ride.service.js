const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const PromoCode = require('../models/PromoCode');
const { calculateFare } = require('./surge.service');
const { getDistanceAndDuration } = require('./geo.service');
const { setEx, getKey, deleteKey } = require('../config/redis');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');
const crypto = require('crypto');

const findNearbyDrivers = async ({ coordinates, rideType, radiusKm = 5 }) => {
  const drivers = await Driver.find({
    isOnline: true,
    approvalStatus: 'approved',
    activeRide: null,
    currentLocation: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radiusKm * 1000,
      },
    },
  })
    .limit(10)
    .populate('user', 'name phone avatar')
    .populate('vehicle', 'type make model plateNumber color')
    .lean();

  // Filter by vehicle type if specified
  return drivers.filter(
    (d) => !rideType || d.vehicle?.type === rideType || rideType === 'pool'
  );
};

const scoreDriver = (driver, pickupCoords) => {
  const [lng1, lat1] = pickupCoords;
  const [lng2, lat2] = driver.currentLocation.coordinates;
  const distance = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
  const distScore = Math.max(0, 1 - distance * 100);
  return distScore * 0.6 + (driver.rating / 5) * 0.25 + (driver.acceptanceRate / 100) * 0.15;
};

const estimateFare = async ({ pickup, destination, rideType }) => {
  const { distanceKm, durationMins } = await getDistanceAndDuration(
    pickup.coordinates,
    destination.coordinates
  );

  const fareDetails = await calculateFare({
    rideType,
    distanceKm,
    durationMins,
    pickup,
  });

  return { ...fareDetails, distanceKm, durationMins };
};

const createRide = async ({ customerId, pickup, destination, rideType, paymentMethod, promoCode }) => {
  const { distanceKm, durationMins } = await getDistanceAndDuration(
    pickup.coordinates,
    destination.coordinates
  );

  const fareDetails = await calculateFare({ rideType, distanceKm, durationMins, pickup });

  let promoDiscount = 0;
  let promoRef = null;

  if (promoCode) {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      usedBy: { $ne: customerId },
    });

    if (promo) {
      if (promo.discountType === 'percentage') {
        promoDiscount = Math.min(
          (fareDetails.totalFare * promo.discount) / 100,
          promo.maxDiscount || Infinity
        );
      } else {
        promoDiscount = Math.min(promo.discount, fareDetails.totalFare);
      }
      promoRef = promo._id;
      await PromoCode.findByIdAndUpdate(promo._id, {
        $addToSet: { usedBy: customerId },
        $inc: { usedCount: 1 },
      });
    }
  }

  const finalFare = Math.max(fareDetails.totalFare - promoDiscount, 0);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const ride = await Ride.create({
    customer: customerId,
    rideType,
    pickup,
    destination,
    route: { distanceKm, durationMins },
    fare: {
      ...fareDetails,
      promoDiscount: Math.ceil(promoDiscount),
      finalFare: Math.ceil(finalFare),
    },
    promoCode: promoRef,
    otp,
    status: 'searching',
  });

  // Create pending payment
  await Payment.create({
    ride: ride._id,
    customer: customerId,
    amount: finalFare,
    method: paymentMethod || 'cash',
    status: 'pending',
  });

  return ride;
};

const broadcastRideRequest = async (ride) => {
  const io = getIO();
  const drivers = await findNearbyDrivers({
    coordinates: ride.pickup.location.coordinates,
    rideType: ride.rideType,
  });

  if (!drivers.length) {
    await Ride.findByIdAndUpdate(ride._id, { status: 'cancelled', cancelledBy: 'system', cancelReason: 'No drivers available' });
    io.of('/ride').to(`customer:${ride.customer}`).emit('ride:no-drivers', { rideId: ride._id });
    return null;
  }

  // Score and sort drivers
  const scoredDrivers = drivers
    .map((d) => ({ ...d, score: scoreDriver(d, ride.pickup.location.coordinates) }))
    .sort((a, b) => b.score - a.score);

  const rideDetails = {
    rideId: ride._id,
    pickup: ride.pickup,
    destination: ride.destination,
    rideType: ride.rideType,
    fare: ride.fare.finalFare,
    distance: ride.route.distanceKm,
    duration: ride.route.durationMins,
  };

  // Broadcast sequentially with 30s timeout per driver
  for (const driver of scoredDrivers) {
    const accepted = await waitForAcceptance(ride._id, driver._id, 30000, io, rideDetails);
    if (accepted) return driver;
  }

  await Ride.findByIdAndUpdate(ride._id, {
    status: 'cancelled',
    cancelledBy: 'system',
    cancelReason: 'No driver accepted',
  });
  io.of('/ride').to(`customer:${ride.customer}`).emit('ride:no-drivers', { rideId: ride._id });
  return null;
};

const waitForAcceptance = (rideId, driverId, timeout, io, rideDetails) => {
  return new Promise((resolve) => {
    io.of('/ride').to(`driver:${driverId}`).emit('ride:new-request', {
      ...rideDetails,
      expiresIn: 30,
    });

    const timer = setTimeout(async () => {
      await setEx(`ride:declined:${rideId}:${driverId}`, 60, '1');
      resolve(false);
    }, timeout);

    // Store resolver in Redis pub/sub pattern via in-memory map
    global._rideAcceptResolvers = global._rideAcceptResolvers || {};
    global._rideAcceptResolvers[`${rideId}:${driverId}`] = (accepted) => {
      clearTimeout(timer);
      resolve(accepted);
    };
  });
};

module.exports = { findNearbyDrivers, estimateFare, createRide, broadcastRideRequest };