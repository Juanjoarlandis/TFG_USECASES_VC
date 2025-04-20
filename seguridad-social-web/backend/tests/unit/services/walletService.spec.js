/**
 * Tests unitarios para services/walletService.js
 */
process.env.WALLET_COORD_URL = 'http://caddy:7001';

jest.mock('axios');
const axios = require('axios');
const walletService = require('../../../src/services/walletService');

describe('walletService', () => {
    const token = 'tkn';
    const walletId = 'w‑123';

    beforeEach(() => jest.clearAllMocks());

    test('getUserInfo hace GET a /auth/user-info con Authorization', async () => {
        axios.get.mockResolvedValue({ data: { email: 'holder@example.com' } });

        const out = await walletService.getUserInfo(token);

        expect(out).toEqual({ email: 'holder@example.com' });
        expect(axios.get).toHaveBeenCalledWith(
            'http://caddy:7001/wallet-api/auth/user-info',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
            }),
        );
    });

    test('listDIDs hace GET a /dids', async () => {
        axios.get.mockResolvedValue({ data: [{ did: 'did:key:abc' }] });

        const out = await walletService.listDIDs(token, walletId);

        expect(out).toEqual([{ did: 'did:key:abc' }]);
        expect(axios.get).toHaveBeenCalledWith(
            `http://caddy:7001/wallet-api/wallet/${walletId}/dids`,
            expect.any(Object),
        );
    });

    test('listCredentials hace GET a /credentials?sortBy=addedOn', async () => {
        axios.get.mockResolvedValue({ data: [{ id: 'cred‑1' }] });

        const out = await walletService.listCredentials(token, walletId);

        expect(out).toEqual([{ id: 'cred‑1' }]);
        expect(axios.get).toHaveBeenCalledWith(
            `http://caddy:7001/wallet-api/wallet/${walletId}/credentials?sortBy=addedOn`,
            expect.any(Object),
        );
    });
});
