
const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The redis server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

const connectRedis = async () => {
  try {
    await client.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error);
  }
};

client.on('error', (err) => {
  logger.error('Redis error:', err);
});

const cacheGet = async (key) => {
  try {
    return await client.get(key);
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, expiration = 3600) => {
  try {
    await client.setEx(key, expiration, JSON.stringify(value));
  } catch (error) {
    logger.error('Cache set error:', error);
  }
};

const cacheDel = async (key) => {
  try {
    await client.del(key);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

module.exports = { connectRedis, cacheGet, cacheSet, cacheDel };
const redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

let redisClient;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error.message);
    // Return a mock client that doesn't break the app
    return {
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      exists: async () => 0
    };
  }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
