const cron = require('node-cron');
const Ride = require('../models/Ride');
const { broadcastRideRequest } = require('../services/ride.service');
const { createNotification } = require('../services/notification.service');
const logger = require('../utils/logger');

const processScheduledRides = async () => {
  try {
    const now = new Date();
    const lookAheadTime = new Date(now.getTime() + 15 * 60000); // 15 minutes ahead

    const scheduledRides = await Ride.find({
      status: 'scheduled',
      scheduledAt: { $lte: lookAheadTime, $gte: now },
    });

    for (const ride of scheduledRides) {
      logger.info(`Processing scheduled ride: ${ride._id}`);

      await Ride.findByIdAndUpdate(ride._id, { status: 'searching' });

      await createNotification({
        userId: ride.customer,
        type: 'ride_update',
        title: 'Scheduled Ride Starting',
        body: 'Your scheduled ride is being arranged. Finding a driver near you.',
        data: { rideId: ride._id },
      });

      broadcastRideRequest(ride).catch((err) =>
        logger.error(`Scheduled ride broadcast error: ${err.message}`)
      );
    }
  } catch (err) {
    logger.error('Scheduled ride job error:', err.message);
  }
};

// Run every minute
const startScheduledRideJob = () => {
  cron.schedule('* * * * *', processScheduledRides);
  logger.info('Scheduled ride job started');
};

module.exports = { startScheduledRideJob };