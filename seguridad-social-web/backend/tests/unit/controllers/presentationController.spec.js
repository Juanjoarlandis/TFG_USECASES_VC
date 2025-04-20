// backend/tests/unit/controllers/presentationController.spec.js
const httpMocks = require('node-mocks-http');
const presentationController = require('../../../src/controllers/presentationController');
const presentationService = require('../../../src/services/presentationService');

jest.mock('../../../src/services/presentationService');

describe('presentationController.resolvePresentationRequest', () => {
    afterEach(() => jest.clearAllMocks());

    it('400 si falta presentationRequestUrl', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await presentationController.resolvePresentationRequest(req, res, () => { });
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Missing presentationRequestUrl' });
    });

    it('200 y devuelve data', async () => {
        presentationService.resolvePresentationRequest.mockResolvedValue({ ok: true });
        const req = httpMocks.createRequest({ body: { presentationRequestUrl: 'url' } });
        const res = httpMocks.createResponse();

        await presentationController.resolvePresentationRequest(req, res, () => { });

        expect(presentationService.resolvePresentationRequest).toHaveBeenCalledWith('url');
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ ok: true });
    });
});

describe('presentationController.matchCredentialsForPresentation', () => {
    afterEach(() => jest.clearAllMocks());

    it('400 si falta presentationDefinition', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await presentationController.matchCredentialsForPresentation(req, res, () => { });
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Missing presentationDefinition' });
    });

    it('200 y devuelve data', async () => {
        const def = { foo: 'bar' };
        presentationService.matchCredentialsForPresentation.mockResolvedValue([1, 2]);
        const req = httpMocks.createRequest({ body: { presentationDefinition: def } });
        const res = httpMocks.createResponse();

        await presentationController.matchCredentialsForPresentation(req, res, () => { });

        expect(presentationService.matchCredentialsForPresentation).toHaveBeenCalledWith(def);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual([1, 2]);
    });
});

describe('presentationController.usePresentationRequest', () => {
    afterEach(() => jest.clearAllMocks());

    it('400 si faltan did, presentationRequest o selectedCredentials', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await presentationController.usePresentationRequest(req, res, () => { });
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Missing did, presentationRequest or selectedCredentials' });
    });

    it('200 y devuelve data', async () => {
        const payload = { did: 'd', presentationRequest: {}, selectedCredentials: [1], disclosures: { x: 1 } };
        presentationService.usePresentationRequest.mockResolvedValue({ sent: true });
        const req = httpMocks.createRequest({ body: payload });
        const res = httpMocks.createResponse();

        await presentationController.usePresentationRequest(req, res, () => { });

        expect(presentationService.usePresentationRequest)
            .toHaveBeenCalledWith('d', payload.presentationRequest, payload.selectedCredentials, payload.disclosures);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ sent: true });
    });
});
