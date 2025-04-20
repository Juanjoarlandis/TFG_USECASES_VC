// tests/unit/middleware/errorHandler.prod.spec.js
const errorHandler = require('../../../src/middleware/errorHandler');
const httpMocks = require('node-mocks-http');

describe('errorHandler en producción (no expone stack)', () => {
    beforeAll(() => {
        process.env.NODE_ENV = 'production';
    });

    it('devuelve JSON sin la llave stack', () => {
        const err = new Error('boom');
        err.status = 418;
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        errorHandler(err, req, res, () => { });
        const body = res._getJSONData();
        expect(body.error).toMatchObject({
            type: 'InternalServerError', // por defecto
            message: 'boom'
        });
        expect(body.error.stack).toBeUndefined();
    });
});
