// tests/unit/services/issuanceService.claim.spec.js
/* eslint-disable max-lines-per-function */
const issuanceService = require('../../../src/services/issuanceService');
const sessionStore = require('../../../src/utils/sessionStore');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const walletService = require('../../../src/services/walletService');
const axios = require('axios');

jest.mock('../../../src/utils/sessionStore');
jest.mock('../../../src/services/HolderSessionManager');
jest.mock('../../../src/services/walletService');
jest.mock('axios');

describe('issuanceService.claimAltaCredential', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.WALLET_COORD_URL = 'http://caddy:7001';
    });

    it('reclama la credencial y marca sesión «claimed»', async () => {
        /* ---------- Arrange ---------- */
        const stateId = 'state-claim-1';
        sessionStore.getSession.mockResolvedValue({
            issuanceOfferUrl: 'http://walt.id/issue?offer=abc',
        });

        HolderSessionManager.getToken.mockResolvedValue('tkn');
        HolderSessionManager.getWalletId.mockReturnValue('w-123');

        walletService.listDIDs.mockResolvedValue([{ did: 'did:key:abc' }]);

        axios.post.mockResolvedValue({ data: { ok: true } });

        /* ---------- Act ---------- */
        const out = await issuanceService.claimAltaCredential(stateId);

        /* ---------- Assert ---------- */
        expect(out).toEqual({
            message: 'Credencial de Alta reclamada con éxito',
            claimedCredentials: { ok: true },
        });

        // URL generada correctamente
        const calledUrl = axios.post.mock.calls[0][0];
        expect(calledUrl).toMatch(
            /\/wallet\/w-123\/exchange\/useOfferRequest\?did=did%3Akey%3Aabc&requireUserInput=false$/,
        );

        // Sesión actualizada
        expect(sessionStore.setSession).toHaveBeenCalledWith(
            stateId,
            expect.objectContaining({ issuanceStatus: 'claimed' }),
        );
    });

    it('lanza 400 si no hay issuanceOfferUrl', async () => {
        sessionStore.getSession.mockResolvedValue({}); // sin URL

        await expect(
            issuanceService.claimAltaCredential('state-no-url'),
        ).rejects.toMatchObject({ status: 400 });
    });
});
