// src/config/redis.js
const { createClient } = require("redis");
const logger = require("../../logger");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
  database: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : 0,
});

redisClient.on("error", (err) => logger.error("Redis Client Error:", err));

async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("Conectado a Redis");
  }
}

module.exports = { redisClient, connectRedis };
