require('dotenv').config();
const http   = require('http');
const logger = require('./src/utils/logger');
const app    = require('./src/app');

const { connectDB }    = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const { initSocket }   = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // ── 1. MongoDB ──
    await connectDB();

    // ── 2. Redis ──
    await connectRedis();

    // ── 3. HTTP server ──
    const server = http.createServer(app);

    // ── 4. Socket.io ──
    initSocket(server);

    // ── 5. Listen ──
    server.listen(PORT, () => {
      logger.info(
        `🚀 Thara Ride server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`
      );
    });

    // ── Graceful shutdown ──
    const shutdown = async (signal) => {
      logger.info(`${signal} received — shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    logger.error('Failed to start server: ' + err.message);
    process.exit(1);
  }
};

// ── Unhandled rejections ──
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection: ' + err.message);
  process.exit(1);
});

startServer();