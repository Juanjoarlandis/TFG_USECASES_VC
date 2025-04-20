// tests/unit/controllers/userController.spec.js
const httpMocks = require('node-mocks-http');
const userController = require('../../../src/controllers/userController');
const userService = require('../../../src/services/userService');

jest.mock('../../../src/services/userService');

describe('userController.getUserByDni', () => {
    it('400 si falta dni', async () => {
        const req = httpMocks.createRequest({ params: {} });
        const res = httpMocks.createResponse();

        await userController.getUserByDni(req, res, () => { });

        expect(res.statusCode).toBe(400);
    });

    it('404 si usuario no existe', async () => {
        userService.findUserByDni.mockResolvedValue(null);

        const req = httpMocks.createRequest({ params: { dni: 'x' } });
        const res = httpMocks.createResponse();

        await userController.getUserByDni(req, res, () => { });

        expect(res.statusCode).toBe(404);
    });

    it('flujo feliz', async () => {
        const fake = { firstName: 'L' };
        userService.findUserByDni.mockResolvedValue(fake);
        userService.buildUserResponse.mockReturnValue(fake);

        const req = httpMocks.createRequest({ params: { dni: 'y' } });
        const res = httpMocks.createResponse();

        await userController.getUserByDni(req, res, () => { });

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ user: fake });
    });
});
