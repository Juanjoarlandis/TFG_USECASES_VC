// tests/unit/controllers/verificationController.spec.js
const httpMocks = require('node-mocks-http');
const verificationController = require(
    '../../../src/controllers/verificationController',
);
const verificationService = require('../../../src/services/verificationService');

jest.mock('../../../src/services/verificationService');

describe('verificationController', () => {
    beforeEach(() => jest.clearAllMocks());

    test('offerVerification delega y responde 200', async () => {
        verificationService.offerVerificationOneCred.mockResolvedValue({
            stateId: 's‑1',
            verificationUrl: 'http://url',
        });

        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();

        await verificationController.offerVerification(req, res, () => { });
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({
            verificationUrl: 'http://url',
            state: 's‑1',
        });
    });

    test('getVerificationSession error → 404', async () => {
        verificationService.getVerificationSession.mockRejectedValue({
            status: 404,
            message: 'Sesión no encontrada',
        });

        const req = httpMocks.createRequest({ params: { stateId: 'nope' } });
        const res = httpMocks.createResponse();

        await verificationController.getVerificationSession(req, res, () => { });
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({ error: 'Sesión no encontrada' });
    });
});
