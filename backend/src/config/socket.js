const { Server }        = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis             = require('./redis');
const jwt               = require('jsonwebtoken');
const logger            = require('../utils/logger');

// ── Socket JWT middleware ──
const socketAuthMiddleware = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user   = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
};

let ioInstance = null;

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin:      (process.env.CLIENT_URLS || 'http://localhost:3000').split(','),
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports:     ['websocket', 'polling'],
    pingTimeout:    60000,
    pingInterval:   25000,
  });

  // ── Redis adapter ──
  // ioredis connects automatically — just duplicate the existing client
  try {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('✅ Socket.io Redis adapter connected');
  } catch (err) {
    logger.warn('Socket.io Redis adapter skipped: ' + err.message);
  }

  // ── Namespaces ──
  const rideNS   = io.of('/ride');
  const chatNS   = io.of('/chat');
  const driverNS = io.of('/driver');

  rideNS.use(socketAuthMiddleware);
  chatNS.use(socketAuthMiddleware);
  driverNS.use(socketAuthMiddleware);

  try { require('../sockets/ride.socket')(rideNS);    } catch (e) { logger.warn('ride.socket: '   + e.message); }
  try { require('../sockets/chat.socket')(chatNS);    } catch (e) { logger.warn('chat.socket: '   + e.message); }
  try { require('../sockets/driver.socket')(driverNS);} catch (e) { logger.warn('driver.socket: ' + e.message); }

  logger.info('✅ Socket.io namespaces initialized: /ride, /chat, /driver');

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

module.exports = { initSocket, getIO };