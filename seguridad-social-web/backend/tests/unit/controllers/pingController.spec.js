// tests/unit/controllers/pingController.spec.js
const httpMocks = require('node-mocks-http');
const pingController = require('../../../src/controllers/pingController');

describe('/wallet-api/ping', () => {
    it('responde pong', () => {
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        pingController(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getData()).toBe('pong');
    });
});
