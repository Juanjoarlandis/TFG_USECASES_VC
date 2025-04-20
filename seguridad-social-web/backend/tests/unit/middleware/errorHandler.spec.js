// tests/unit/middleware/errorHandler.spec.js
const errorHandler = require('../../../src/middleware/errorHandler');
const httpMocks = require('node-mocks-http');

function execute(err) {
    const req = httpMocks.createRequest({ method: 'GET', originalUrl: '/' });
    const res = httpMocks.createResponse();
    errorHandler(err, req, res, () => { });
    return res;
}

describe('errorHandler', () => {
    it('ValidationError', () => {
        const err = new Error();
        err.name = 'ValidationError';
        err.errors = { x: { message: 'bad' } };
        const res = execute(err);
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData().error.type).toBe('ValidationError');
    });

    it('TokenExpiredError → 401', () => {
        const err = new Error('expired');
        err.name = 'TokenExpiredError';
        const res = execute(err);
        expect(res.statusCode).toBe(401);
        expect(res._getJSONData().error.type).toBe('TokenExpiredError');
    });

    it('custom status + code', () => {
        const err = new Error('not found');
        err.status = 404;
        err.code = 'NOT_FOUND';
        const res = execute(err);
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData().error.type).toBe('NOT_FOUND');
    });
});
