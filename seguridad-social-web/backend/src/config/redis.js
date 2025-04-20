// src/config/redis.js
const logger = require('../../logger');

/**
 * Si estamos en entorno de tests (`NODE_ENV=test`) usamos ioredis‑mock
 * para disponer de un cliente totalmente en memoria.  
 * En cualquier otro caso (dev, prod) se crea el cliente real con `redis`.
 */
const isTestEnv = process.env.NODE_ENV === 'test';

let redisClient;
let connectRedis = async () => { }; // no‑op por defecto (mock)

if (isTestEnv) {
  // 🧪  Cliente “fake” que vive en memoria ‑‑ no necesita puerto ni host.
  const RedisMock = require('ioredis-mock');
  redisClient = new RedisMock();
  logger.debug('[Redis] Using ioredis‑mock client (test mode)');
} else {
  // 🚀  Cliente real para desarrollo / producción
  const { createClient } = require('redis');
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    },
    database: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error:', err));

  connectRedis = async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Conectado a Redis');
    }
  };
}

module.exports = { redisClient, connectRedis };
