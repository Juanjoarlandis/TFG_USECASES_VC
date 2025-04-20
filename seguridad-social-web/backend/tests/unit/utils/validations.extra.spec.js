/**
 * Tests extra para utils/validations.js
 *  · extractUserDataFromDecodedCredentialSubject
 *  · checkCredentialsRevocation
 *  · findOrCreateOrUpdateUser
 */

const jwt = require('jsonwebtoken');

/* ──── Mocks de modelos ──── */
jest.mock('../../../src/models/RevokedCredential', () => ({
    findOne: jest.fn(),
}));

jest.mock('../../../src/models/User', () => {
    const saveMock = jest.fn().mockResolvedValue();
    function UserMock(data) { Object.assign(this, data); }
    UserMock.findOne = jest.fn();
    UserMock.prototype.save = saveMock;
    return UserMock;
});

const RevokedCredential = require('../../../src/models/RevokedCredential');
const User = require('../../../src/models/User');
const validations = require('../../../src/utils/validations');

describe('utils/validations helpers', () => {
    beforeEach(() => jest.clearAllMocks());

    /* ───────────────────────────────────────────────────────────── */
    test('extractUserDataFromDecodedCredentialSubject mapea los campos dni', () => {
        const subject = {
            dni: {
                identifier: '12345678A',
                givenName: 'Mario',
                familyName: 'Bros',
                gender: 'male',
                nationality: 'ES',
                nss: '123456789012',
                photo: 'data:image/png;base64,zzz',
                birthDate: '1990-01-01',
            },
        };

        const out = validations.extractUserDataFromDecodedCredentialSubject(subject);

        expect(out).toMatchObject({
            firstName: 'Mario',
            familyName: 'Bros',
            documentNumber: '12345678A',
            gender: 'male',
            nationality: 'ES',
            nss: '123456789012',
            photo: 'data:image/png;base64,zzz',
        });
        expect(out.birthDate).toBeInstanceOf(Date);
    });

    /* ───────────────────────────────────────────────────────────── */
    describe('checkCredentialsRevocation', () => {
        test('→ false cuando ninguna credencial está revocada', async () => {
            jest.spyOn(jwt, 'decode')
                .mockReturnValueOnce({ jti: 'cred‑1' })
                .mockReturnValueOnce({ jti: 'cred‑2' });
            RevokedCredential.findOne.mockResolvedValue(null);

            const res = await validations.checkCredentialsRevocation(['tkn1', 'tkn2']);
            expect(res).toBe(false);
            expect(RevokedCredential.findOne).toHaveBeenCalledTimes(2);
        });

        test('→ true cuando al menos una está revocada', async () => {
            jest.spyOn(jwt, 'decode')
                .mockReturnValueOnce({ jti: 'cred‑3' })
                .mockReturnValueOnce({ jti: 'cred‑4' });
            RevokedCredential.findOne
                .mockResolvedValueOnce(null)               // cred‑3 ok
                .mockResolvedValueOnce({ credentialId: 'cred‑4' }); // cred‑4 revocada

            const res = await validations.checkCredentialsRevocation(['a', 'b']);
            expect(res).toBe(true);
        });
    });

    /* ───────────────────────────────────────────────────────────── */
    describe('findOrCreateOrUpdateUser', () => {
        test('crea nuevo usuario cuando no existe', async () => {
            User.findOne.mockResolvedValue(null);

            const data = {
                firstName: 'Laura',
                familyName: 'García',
                documentNumber: '87654321B',
                gender: 'female',
                nationality: 'ES',
            };

            const user = await validations.findOrCreateOrUpdateUser(data, 'manual');

            expect(User.findOne).toHaveBeenCalledWith({ documentNumber: '87654321B' });
            expect(User.prototype.save).toHaveBeenCalledTimes(1);
            expect(user.firstName).toBe('Laura');
            expect(user.flow).toBe('manual');
        });

        test('actualiza un usuario existente', async () => {
            const existing = { save: jest.fn(), refreshTokens: [] };
            User.findOne.mockResolvedValue(existing);

            const data = { firstName: 'Ana', familyName: 'López', documentNumber: '123', gender: 'female', nationality: 'ES' };

            const user = await validations.findOrCreateOrUpdateUser(data, 'automatic');

            expect(user).toBe(existing);
            expect(existing.firstName).toBe('Ana');
            expect(existing.flow).toBe('automatic');
            expect(existing.save).toHaveBeenCalledTimes(1);
        });
    });
});
