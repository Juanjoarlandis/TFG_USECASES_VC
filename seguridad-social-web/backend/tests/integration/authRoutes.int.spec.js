// backend/tests/integration/authRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/authRoutes');
const authService = require('../../src/services/authService');

jest.mock('../../src/services/authService');

let app;
beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
});

afterEach(() => jest.clearAllMocks());

describe('POST /auth/wallet-login', () => {
    it('400 si faltan campos', async () => {
        await request(app).post('/auth/wallet-login').send({}).expect(400);
    });

    it('200 con resultado de servicio', async () => {
        const fake = { message: 'ok' };
        authService.loginAndVerifyIdentityCredential.mockResolvedValue(fake);
        const res = await request(app)
            .post('/auth/wallet-login')
            .send({ email: 'a', password: 'b' })
            .expect(200);
        expect(res.body).toEqual(fake);
    });
});

describe('POST /auth/refresh', () => {
    it('400 si falta refreshToken', async () => {
        await request(app).post('/auth/refresh').send({}).expect(400);
    });

    it('200 con new tokens', async () => {
        const tokens = { accessToken: 'a', refreshToken: 'b' };
        authService.refreshTokens.mockResolvedValue(tokens);
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: 'old' })
            .expect(200);
        expect(res.body).toEqual(tokens);
    });
});
