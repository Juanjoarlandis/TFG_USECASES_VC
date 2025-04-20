// backend/tests/unit/services/issuanceService.spec.js
const issuanceService = require('../../../src/services/issuanceService');
const sessionStore = require('../../../src/utils/sessionStore');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const User = require('../../../src/models/User');
const axios = require('axios');

jest.mock('axios');
jest.mock('../../../src/utils/sessionStore');
jest.mock('../../../src/services/HolderSessionManager');
jest.mock('../../../src/models/User');

describe('issuanceService.offerIssuance', () => {
    beforeEach(() => jest.clearAllMocks());

    it('devuelve issuanceOfferUrl y marca sesión "offered"', async () => {
        process.env.VERIFIER_COORD_PUBLIC_URL = 'http://backend:3001';
        process.env.WALTID_ISSUER_URL = 'http://walt.id:7002';
        process.env.WALLET_COORD_URL = 'http://caddy:7001';

        // simulamos usuario ya verificado
        const stateId = 'state-123';
        sessionStore.getSession.mockResolvedValue({
            user: { documentNumber: '12345678A', hasAltaCredential: true },
        });
        axios.post.mockResolvedValue({ data: 'http://walt.id/issue?offer=abc' });
        User.findOne.mockResolvedValue({ save: jest.fn() });

        const { issuanceOfferUrl } = await issuanceService.offerIssuance(stateId);

        expect(issuanceOfferUrl).toBe('http://walt.id/issue?offer=abc');
        expect(sessionStore.setSession).toHaveBeenCalledWith(
            stateId,
            expect.objectContaining({ issuanceStatus: 'offered' }),
        );
    });
});
