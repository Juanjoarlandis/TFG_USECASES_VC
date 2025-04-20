// tests/unit/services/presentationService.extra.spec.js
const presentationService = require('../../../src/services/presentationService');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const axios = require('axios');

jest.mock('axios');
jest.mock('../../../src/services/HolderSessionManager');

describe('presentationService.resolvePresentationRequest', () => {
    const token = 'tkn'; const walletId = 'w‑1';
    beforeEach(() => {
        HolderSessionManager.getToken.mockResolvedValue(token);
        HolderSessionManager.getWalletId.mockReturnValue(walletId);
    });

    it('hace POST con headers correctos y devuelve data', async () => {
        axios.post.mockResolvedValue({ data: { ok: true } });

        const url = 'openid4vp://auth?foo=bar';
        const out = await presentationService.resolvePresentationRequest(url);

        expect(out).toEqual({ ok: true });
        expect(axios.post).toHaveBeenCalledWith(
            `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/resolvePresentationRequest`,
            url,
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${token}` }) })
        );
    });
});
