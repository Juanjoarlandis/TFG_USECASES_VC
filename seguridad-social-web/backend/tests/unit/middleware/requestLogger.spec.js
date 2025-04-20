// tests/unit/middleware/requestLogger.spec.js
const requestLogger = require('../../../src/middleware/requestLogger');
const httpMocks = require('node-mocks-http');

describe('requestLogger', () => {
    it('llama console.log y next()', () => {
        const spy = jest.spyOn(console, 'log').mockImplementation(() => { });
        const req = httpMocks.createRequest({ method: 'GET', originalUrl: '/', body: {} });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        requestLogger(req, res, next);

        expect(spy).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
        spy.mockRestore();
    });
});
