module.exports = (rideNS) => {
  rideNS.on('connection', (socket) => {
    const userId = socket.user?.id;
    console.log('[ride.socket] connected:', userId);

    // Join personal room
    if (userId) socket.join('user:' + userId);

    // Driver joins their own room
    socket.on('driver:join', ({ driverId }) => {
      socket.join('driver:' + driverId);
    });

    // Customer joins ride room for tracking
    socket.on('ride:join-room', (rideId) => {
      socket.join('ride:' + rideId);
    });

    // Driver location update
    socket.on('driver:location-update', async ({ lat, lng, heading, rideId }) => {
      if (!lat || !lng) return;
      try {
        const redis = require('../config/redis');
        await redis.setex(
          'driver:location:' + userId,
          10,
          JSON.stringify({ lat, lng, heading, updatedAt: Date.now() })
        );
        if (rideId) {
          rideNS.to('ride:' + rideId).emit('driver:location-broadcast', { lat, lng, heading });
        }
      } catch (e) { /* non-fatal */ }
    });

    // Ride status update
    socket.on('ride:status-update', ({ rideId, status }) => {
      rideNS.to('ride:' + rideId).emit('ride:status-update', { status });
    });

    // SOS alert
    socket.on('ride:sos', async ({ rideId, location }) => {
      rideNS.to('admin-room').emit('sos:alert', {
        rideId, location,
        userId,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[ride.socket] disconnected:', userId, reason);
    });
  });
};