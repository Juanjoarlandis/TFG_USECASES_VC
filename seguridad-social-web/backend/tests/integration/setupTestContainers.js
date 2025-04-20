// tests/integration/setupTestContainers.js
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');           // Redis “en memoria” para los tests

let mongoServer;
let redisClient;

module.exports = async () => {
    /* ---------- MongoDB in‑memory (replica set) ---------- */
    mongoServer = await MongoMemoryReplSet.create({
        replSet: { storageEngine: 'wiredTiger' },
    });
    process.env.MONGO_URI = mongoServer.getUri();
    await mongoose.connect(process.env.MONGO_URI);

    /* ---------------- Redis in‑memory ------------------- */
    redisClient = new Redis();
    await new Promise((resolve) => redisClient.on('ready', resolve));

    /* -- VARIABLES DE ENTORNO NECESARIAS POR verificationService -- */
    //  Redis (dummy, porque usamos ioredis-mock)
    process.env.REDIS_HOST = '127.0.0.1';
    process.env.REDIS_PORT = '6379';
    //  URLs usadas para crear la oferta OID4VC
    process.env.WALTID_VERIFIER_URL = process.env.WALTID_VERIFIER_URL || 'http://caddy:7003';
    process.env.VERIFIER_COORD_PUBLIC_URL =
        process.env.VERIFIER_COORD_PUBLIC_URL || 'http://localhost:3001';

    return { redisClient };
};

module.exports.teardown = async () => {
    await mongoose.disconnect();
    await mongoServer.stop();

    if (redisClient?.quit) {
        await redisClient.quit();
    }
};
