// tests/unit/services/userService.spec.js
const userService = require('../../../src/services/userService');
const User = require('../../../src/models/User');

jest.mock('../../../src/models/User');

describe('userService', () => {
    afterEach(() => jest.clearAllMocks());

    describe('findUserByDni', () => {
        it('devuelve el usuario cuando existe', async () => {
            const fake = { documentNumber: '1234' };
            User.findOne.mockResolvedValue(fake);

            const out = await userService.findUserByDni('1234');

            expect(out).toBe(fake);
            expect(User.findOne).toHaveBeenCalledWith({ documentNumber: '1234' });
        });

        it('devuelve null cuando NO existe', async () => {
            User.findOne.mockResolvedValue(null);

            const out = await userService.findUserByDni('9999');

            expect(out).toBeNull();
        });
    });

    describe('buildUserResponse', () => {
        it('mapea todos los campos correctamente', () => {
            const inUser = {
                firstName: 'Mario',
                familyName: 'Bros',
                documentNumber: '12345678A',
                gender: 'male',
                nationality: 'ES',
                birthDate: new Date('1990-01-01'),
                nss: '123456789012',
                photo: 'data:image/png;base64,zzz',
                hasAltaCredential: true,
                altaIssueDate: new Date(),
                altaCredentialData: { id: 'cred‑1' },
                flow: 'manual',
            };

            const out = userService.buildUserResponse(inUser);

            expect(out).toEqual({
                firstName: 'Mario',
                familyName: 'Bros',
                documentNumber: '12345678A',
                gender: 'male',
                nationality: 'ES',
                birthDate: inUser.birthDate,
                nss: '123456789012',
                photo: 'data:image/png;base64,zzz',
                hasAltaCredential: true,
                altaIssueDate: inUser.altaIssueDate,
                altaCredentialData: { id: 'cred‑1' },
                flow: 'manual',
            });
        });
    });
});
