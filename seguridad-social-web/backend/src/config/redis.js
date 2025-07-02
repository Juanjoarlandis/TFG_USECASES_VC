/**
 * @module src/config/redis
 * @description Configura y gestiona la conexión a Redis:
 *              - Entorno de tests (`NODE_ENV=test`): usa `ioredis-mock` para un cliente en memoria.
 *              - Entorno de desarrollo/producción: usa cliente real de `redis`.
 * @requires logger
 */

const logger = require('../../logger');

const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * Instancia del cliente Redis.
 * - `ioredis-mock` en modo test.
 * - Cliente real de `redis` en dev/prod.
 * @type {import('ioredis').Redis|import('redis').RedisClientType}
 */
let redisClient;

/**
 * Conecta al cliente Redis.
 * - No-op en test (el mock es in-memory y listo al instanciar).
 * - En dev/prod, conecta si el cliente no está ya abierto.
 *
 * @async
 * @function connectRedis
 * @returns {Promise<void>} Resuelve inmediatamente en test o al conectarse en dev/prod.
 */
let connectRedis = async () => { };

if (isTestEnv) {
  /**
   * Cliente “fake” para tests, completamente en memoria.
   * No requiere host, puerto ni credenciales.
   * @see https://github.com/stipsan/ioredis-mock
   */
  const RedisMock = require('ioredis-mock');
  redisClient = new RedisMock();
  logger.debug('[Redis] Usando cliente ioredis-mock (modo test)');
} else {
  /**
   * Cliente real para desarrollo/producción.
   * Configura host, puerto y base de datos desde variables de entorno.
   * @see https://github.com/redis/node-redis
   */
  const { createClient } = require('redis');
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
    },
    database: process.env.REDIS_DB
      ? parseInt(process.env.REDIS_DB, 10)
      : 0,
  });

  /**
   * Maneja errores emitidos por el cliente Redis.
   * @param {Error} err - Error emitido por Redis.
   */
  redisClient.on('error', (err) =>
    logger.error('Error en cliente Redis:', err)
  );

  // Redefine connectRedis para entorno real
  connectRedis = async () => {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      logger.info('Conectado a Redis');
    }
  };
}

module.exports = { redisClient, connectRedis };
