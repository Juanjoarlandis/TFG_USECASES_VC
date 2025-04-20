// tests/unit/services/presentationService.matchUse.spec.js
const presentationService = require('../../../src/services/presentationService');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const axios = require('axios');

jest.mock('../../../src/services/HolderSessionManager');
jest.mock('axios');

describe('presentationService – match & use', () => {
    const token = 'tkn'; const walletId = 'w-123';
    beforeEach(() => {
        jest.clearAllMocks();
        HolderSessionManager.getToken.mockResolvedValue(token);
        HolderSessionManager.getWalletId.mockReturnValue(walletId);
        process.env.WALLET_COORD_URL = 'http://caddy:7001';
    });

    it('matchCredentialsForPresentation construye la URL correcta', async () => {
        const presDef = { input_descriptors: [] };
        axios.post.mockResolvedValue({ data: ['cred‑1'] });

        const data = await presentationService.matchCredentialsForPresentation(
            presDef,
        );

        expect(data).toEqual(['cred‑1']);
        expect(axios.post).toHaveBeenCalledWith(
            'http://caddy:7001/wallet-api/wallet/w-123/exchange/matchCredentialsForPresentationDefinition',
            presDef,
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
            }),
        );
    });

    it('usePresentationRequest devuelve la data y pasa disclosures opcional', async () => {
        const did = 'did:key:abc';
        const presReq = { foo: 'bar' };
        const creds = ['cred‑1'];
        const disclosures = { x: 1 };

        axios.post.mockResolvedValue({ data: { sent: true } });

        const data = await presentationService.usePresentationRequest(
            did,
            presReq,
            creds,
            disclosures,
        );

        expect(data).toEqual({ sent: true });
        const [[url, body]] = axios.post.mock.calls;
        expect(url).toMatch(/\/exchange\/usePresentationRequest$/);
        expect(body.disclosures).toEqual(disclosures);
    });
});
