const HolderSessionManager = require(
    '../../../src/services/HolderSessionManager',
);
const axios = require('axios');

jest.mock('axios');

describe('HolderSessionManager', () => {
    const fakeJwt =
        // header {"alg":"none"}      payload {"exp":4102444800}
        'eyJhbGciOiJub25lIn0.'
        + 'eyJleHAiIjo0MTAyNDQ0ODAwfQ.'
        + ''; // firma vacía ⇒ solo queremos decodificar

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();          // ← habilitamos fake timers
        // “reset” estado singleton
        HolderSessionManager.token = null;
        HolderSessionManager.tokenExpiry = null;
        HolderSessionManager.walletId = null;
        HolderSessionManager.accountId = null;
    });

    it('almacena token + walletId y los renueva si expiran', async () => {
        /* ────── mocks axios ────── */
        axios.post
            // login inicial
            .mockResolvedValueOnce({ data: { token: fakeJwt } })
            // login de renovación
            .mockResolvedValueOnce({ data: { token: fakeJwt } });

        axios.get.mockResolvedValue({
            data: { account: 'acc‑1', wallets: [{ id: 'w‑123' }] },
        });

        /* ────── login normal ────── */
        await HolderSessionManager.loginHolderWithCredentials(
            'mail@test.com',
            '1234',
        );
        expect(await HolderSessionManager.getToken()).toBe(fakeJwt);
        expect(HolderSessionManager.getWalletId()).toBe('w‑123');

        /* ────── forzamos caducidad ────── */
        HolderSessionManager.tokenExpiry = Date.now() - 1; // ya caducó
        const renewed = await HolderSessionManager.getToken();
        expect(renewed).toBe(fakeJwt);

        expect(axios.post).toHaveBeenCalledTimes(2);  // login + refresh
        expect(axios.get).toHaveBeenCalledTimes(2);   // wallets × 2
    });
});
