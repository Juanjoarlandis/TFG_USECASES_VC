// tests/unit/services/verificationService.env.spec.js
const verificationService = require('../../../src/services/verificationService');

describe('verificationService.offerVerificationOneCred – env faltante', () => {
    const old = process.env.WALTID_VERIFIER_URL;
    beforeAll(() => { delete process.env.WALTID_VERIFIER_URL; });
    afterAll(() => { process.env.WALTID_VERIFIER_URL = old; });

    it('lanza error si falta WALTID_VERIFIER_URL', async () => {
        await expect(
            verificationService.offerVerificationOneCred({ request_credentials: [] })
        ).rejects.toThrow(/Faltan variables de entorno/);
    });
});
