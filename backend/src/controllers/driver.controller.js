const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const { setEx } = require('../config/redis');
const { getIO } = require('../config/socket');

const toggleOnline = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.driver._id,
      { isOnline },
      { new: true }
    );
    res.json({ success: true, data: { isOnline: driver.isOnline } });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, heading } = req.body;
    await Driver.findByIdAndUpdate(req.driver._id, {
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      heading: heading || 0,
    });

    // Cache in Redis for real-time access
    await setEx(`driver:location:${req.driver._id}`, 5, { lat, lng, heading });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const { period = 'today' } = req.query;
    let startDate = new Date();

    if (period === 'today') startDate.setHours(0, 0, 0, 0);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);

    const rides = await Ride.find({
      driver: req.driver._id,
      status: 'completed',
      createdAt: { $gte: startDate },
    }).select('fare createdAt');

    const totalEarnings = rides.reduce((sum, r) => sum + (r.fare.finalFare * 0.8), 0);
    const totalRides = rides.length;

    res.json({
      success: true,
      data: {
        totalEarnings: Math.ceil(totalEarnings),
        totalRides,
        period,
        walletBalance: req.driver.walletBalance,
        rides: rides.slice(0, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDriverProfile = async (req, res) => {
  res.json({
    success: true,
    data: {
      driver: {
        _id: req.driver._id,
        user: req.user,
        vehicle: req.driver.vehicle,
        rating: req.driver.rating,
        totalRides: req.driver.totalRides,
        isOnline: req.driver.isOnline,
        approvalStatus: req.driver.approvalStatus,
        acceptanceRate: req.driver.acceptanceRate,
        walletBalance: req.driver.walletBalance,
      },
    },
  });
};

const getNearbyRides = async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.driver._id);
    const rides = await Ride.find({
      status: 'searching',
      rideType: req.query.rideType,
      'pickup.location': {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: driver.currentLocation.coordinates },
          $maxDistance: 5000,
        },
      },
    }).limit(5);
    res.json({ success: true, data: { rides } });
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleOnline, updateLocation, getEarnings, getDriverProfile, getNearbyRides };