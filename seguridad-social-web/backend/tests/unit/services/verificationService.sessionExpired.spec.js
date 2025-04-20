// tests/unit/services/verificationService.sessionExpired.spec.js
const verificationService = require('../../../src/services/verificationService');
const sessionStore = require('../../../src/utils/sessionStore');

jest.mock('../../../src/utils/sessionStore');

describe('verificationService.getVerificationSession – expiración', () => {
    it('marca la sesión como expired cuando ha pasado el ttl', async () => {
        const stateId = 'state-expired-1';
        sessionStore.getSession.mockResolvedValue({
            status: 'pending',
            expiresAt: Date.now() - 10,   // caducada
        });
        sessionStore.setSession.mockResolvedValue();

        const res = await verificationService.getVerificationSession(stateId);

        expect(res.status).toBe('expired');
        expect(sessionStore.setSession)
            .toHaveBeenCalledWith(stateId, expect.objectContaining({ status: 'expired' }));
    });
});
