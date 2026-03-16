const rideService = require('../services/ride.service');
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { getIO } = require('../config/socket');
const { notifyRideUpdate } = require('../services/notification.service');
const logger = require('../utils/logger');

const estimateFare = async (req, res, next) => {
  try {
    const { pickup, destination, rideType } = req.body;
    const estimate = await rideService.estimateFare({ pickup, destination, rideType });
    res.json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
};

const bookRide = async (req, res, next) => {
  try {
    const { pickup, destination, rideType, paymentMethod, promoCode } = req.body;

    const ride = await rideService.createRide({
      customerId: req.user._id,
      pickup,
      destination,
      rideType,
      paymentMethod,
      promoCode,
    });

    res.status(201).json({ success: true, data: { ride } });

    // Asynchronously search for drivers
    rideService.broadcastRideRequest(ride).catch((err) =>
      logger.error('Driver search error:', err)
    );
  } catch (error) {
    next(error);
  }
};

const getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('customer', 'name phone avatar')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
      .populate('vehicle')
      .populate('payment');

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });
    res.json({ success: true, data: { ride } });
  } catch (error) {
    next(error);
  }
};

const cancelRide = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });

    const cancelableStatuses = ['searching', 'accepted', 'arrived'];
    if (!cancelableStatuses.includes(ride.status)) {
      return res.status(400).json({ success: false, error: `Cannot cancel ride with status: ${ride.status}` });
    }

    const isCustomer = ride.customer.toString() === req.user._id.toString();
    const isDriver = req.driver && ride.driver?.toString() === req.driver._id.toString();

    if (!isCustomer && !isDriver) {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this ride' });
    }

    await Ride.findByIdAndUpdate(ride._id, {
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: isCustomer ? 'customer' : 'driver',
    });

    if (ride.driver) {
      await Driver.findByIdAndUpdate(ride.driver, { activeRide: null });
    }

    const io = getIO();
    io.of('/ride').to(`ride:${ride._id}`).emit('ride:cancelled', { rideId: ride._id, reason, by: isCustomer ? 'customer' : 'driver' });

    res.json({ success: true, message: 'Ride cancelled' });
  } catch (error) {
    next(error);
  }
};

const acceptRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride || ride.status !== 'searching') {
      return res.status(400).json({ success: false, error: 'Ride not available' });
    }

    await Ride.findByIdAndUpdate(ride._id, { driver: req.driver._id, vehicle: req.driver.vehicle, status: 'accepted' });
    await Driver.findByIdAndUpdate(req.driver._id, { activeRide: ride._id });

    // Resolve the wait promise
    const key = `${ride._id}:${req.driver._id}`;
    if (global._rideAcceptResolvers?.[key]) {
      global._rideAcceptResolvers[key](true);
      delete global._rideAcceptResolvers[key];
    }

    const io = getIO();
    const updatedRide = await Ride.findById(ride._id)
      .populate({ path: 'driver', populate: { path: 'user', select: 'name phone avatar' } })
      .populate('vehicle');

    io.of('/ride').to(`customer:${ride.customer}`).emit('ride:accepted', { ride: updatedRide });

    await notifyRideUpdate(ride.customer, null, 'accepted', ride._id);

    res.json({ success: true, data: { ride: updatedRide } });
  } catch (error) {
    next(error);
  }
};

const updateRideStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });
    if (ride.driver?.toString() !== req.driver._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not your ride' });
    }

    const updates = { status };
    if (status === 'started') updates.startedAt = new Date();
    if (status === 'completed') {
      updates.completedAt = new Date();
      await Driver.findByIdAndUpdate(req.driver._id, {
        activeRide: null,
        $inc: { totalRides: 1 },
      });
    }

    await Ride.findByIdAndUpdate(ride._id, updates);

    const io = getIO();
    io.of('/ride').to(`ride:${ride._id}`).emit('ride:status-update', { rideId: ride._id, status });
    await notifyRideUpdate(ride.customer, null, status, ride._id);

    res.json({ success: true, message: `Ride status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) return res.status(404).json({ success: false, error: 'Ride not found' });
    if (ride.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });

    await Ride.findByIdAndUpdate(ride._id, { status: 'started', startedAt: new Date() });

    const io = getIO();
    io.of('/ride').to(`ride:${ride._id}`).emit('ride:status-update', { rideId: ride._id, status: 'started' });

    res.json({ success: true, message: 'Ride started' });
  } catch (error) {
    next(error);
  }
};

const getRideHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = req.driver
      ? { driver: req.driver._id }
      : { customer: req.user._id };

    const [rides, total] = await Promise.all([
      Ride.find({ ...query, status: { $in: ['completed', 'cancelled'] } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('driver', 'user rating')
        .populate('vehicle', 'make model type'),
      Ride.countDocuments({ ...query, status: { $in: ['completed', 'cancelled'] } }),
    ]);

    res.json({
      success: true,
      data: { rides, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { estimateFare, bookRide, getRide, cancelRide, acceptRide, updateRideStatus, verifyOTP, getRideHistory };