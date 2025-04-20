// tests/unit/controllers/offerController.spec.js
const httpMocks = require('node-mocks-http');
const offerController = require('../../../src/controllers/offerController');
const offerService = require('../../../src/services/offerService');

jest.mock('../../../src/services/offerService');

describe('offerController.useCredentialOffer', () => {
    it('400 si falta datos', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await offerController.useCredentialOffer(req, res, () => { });
        expect(res.statusCode).toBe(400);
    });

    it('flujo feliz', async () => {
        offerService.useCredentialOffer.mockResolvedValue({ ok: true });

        const req = httpMocks.createRequest({
            body: { offerUrl: 'u', did: 'did' },
        });
        const res = httpMocks.createResponse();

        await offerController.useCredentialOffer(req, res, () => { });

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ ok: true });
    });
});
