// tests/unit/middleware/errorHandler.extra.spec.js
const errorHandler = require('../../../src/middleware/errorHandler');
const httpMocks = require('node-mocks-http');

function run(err) {
    const req = httpMocks.createRequest({ method: 'GET', originalUrl: '/' });
    const res = httpMocks.createResponse();
    errorHandler(err, req, res, () => { });
    return res;
}

describe('errorHandler – ramas adicionales', () => {
    it('CastError → 400 y mensaje de path inválido', () => {
        const err = new Error('cast');
        err.name = 'CastError';
        err.path = 'id';
        err.value = 'xxx';
        const res = run(err);
        expect(res.statusCode).toBe(400);
        const body = res._getJSONData().error;
        expect(body.type).toBe('CastError');
        expect(body.message).toMatch(/formato del parámetro id/);
    });

    it('DuplicateKeyError → 400 y tipo DuplicateKeyError', () => {
        const err = new Error();
        err.code = 11000;
        err.keyValue = { email: 'a@b.com' };
        const res = run(err);
        expect(res.statusCode).toBe(400);
        const body = res._getJSONData().error;
        expect(body.type).toBe('DuplicateKeyError');
        expect(body.message).toMatch(/campo email debe ser único/);
    });

    it('ExternalServiceError (isAxiosError) → usa status de err.response', () => {
        const err = new Error('fail');
        err.isAxiosError = true;
        err.response = { status: 502 };
        const res = run(err);
        expect(res.statusCode).toBe(502);
        expect(res._getJSONData().error.type).toBe('ExternalServiceError');
    });

    it('JsonWebTokenError → 401 y tipo JsonWebTokenError', () => {
        const err = new Error('jwt');
        err.name = 'JsonWebTokenError';
        const res = run(err);
        expect(res.statusCode).toBe(401);
        expect(res._getJSONData().error.type).toBe('JsonWebTokenError');
    });
});
