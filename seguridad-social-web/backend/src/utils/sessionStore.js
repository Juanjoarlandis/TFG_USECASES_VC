// server/src/utils/sessionStore.js
const { redisClient } = require('../config/redis');

async function setSession(stateId, sessionData) {
    // 1. Serializar a JSON
    const payload = JSON.stringify(sessionData);
    // 2. Guardar en Redis 
    await redisClient.set(stateId, payload);
}

async function getSession(stateId) {
    const data = await redisClient.get(stateId);
    return data ? JSON.parse(data) : null;
}

async function deleteSession(stateId) {
    await redisClient.del(stateId);
}

module.exports = {
    setSession,
    getSession,
    deleteSession,
};
