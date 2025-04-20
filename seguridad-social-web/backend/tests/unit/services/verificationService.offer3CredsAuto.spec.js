// tests/unit/services/verificationService.offer3CredsAuto.spec.js
const axios = require('axios');
const sessionStore = require('../../../src/utils/sessionStore');
const uuid = require('uuid');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest,
    getOrSelectDidSomewhere
} = require('../../../src/services/presentationService');

jest.mock('axios');
jest.mock('uuid');
jest.mock('../../../src/utils/sessionStore');
jest.mock('../../../src/services/presentationService');

const verificationService = require('../../../src/services/verificationService');

describe('verificationService.offerVerification3CredsAutomatic', () => {
    const fixedState = 'fixed-uuid';
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.WALTID_VERIFIER_URL = 'http://walt.id';
        process.env.VERIFIER_COORD_PUBLIC_URL = 'http://backend';
        process.env.ISS_COORD_URL = 'http://iss.coord';
        uuid.v4.mockReturnValue(fixedState);
        // Simular sesión tras createOid4vc
        sessionStore.getSession.mockResolvedValue({ status: 'pending', verificationUrl: 'url', expiresAt: Date.now() + 60000 });
        sessionStore.setSession.mockResolvedValue();
    });

    it('flujo feliz: devuelve message, state y verificationUrl', async () => {
        axios.get.mockResolvedValue({ data: { issuers: ['i1', 'i2', 'i3'] } });
        axios.post.mockResolvedValue({ data: 'http://walt.id/verify?state=abc' });
        resolvePresentationRequest.mockResolvedValue({ presentation_definition: {} });
        matchCredentialsForPresentation.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }]);
        getOrSelectDidSomewhere.mockResolvedValue('did:key:xyz');
        usePresentationRequest.mockResolvedValue({ ok: true });

        const out = await verificationService.offerVerification3CredsAutomatic();
        expect(out).toEqual({
            message: 'Verificación de 3 credenciales (alta automática) iniciada. Revisa callback.',
            state: fixedState,
            verificationUrl: 'http://walt.id/verify?state=abc'
        });

        // Aseguramos que se usaron los servicios internos
        expect(resolvePresentationRequest).toHaveBeenCalledWith('http://walt.id/verify?state=abc');
        expect(matchCredentialsForPresentation).toHaveBeenCalled();
        expect(getOrSelectDidSomewhere).toHaveBeenCalled();
        expect(usePresentationRequest).toHaveBeenCalled();
    });

    it('lanza 400 si no hay 3 credenciales coincidentes', async () => {
        axios.get.mockResolvedValue({ data: { issuers: ['i1', 'i2', 'i3'] } });
        axios.post.mockResolvedValue({ data: 'url' });
        resolvePresentationRequest.mockResolvedValue({ presentation_definition: {} });
        matchCredentialsForPresentation.mockResolvedValue([{ id: 'only‑one' }]);

        await expect(
            verificationService.offerVerification3CredsAutomatic()
        ).rejects.toMatchObject({ status: 400, message: 'No matching 3 credentials en la wallet' });
    });
});
