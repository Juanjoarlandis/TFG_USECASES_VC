// tests/unit/services/userService.extra.spec.js
const axios = require('axios');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const userService = require('../../../src/services/userService');

jest.mock('axios');
jest.mock('../../../src/services/HolderSessionManager');

describe('userService.getHolderUserInfo', () => {
    beforeEach(() => jest.clearAllMocks());

    it('retorna data del holder', async () => {
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        axios.get.mockResolvedValue({ data: { email: 'u@h.com' } });

        const out = await userService.getHolderUserInfo();
        expect(out).toEqual({ email: 'u@h.com' });
        expect(axios.get).toHaveBeenCalledWith(
            `${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`,
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer tkn' }),
            })
        );
    });

    it('propaga errores de axios', async () => {
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        axios.get.mockRejectedValue(new Error('boom'));
        await expect(userService.getHolderUserInfo()).rejects.toThrow('boom');
    });
});
