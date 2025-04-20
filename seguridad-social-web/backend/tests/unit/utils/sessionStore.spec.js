// tests/unit/utils/sessionStore.spec.js
const { setSession, getSession, deleteSession } = require('../../../src/utils/sessionStore');
const { redisClient } = require('../../../src/config/redis');

describe('sessionStore', () => {
    const key = 'test-session';
    const data = { foo: 'bar' };

    afterAll(async () => {
        await redisClient.quit();
    });

    it('setSession y getSession funcionan correctamente', async () => {
        await setSession(key, data);
        const saved = await getSession(key);
        expect(saved).toEqual(data);
    });

    it('deleteSession elimina la clave', async () => {
        await setSession(key, data);
        await deleteSession(key);
        const after = await getSession(key);
        expect(after).toBeNull();
    });
});
