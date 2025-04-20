const { authRateLimiter: rateLimiter } = require('../../../src/middleware/rateLimiter');
const httpMocks = require('node-mocks-http');

/**
 *  express‑rate‑limit accede a `req.app.get('trust proxy')`.
 *  Con node‑mocks‑http hay que “inyectar” a mano ese mini‑objeto
 *  para evitar `TypeError: Cannot read properties of undefined (reading 'get')`.
 */
function buildReq() {
    const req = httpMocks.createRequest();
    req.app = { get: () => undefined };      // stub mínimo
    return req;
}

describe('rateLimiter.authRateLimiter', () => {
    it('permite hasta max peticiones', async () => {
        for (let i = 0; i < 10; i++) {
            const req = buildReq();
            const res = httpMocks.createResponse();
            const next = jest.fn();

            await rateLimiter(req, res, next);

            expect(res.statusCode).toBe(200);   // sin bloquear
            expect(next).toHaveBeenCalled();
        }
    });

    it('bloquea cuando excede el max', async () => {
        const req = buildReq();                  // 11.ª petición desde la misma “IP”
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await rateLimiter(req, res, next);

        expect(res.statusCode).toBe(429);
        /* express‑rate‑limit envía directamente el objeto ⇒ _getData() lo devuelve tal cual */
        expect(res._getData()).toEqual({
            error: 'Too many requests, please try again later.',
        });
    });
});
