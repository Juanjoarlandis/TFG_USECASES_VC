// tests/unit/services/issuanceService.errors.spec.js
const issuanceService = require('../../../src/services/issuanceService');
const sessionStore = require('../../../src/utils/sessionStore');

jest.mock('../../../src/utils/sessionStore');

describe('issuanceService.offerIssuance – errores', () => {
    it('404 si la sesión no existe', async () => {
        sessionStore.getSession.mockResolvedValue(null);
        await expect(issuanceService.offerIssuance('state-x'))
            .rejects.toMatchObject({ status: 404 });
    });

    it('400 si el usuario no tiene alta pendiente', async () => {
        sessionStore.getSession.mockResolvedValue({ user: { hasAltaCredential: false } });
        await expect(issuanceService.offerIssuance('state-y'))
            .rejects.toMatchObject({ status: 400 });
    });
});
