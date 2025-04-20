/**
 * Cobertura para el flujo feliz y error 400 en controllers/issuanceController.js
 */
const httpMocks = require('node-mocks-http');

jest.mock('../../../src/services/issuanceService', () => ({
    offerIssuance: jest.fn(),
}));
const issuanceService = require('../../../src/services/issuanceService');
const issuanceController = require('../../../src/controllers/issuanceController');

describe('issuanceController.offerIssuance', () => {
    test('responde 400 si falta stateId', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await issuanceController.offerIssuance(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Missing stateId' });
        expect(issuanceService.offerIssuance).not.toHaveBeenCalled();
    });

    test('delegación correcta al service y 200 OK', async () => {
        issuanceService.offerIssuance.mockResolvedValue({
            issuanceOfferUrl: 'http://walt.id/issue?offer=abc',
            state: 'state‑1',
        });

        const req = httpMocks.createRequest({ body: { stateId: 'state‑1' } });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await issuanceController.offerIssuance(req, res, next);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({
            issuanceOfferUrl: 'http://walt.id/issue?offer=abc',
            state: 'state‑1',
        });
        expect(issuanceService.offerIssuance).toHaveBeenCalledWith('state‑1');
    });
});
