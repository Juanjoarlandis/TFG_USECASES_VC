// tests/unit/services/offerService.spec.js
const offerService = require('../../../src/services/offerService');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const axios = require('axios');

jest.mock('../../../src/services/HolderSessionManager');
jest.mock('axios');

describe('offerService.useCredentialOffer', () => {
    const token = 'tkn';
    const walletId = 'w‑123';
    process.env.WALLET_COORD_URL = 'http://caddy:7001';

    beforeEach(() => {
        jest.clearAllMocks();
        HolderSessionManager.getToken.mockResolvedValue(token);
        HolderSessionManager.getWalletId.mockReturnValue(walletId);
    });

    it('400 si falta offerUrl o did', async () => {
        await expect(offerService.useCredentialOffer(null, 'did')).rejects
            .toMatchObject({ status: 400 });
        await expect(offerService.useCredentialOffer('url', null)).rejects
            .toMatchObject({ status: 400 });
    });

    it('flujo feliz', async () => {
        axios.post.mockResolvedValue({ data: { stored: true } });

        const out = await offerService.useCredentialOffer('url', 'did:key:abc');

        expect(out).toEqual({ stored: true });
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/exchange/useOfferRequest'),
            'url',
            expect.any(Object),
        );
    });

    it('propaga error de axios', async () => {
        axios.post.mockRejectedValue(new Error('boom'));

        await expect(
            offerService.useCredentialOffer('url', 'did:key:abc'),
        ).rejects.toThrow('boom');
    });
});
