const Redis = require('ioredis');
const connectRedis = require('connect-redis');

const RedisStore = connectRedis(session);

const redisClient = new Redis(process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING, {
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
});

const store = new RedisStore({ client: redisClient });

module.exports = store;
