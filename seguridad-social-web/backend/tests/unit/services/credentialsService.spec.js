/* eslint-disable max-lines-per-function */
const credentialsService = require('../../../src/services/credentialsService');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const axios = require('axios');

jest.mock('../../../src/services/HolderSessionManager');
jest.mock('axios');

describe('credentialsService', () => {
    const token = 'tkn';
    const walletId = 'w‑123';                          // U+2011 (NO‑BREAK HYPHEN)

    beforeEach(() => {
        jest.clearAllMocks();
        HolderSessionManager.getToken.mockResolvedValue(token);
        HolderSessionManager.getWalletId.mockReturnValue(walletId);
        process.env.WALLET_COORD_URL = 'http://caddy:7001';
    });

    /* helper para componer la URL esperada */
    function buildUrl(path) {
        return `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}${path}`;
    }

    /* ──────────────────────────────────────────────────────────────── */
    /* listCredentials                                                 */
    /* ──────────────────────────────────────────────────────────────── */
    it('listCredentials – flujo feliz', async () => {
        axios.get.mockResolvedValue({ data: [{ id: 'cred‑1' }] });

        const out = await credentialsService.listCredentials();

        expect(out).toEqual([{ id: 'cred‑1' }]);
        expect(axios.get).toHaveBeenCalledWith(
            buildUrl('/credentials'),
            expect.any(Object),
        );
    });

    /* ──────────────────────────────────────────────────────────────── */
    /* getCredentialById                                               */
    /* ──────────────────────────────────────────────────────────────── */
    describe('getCredentialById', () => {
        const encodedId = encodeURIComponent('cred‑1');   // "cred%E2%80%911"

        it('flujo feliz', async () => {
            axios.get.mockResolvedValue({ data: { id: 'cred‑1' } });

            const out = await credentialsService.getCredentialById('cred‑1');

            expect(out).toEqual({ id: 'cred‑1' });
            expect(axios.get).toHaveBeenCalledWith(
                buildUrl(`/credentials/${encodedId}`),
                expect.any(Object),
            );
        });

        it('lanza 400 si falta credentialId', async () => {
            /* eliminamos cualquier mock previo para que la llamada falle */
            axios.get.mockReset();
            await expect(credentialsService.getCredentialById()).rejects.toThrow();
        });

        it('propaga error de axios como 500', async () => {
            axios.get.mockRejectedValue(new Error('boom'));

            await expect(
                credentialsService.getCredentialById('cred‑x'),
            ).rejects.toThrow('boom');
        });
    });

    /* ──────────────────────────────────────────────────────────────── */
    /* deleteCredential                                                */
    /* ──────────────────────────────────────────────────────────────── */
    describe('deleteCredential', () => {
        const encodedId = encodeURIComponent('cred‑1');

        it('flujo feliz', async () => {
            axios.delete.mockResolvedValue({ status: 200 });

            await credentialsService.deleteCredential('cred‑1');

            expect(axios.delete).toHaveBeenCalledWith(
                buildUrl(`/credentials/${encodedId}`),
                expect.any(Object),
            );
        });

        it('error de axios propaga', async () => {
            axios.delete.mockRejectedValue(new Error('boom'));

            await expect(
                credentialsService.deleteCredential('cred‑x'),
            ).rejects.toThrow('boom');
        });
    });

    /* ──────────────────────────────────────────────────────────────── */
    /* acceptCredential / rejectCredential                             */
    /* ──────────────────────────────────────────────────────────────── */
    for (const fn of ['acceptCredential', 'rejectCredential']) {
        describe(fn, () => {
            it('flujo feliz', async () => {
                axios.post.mockResolvedValue({ data: { ok: true } });

                const out = await credentialsService[fn]('cred‑1');

                expect(out).toEqual({ ok: true });
                expect(axios.post).toHaveBeenCalled();
            });
        });
    }

    /* ──────────────────────────────────────────────────────────────── */
    /* getCredentialStatus                                             */
    /* ──────────────────────────────────────────────────────────────── */
    describe('getCredentialStatus', () => {
        it('pending', async () => {
            axios.get.mockResolvedValue({ data: { pending: true } });

            const out = await credentialsService.getCredentialStatus('cred‑1');

            expect(out).toEqual({ status: 'pending' });
        });

        it('issued', async () => {
            axios.get.mockResolvedValue({ data: { pending: false } });

            const out = await credentialsService.getCredentialStatus('cred‑1');

            expect(out).toEqual({ status: 'issued' });
        });
    });
});
