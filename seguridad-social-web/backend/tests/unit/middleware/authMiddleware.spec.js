// tests/unit/middleware/authMiddleware.spec.js
/* eslint-disable import/no-extraneous-dependencies */
const httpMocks = require('node-mocks-http');

// 🗒️ IMPORTA ahora el middleware real (no el service)
const authMiddleware = require('../../../src/middleware/authMiddleware');

jest.mock('../../../src/utils/jwtUtils', () => ({
    verifyAccessToken: jest.fn(),
}));

describe('authMiddleware', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('debe responder 401 si no hay cookie accessToken', () => {
        const req = httpMocks.createRequest({ cookies: {} });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res._getJSONData()).toEqual({ error: 'No token cookie' });
        expect(next).not.toHaveBeenCalled();
    });

    it('debe llamar a next() si accessToken es válido', () => {
        const { verifyAccessToken } = require('../../../src/utils/jwtUtils');
        verifyAccessToken.mockReturnValue({ sub: 'userId' });

        const req = httpMocks.createRequest({
            cookies: { accessToken: 'valid.jwt.token' },
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(verifyAccessToken).toHaveBeenCalledWith('valid.jwt.token');
        expect(res.statusCode).toBe(200); // sigue sin modificarse
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('debe responder 401 si el token es inválido', () => {
        const { verifyAccessToken } = require('../../../src/utils/jwtUtils');
        verifyAccessToken.mockImplementation(() => {
            throw new Error('Token inválido');
        });

        const req = httpMocks.createRequest({
            cookies: { accessToken: 'invalid.jwt.token' },
        });
        const res = httpMocks.createResponse();
        const next = jest.fn();

        authMiddleware(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res._getJSONData()).toEqual({ error: 'Invalid token' });
        expect(next).not.toHaveBeenCalled();
    });
});
