// backend/tests/unit/controllers/authController.spec.js
const httpMocks = require('node-mocks-http');
const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');

jest.mock('../../../src/services/authService');

describe('authController.walletLogin', () => {
    afterEach(() => jest.clearAllMocks());

    it('responde 400 si faltan email o password', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.walletLogin(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Email and password are required' });
        expect(authService.loginAndVerifyIdentityCredential).not.toHaveBeenCalled();
    });

    it('flujo feliz: delega a authService y responde 200', async () => {
        const fakeResult = { message: 'ok', state: 's1', verificationUrl: 'url' };
        authService.loginAndVerifyIdentityCredential.mockResolvedValue(fakeResult);

        const req = httpMocks.createRequest({ body: { email: 'a@b.com', password: 'pwd' } });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.walletLogin(req, res, next);

        expect(authService.loginAndVerifyIdentityCredential).toHaveBeenCalledWith('a@b.com', 'pwd');
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(fakeResult);
    });

    it('propaga error con status definido', async () => {
        const error = { status: 401, message: 'Invalid creds' };
        authService.loginAndVerifyIdentityCredential.mockRejectedValue(error);

        const req = httpMocks.createRequest({ body: { email: 'a', password: 'b' } });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.walletLogin(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res._getJSONData()).toEqual({ error: 'Invalid creds' });
    });
});

describe('authController.refresh', () => {
    afterEach(() => jest.clearAllMocks());

    it('responde 400 si falta refreshToken', async () => {
        const req = httpMocks.createRequest({ body: {} });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.refresh(req, res, next);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'No refresh token provided' });
    });

    it('flujo feliz: delega a authService.refreshTokens y responde 200', async () => {
        const fakeTokens = { accessToken: 'a', refreshToken: 'b' };
        authService.refreshTokens.mockResolvedValue(fakeTokens);

        const req = httpMocks.createRequest({ body: { refreshToken: 'old' } });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.refresh(req, res, next);

        expect(authService.refreshTokens).toHaveBeenCalledWith('old');
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(fakeTokens);
    });

    it('propaga error con status definido', async () => {
        const error = { status: 403, message: 'Expired' };
        authService.refreshTokens.mockRejectedValue(error);

        const req = httpMocks.createRequest({ body: { refreshToken: 'x' } });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        await authController.refresh(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res._getJSONData()).toEqual({ error: 'Expired' });
    });
});
