// tests/unit/services/verificationService.offer3Creds.spec.js
const verificationService = require('../../../src/services/verificationService');
const axios = require('axios');
const sessionStore = require('../../../src/utils/sessionStore');
const { v4: uuidv4 } = require('uuid');

jest.mock('axios');
jest.mock('../../../src/utils/sessionStore');
jest.mock('uuid');

describe('verificationService.offerVerification3CredsManual', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.WALTID_VERIFIER_URL = 'http://walt.id:7003';
        process.env.VERIFIER_COORD_PUBLIC_URL = 'http://backend:3001';
        process.env.ISS_COORD_URL = 'http://issuer_coord:5500';

        // ─── Sembramos una sesión “dummy” para que sessionStore.getSession NO devuelva undefined ───
        sessionStore.getSession.mockResolvedValue({
            status: 'pending',
            verificationUrl: 'placeholder',
            expiresAt: Date.now() + 60_000,
        });
    });

    it('devuelve stateId + verificationUrl y persiste sesión', async () => {
        /* ---------- Arrange ---------- */
        uuidv4.mockReturnValue('uuid-fixed');
        axios.get.mockResolvedValue({
            data: { issuers: ['did:web:iss1', 'did:web:iss2', 'did:web:iss3'] },
        });
        axios.post.mockResolvedValue({
            data: 'http://walt.id/verify?state=abc',
        });

        /* ---------- Act ---------- */
        const { stateId, verificationUrl } =
            await verificationService.offerVerification3CredsManual();

        /* ---------- Assert ---------- */
        expect(stateId).toBe('uuid-fixed');
        expect(verificationUrl).toBe('http://walt.id/verify?state=abc');

        // Se guardó la sesión ‘pending’ y tipo ‘alta’
        expect(sessionStore.setSession).toHaveBeenCalledWith(
            'uuid-fixed',
            expect.objectContaining({ status: 'pending', type: 'alta' }),
        );

        // Axios POST a Walt.id recibió cabecera statusCallbackUri con stateId
        const [, , cfg] = axios.post.mock.calls[0];
        expect(cfg.headers.statusCallbackUri).toContain('uuid-fixed');
    });
});
