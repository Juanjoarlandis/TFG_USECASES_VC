// backend/tests/unit/services/verificationService.spec.js
const verificationService = require('../../../src/services/verificationService');
const sessionStore = require('../../../src/utils/sessionStore');
const axios = require('axios');

jest.mock('axios');
jest.mock('../../../src/utils/sessionStore');

describe('verificationService.offerVerificationOneCred', () => {
    beforeEach(() => jest.clearAllMocks());

    it('genera la URL de verificación y persiste sesión "pending"', async () => {
        process.env.WALTID_VERIFIER_URL = 'http://walt.id:7003';
        process.env.VERIFIER_COORD_PUBLIC_URL = 'http://backend:3001';

        axios.post.mockResolvedValue({ data: 'http://walt.id/verify?state=xyz' });

        const requestBody = {
            request_credentials: [{ type: 'CustomIdentityCredential', format: 'jwt_vc_json' }],
        };

        const { stateId, verificationUrl } =
            await verificationService.offerVerificationOneCred(requestBody);

        expect(verificationUrl).toBe('http://walt.id/verify?state=xyz');
        expect(typeof stateId).toBe('string');
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(sessionStore.setSession).toHaveBeenCalledWith(
            stateId,
            expect.objectContaining({ status: 'pending', verificationUrl }),
        );
    });
});
