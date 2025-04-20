// tests/unit/controllers/verificationController.extra.spec.js
const httpMocks = require('node-mocks-http');
const verificationController = require('../../../src/controllers/verificationController');
const verificationService = require('../../../src/services/verificationService');

jest.mock('../../../src/services/verificationService');

describe('verificationController ramas faltantes', () => {
    afterEach(() => jest.clearAllMocks());

    it('offerVerification3Creds responde correctamente', async () => {
        verificationService.offerVerification3CredsManual.mockResolvedValue({
            stateId: 's3',
            verificationUrl: 'url3',
        });
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        await verificationController.offerVerification3Creds(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ verificationUrl: 'url3', state: 's3' });
    });

    it('offerVerification3CredsAutomatic responde correctamente', async () => {
        const msg = { message: 'OK', state: 'sA', verificationUrl: 'uA' };
        verificationService.offerVerification3CredsAutomatic.mockResolvedValue(msg);
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();
        await verificationController.offerVerification3CredsAutomatic(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(msg);
    });

    it('statusCallbackAlta devuelve texto correcto', async () => {
        verificationService.handleStatusCallbackAlta.mockResolvedValue();
        const req = httpMocks.createRequest({ params: { stateId: 'X' } });
        const res = httpMocks.createResponse();
        await verificationController.statusCallbackAlta(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getData()).toBe('Status callback alta processed successfully');
    });

    it('statusCallback genérico devuelve JSON', async () => {
        verificationService.handleStatusCallbackGeneric.mockResolvedValue();
        const req = httpMocks.createRequest({ params: { stateId: 'Y' } });
        const res = httpMocks.createResponse();
        await verificationController.statusCallback(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ message: 'statusCallback processed successfully' });
    });

    it('statusCallbackWalletLogin devuelve JSON con estado', async () => {
        verificationService.handleStatusCallbackWalletLogin.mockResolvedValue();
        verificationService.getVerificationSession.mockResolvedValue({ status: 'ok' });
        const req = httpMocks.createRequest({ params: { stateId: 'Z' } });
        const res = httpMocks.createResponse();
        await verificationController.statusCallbackWalletLogin(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ message: 'statusCallbackWalletLogin processed', status: 'ok' });
    });
});
