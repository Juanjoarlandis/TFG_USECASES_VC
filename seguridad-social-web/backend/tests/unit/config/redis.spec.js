// tests/unit/config/redis.spec.js
describe('config/redis', () => {
    afterEach(() => {
        jest.resetModules();
        delete process.env.NODE_ENV;
        delete process.env.REDIS_HOST;
        delete process.env.REDIS_PORT;
        delete process.env.REDIS_DB;
    });

    it('usa ioredis‑mock en NODE_ENV=test', () => {
        process.env.NODE_ENV = 'test';
        const { redisClient, connectRedis } = require('../../../src/config/redis');
        // En test, redisClient debe ser de ioredis-mock y connectRedis no debe lanzar
        expect(typeof connectRedis).toBe('function');
        expect(redisClient).toBeDefined();
        // conectar no hace nada ni lanza
        return expect(connectRedis()).resolves.toBeUndefined();
    });

    it('crea un cliente real en producción y conecta', async () => {
        process.env.NODE_ENV = 'production';
        process.env.REDIS_HOST = 'h';
        process.env.REDIS_PORT = '1234';
        process.env.REDIS_DB = '2';
        // mock del createClient de 'redis'
        const mockConnect = jest.fn().mockResolvedValue();
        const mockOn = jest.fn();
        jest.mock('redis', () => ({
            createClient: jest.fn(() => ({
                isOpen: false,
                connect: mockConnect,
                on: mockOn,
            })),
        }));
        const { redisClient, connectRedis } = require('../../../src/config/redis');
        // El cliente debe venir del mock y connectRedis debe llamar a .connect()
        await connectRedis();
        expect(mockConnect).toHaveBeenCalled();
        expect(redisClient).toBeDefined();
    });
});
