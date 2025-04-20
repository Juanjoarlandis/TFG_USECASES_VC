// backend/tests/unit/controllers/revocationController.spec.js
const httpMocks = require('node-mocks-http');
const revocationController = require('../../../src/controllers/revocationController');
const revocationService = require('../../../src/services/revocationService');

jest.mock('../../../src/services/revocationService');

describe('revocationController.revokeCredential', () => {
    afterEach(() => jest.clearAllMocks());

    it('400 si falta dni', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        await revocationController.revokeCredential(req, res, () => { });
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Missing dni' });
    });

    it('200 y devuelve result', async () => {
        const fake = { message: 'revoked', user: { id: 'u1' } };
        revocationService.revokeCredential.mockResolvedValue(fake);

        const req = httpMocks.createRequest({ body: { dni: '1234' } });
        const res = httpMocks.createResponse();

        await revocationController.revokeCredential(req, res, () => { });

        expect(revocationService.revokeCredential).toHaveBeenCalledWith('1234');
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(fake);
    });

    it('propaga error con status', async () => {
        const err = { status: 404, message: 'No user' };
        revocationService.revokeCredential.mockRejectedValue(err);

        const req = httpMocks.createRequest({ body: { dni: 'x' } });
        const res = httpMocks.createResponse();

        await revocationController.revokeCredential(req, res, () => { });

        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({ error: 'No user' });
    });
});
