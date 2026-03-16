module.exports = (chatNS) => {
  chatNS.on('connection', (socket) => {
    const userId = socket.user?.id;

    socket.on('chat:join', (rideId) => {
      socket.join('chat:' + rideId);
    });

    socket.on('chat:message', ({ rideId, message }) => {
      if (!rideId || !message?.trim()) return;
      const payload = {
        sender:    userId,
        message:   message.trim(),
        time:      new Date(),
        rideId,
      };
      chatNS.to('chat:' + rideId).emit('chat:message', payload);
    });

    socket.on('disconnect', () => {});
  });
};