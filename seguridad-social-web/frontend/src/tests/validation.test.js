import { userSchema } from '../utils/validation';

describe('userSchema', () => {
    it('acepta datos válidos', () => {
        const data = {
            firstName: 'Ada',
            familyName: 'Lovelace',
            documentNumber: '12345678Z',
            currentAddress: ['C/ Inventores 1']
        };
        expect(userSchema.safeParse(data).success).toBe(true);
    });

    it('rechaza campos obligatorios vacíos', () => {
        const bad = { firstName: '', familyName: '', documentNumber: '' };
        const res = userSchema.safeParse(bad);
        expect(res.success).toBe(false);
        expect(res.error.issues).toHaveLength(3);
    });
});
