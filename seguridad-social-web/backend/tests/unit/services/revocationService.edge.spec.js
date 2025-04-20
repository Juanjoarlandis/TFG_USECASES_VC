// tests/unit/services/revocationService.edge.spec.js
const revocationService = require('../../../src/services/revocationService');
const User = require('../../../src/models/User');
const RevokedCredential = require('../../../src/models/RevokedCredential');
const axios = require('axios');

jest.mock('../../../src/models/User');
jest.mock('../../../src/models/RevokedCredential');   // ← mock añadido
jest.mock('axios');

describe('revocationService – casos límite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Evita que la llamada a RevokedCredential cree conexiones reales
        RevokedCredential.create.mockResolvedValue({});
    });

    it('revoca aunque NO haya altaCredentialJti', async () => {
        User.findOne.mockResolvedValue({
            save: jest.fn(),
            hasAltaCredential: true,
            altaCredentialData: null,
            altaCredentialJti: null,        // no JTI
        });

        const out = await revocationService.revokeCredential('1111');

        expect(out.message).toMatch(/Credencial revocada/);
        expect(axios.delete).not.toHaveBeenCalled();      // no DELETE a la wallet
        expect(RevokedCredential.create).not.toHaveBeenCalled(); // tampoco lista negra
    });

    it('logea error si axios.delete falla pero no lanza', async () => {
        User.findOne.mockResolvedValue({
            save: jest.fn(),
            hasAltaCredential: true,
            altaCredentialData: { id: 'cred-1' },
            altaCredentialJti: 'jti-1',
        });

        axios.delete.mockRejectedValue(new Error('boom'));

        const out = await revocationService.revokeCredential('2222');

        expect(out.user.hasAltaCredential).toBe(false);   // se marcó como revocada
        expect(RevokedCredential.create).toHaveBeenCalledWith({ credentialId: 'jti-1' });
    });
});
