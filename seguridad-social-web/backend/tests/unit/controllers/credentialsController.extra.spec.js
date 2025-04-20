// tests/unit/controllers/credentialsController.extra.spec.js
const httpMocks = require('node-mocks-http');
const credentialsController = require('../../../src/controllers/credentialsController');
const credentialsService = require('../../../src/services/credentialsService');

jest.mock('../../../src/services/credentialsService');

describe('credentialsController ramas faltantes', () => {
    afterEach(() => jest.clearAllMocks());

    it('acceptCredential 400 si falta id', async () => {
        const req = httpMocks.createRequest({ params: {} });
        const res = httpMocks.createResponse();
        await credentialsController.acceptCredential(req, res);
        expect(res.statusCode).toBe(400);
    });

    it('acceptCredential éxito', async () => {
        credentialsService.acceptCredential.mockResolvedValue({ ok: true });
        const req = httpMocks.createRequest({ params: { id: '1' } });
        const res = httpMocks.createResponse();
        await credentialsController.acceptCredential(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ ok: true });
    });

    it('rejectCredential 400 si falta id', async () => {
        const req = httpMocks.createRequest({ params: {} });
        const res = httpMocks.createResponse();
        await credentialsController.rejectCredential(req, res);
        expect(res.statusCode).toBe(400);
    });

    it('rejectCredential éxito', async () => {
        credentialsService.rejectCredential.mockResolvedValue({ ok: false });
        const req = httpMocks.createRequest({ params: { id: '2' } });
        const res = httpMocks.createResponse();
        await credentialsController.rejectCredential(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ ok: false });
    });

    it('getCredentialStatus 400 si falta id', async () => {
        const req = httpMocks.createRequest({ params: {} });
        const res = httpMocks.createResponse();
        await credentialsController.getCredentialStatus(req, res);
        expect(res.statusCode).toBe(400);
    });

    it('getCredentialStatus éxito', async () => {
        credentialsService.getCredentialStatus.mockResolvedValue({ status: 'issued' });
        const req = httpMocks.createRequest({ params: { id: '3' } });
        const res = httpMocks.createResponse();
        await credentialsController.getCredentialStatus(req, res);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ status: 'issued' });
    });
});
