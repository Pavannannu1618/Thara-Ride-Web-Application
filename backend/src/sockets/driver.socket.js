module.exports = (driverNS) => {
  driverNS.on('connection', (socket) => {
    const userId = socket.user?.id;

    socket.on('driver:online', ({ driverId }) => {
      socket.join('driver:' + driverId);
      driverNS.emit('driver:status', { driverId, isOnline: true });
    });

    socket.on('driver:offline', ({ driverId }) => {
      socket.leave('driver:' + driverId);
      driverNS.emit('driver:status', { driverId, isOnline: false });
    });

    socket.on('ride:accept', ({ rideId, driverId }) => {
      driverNS.to('ride:' + rideId).emit('ride:accepted', { driverId, rideId });
    });

    socket.on('disconnect', () => {});
  });
};