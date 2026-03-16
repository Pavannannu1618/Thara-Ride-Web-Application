const IORedis = require('ioredis');

const client = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,
  reconnectOnError:     () => true,
  lazyConnect:          false,
});

client.on('connect', () => console.log('[Redis] connecting...'));
client.on('error',   (err) => console.error('[Redis] error:', err.message));

// ── connectRedis: called once at startup ──
const connectRedis = async () => {
  try {
    await client.ping();
    const logger = require('../utils/logger');
    logger.info('Redis connected');
    logger.info('✅ Redis connected');
  } catch (err) {
    const logger = require('../utils/logger');
    logger.error('Redis connection failed: ' + err.message);
    throw err;
  }
};

module.exports = client;
module.exports.connectRedis = connectRedis;