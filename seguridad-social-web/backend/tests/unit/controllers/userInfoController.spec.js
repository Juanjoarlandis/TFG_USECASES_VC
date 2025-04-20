// tests/unit/controllers/userInfoController.spec.js
const httpMocks = require('node-mocks-http');
const userInfoController = require('../../../src/controllers/userInfoController');
const userService = require('../../../src/services/userService');

jest.mock('../../../src/services/userService');

describe('userInfoController.getUserInfo', () => {
    afterEach(() => jest.clearAllMocks());

    it('flujo feliz', async () => {
        userService.getHolderUserInfo.mockResolvedValue({ email: 'a@b.com' });

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        await userInfoController.getUserInfo(req, res, () => { });

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ email: 'a@b.com' });
    });

    it('propaga error con status', async () => {
        userService.getHolderUserInfo.mockRejectedValue({ status: 500, message: 'x' });

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        await userInfoController.getUserInfo(req, res, () => { });

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ error: 'x' });
    });
});
