// tests/unit/services/verificationService.callbackAlta.spec.js
/* eslint-disable max-lines-per-function */
const verificationService = require(
    '../../../src/services/verificationService',
);
const sessionStore = require('../../../src/utils/sessionStore');
const validations = require('../../../src/utils/validations');
const jwt = require('jsonwebtoken');

jest.mock('../../../src/utils/sessionStore');
jest.mock('../../../src/utils/validations');
jest.mock('jsonwebtoken');

describe('verificationService.handleStatusCallbackAlta', () => {
    const stateId = 'state‑cb‑1';

    // --- Usuario mock reutilizable ---
    const fakeUser = {
        documentNumber: '123',
        firstName: 'Mario',
        save: jest.fn(),               //  ← stub necesario
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Sesión “pending” previa en Redis
        sessionStore.getSession.mockResolvedValue({
            status: 'pending',
            verificationResult: null,
        });
        sessionStore.setSession.mockResolvedValue();

        // Simular decodificación JWT:
        //   – primera llamada: vp_token  → array con 1 VC
        //   – segunda llamada: la VC de identidad decodificada
        jwt.decode
            .mockReturnValueOnce({
                vp: { verifiableCredential: ['cred‑jwt‑1'] },
            })
            .mockReturnValueOnce({
                vc: {
                    type: ['VerifiableCredential', 'CustomIdentityCredential'],
                    credentialSubject: { dni: { identifier: '123' } },
                },
            });

        // Revocación → false
        validations.checkCredentialsRevocation.mockResolvedValue(false);

        // Mapear datos de usuario
        validations.extractUserDataFromDecodedCredentialSubject.mockReturnValue(
            {
                documentNumber: '123',
                firstName: 'Mario',
            },
        );

        // findOrCreate… devuelve el usuario “persistible”
        validations.findOrCreateOrUpdateUser.mockResolvedValue(fakeUser);
    });

    it('marca la sesión como verified y añade user', async () => {
        const payload = {
            verificationResult: true,
            tokenResponse: { vp_token: 'jwt‑fake' },
        };

        await verificationService.handleStatusCallbackAlta(stateId, payload);

        // Se actualizó la sesión con status verified y user
        expect(sessionStore.setSession).toHaveBeenCalledWith(
            stateId,
            expect.objectContaining({
                status: 'verified',
                user: expect.objectContaining({ documentNumber: '123' }),
            }),
        );

        // Se guardó el usuario en Mongo (se llamó a save)
        expect(fakeUser.save).toHaveBeenCalledTimes(1);
    });
});
