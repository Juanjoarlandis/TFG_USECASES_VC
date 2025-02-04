/**
 * @file redis.js
 * @description Configures and exports the Redis client along with a function to connect to Redis.
 * @module config/redis
 */

const { createClient } = require('redis');
const logger = require('../../logger');

/**
 * Redis client instance configured using environment variables.
 * @type {import('redis').RedisClientType}
 */
const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    },
    database: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
});

// Log any Redis client errors.
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

/**
 * Connects to the Redis server if not already connected.
 *
 * @async
 * @function connectRedis
 * @returns {Promise<void>} Resolves when the connection is successfully established.
 */
async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        logger.info('Connected to Redis');
    }
}

module.exports = { redisClient, connectRedis };
