const session = require('express-session');
const Redis = require('ioredis');
const connectRedis = require('connect-redis');

const DRIVER = (process.env.SESSION_STORE_DRIVER || '').toLowerCase();

function createRedisStore() {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;

  if (!redisUrl) {
    console.warn('[sessionStore] Redis driver selected but REDIS_URL is not configured. Falling back to MemoryStore.');
    return null;
  }

  const RedisStore = connectRedis(session);

  const redisClient = new Redis(redisUrl, {
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  });

  redisClient.on('error', (err) => {
    console.error('[sessionStore] Redis client error', err);
  });

  return new RedisStore({ client: redisClient });
}

function getStore() {
  if (DRIVER === 'redis') {
    const redisStore = createRedisStore();
    if (redisStore) {
      console.log('[sessionStore] Using Redis-backed session store');
      return redisStore;
    }
  }

  console.warn('[sessionStore] Using in-memory session store. Not recommended for production.');
  return new session.MemoryStore();
}

module.exports = getStore();
