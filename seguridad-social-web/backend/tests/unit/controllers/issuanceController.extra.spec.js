// tests/unit/controllers/issuanceController.extra.spec.js
const httpMocks = require('node-mocks-http');
const issuanceController = require('../../../src/controllers/issuanceController');
const issuanceService = require('../../../src/services/issuanceService');

jest.mock('../../../src/services/issuanceService');

describe('issuanceController ramas faltantes', () => {
    afterEach(() => jest.clearAllMocks());

    it('issuanceStatusCallback éxito', async () => {
        issuanceService.handleIssuanceCallback.mockResolvedValue();
        const req = httpMocks.createRequest({ params: { stateId: 'A' } });
        const res = httpMocks.createResponse();
        await issuanceController.issuanceStatusCallback(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ message: 'Issuance callback processed successfully' });
    });

    it('getIssuanceSessionStatus éxito', async () => {
        issuanceService.getIssuanceSessionStatus.mockResolvedValue('ready');
        const req = httpMocks.createRequest({ params: { stateId: 'B' } });
        const res = httpMocks.createResponse();
        await issuanceController.getIssuanceSessionStatus(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ issuanceStatus: 'ready' });
    });

    it('claimAltaCredential 400 si falta stateId', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await issuanceController.claimAltaCredential(req, res);
        expect(res.statusCode).toBe(400);
    });

    it('claimAltaCredential éxito', async () => {
        issuanceService.claimAltaCredential.mockResolvedValue({ msg: 'ok' });
        const req = httpMocks.createRequest({ body: { stateId: 'C' } });
        const res = httpMocks.createResponse();
        await issuanceController.claimAltaCredential(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ msg: 'ok' });
    });
});
