// tests/unit/middleware/corsConfig.spec.js
process.env.NODE_ENV = 'development';
const corsMiddleware = require('../../../src/middleware/corsConfig');

const httpMocks = require('node-mocks-http');

describe('corsConfig', () => {
    it('permite https://localhost en dev', () => {
        const req = httpMocks.createRequest({ headers: { origin: 'https://localhost' } });
        const res = httpMocks.createResponse();
        corsMiddleware(req, res, () => { });
        expect(res._getHeaders()['access-control-allow-origin']).toBe('https://localhost');
    });
});
