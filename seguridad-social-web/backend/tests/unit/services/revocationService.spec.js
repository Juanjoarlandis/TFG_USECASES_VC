/* eslint-disable max-lines-per-function */
const revocationService = require('../../../src/services/revocationService');
const User = require('../../../src/models/User');
const RevokedCredential = require('../../../src/models/RevokedCredential');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const axios = require('axios');

jest.mock('../../../src/models/User');
jest.mock('../../../src/models/RevokedCredential');
jest.mock('../../../src/services/HolderSessionManager');
jest.mock('axios');

describe('revocationService.revokeCredential', () => {
    beforeEach(() => jest.clearAllMocks());

    it('❶ lanza 404 cuando no hay usuario', async () => {
        User.findOne.mockResolvedValue(null);

        await expect(revocationService.revokeCredential('9999'))
            .rejects.toMatchObject({ status: 404 });

        expect(User.findOne).toHaveBeenCalledWith({ documentNumber: '9999' });
        expect(RevokedCredential.create).not.toHaveBeenCalled();
    });

    it('❷ revoca credencial y hace DELETE en la wallet', async () => {
        /* --- usuario ficticio con credencial --- */
        const fakeUser = {
            save: jest.fn(),
            documentNumber: '1234',
            hasAltaCredential: true,
            altaCredentialJti: 'jti‑123',
            altaCredentialData: { id: 'cred‑UUID‑1' },
            altaIssueDate: new Date(),
        };
        User.findOne.mockResolvedValue(fakeUser);

        /* --- mocks auxiliares --- */
        RevokedCredential.create.mockResolvedValue({});
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        HolderSessionManager.getWalletId.mockReturnValue('w‑1');
        axios.delete.mockResolvedValue({ status: 200 });

        const out = await revocationService.revokeCredential('1234');

        /* --- asertos --- */
        expect(out).toHaveProperty('message');
        expect(RevokedCredential.create)
            .toHaveBeenCalledWith({ credentialId: 'jti‑123' });
        expect(axios.delete).toHaveBeenCalledWith(
            expect.stringContaining('/wallet/w‑1/credentials/cred‑UUID‑1'),
            expect.objectContaining({ headers: expect.any(Object) }),
        );
    });
});
