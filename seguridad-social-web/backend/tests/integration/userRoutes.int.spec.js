// backend/tests/integration/userRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const userRoutes = require('../../src/routes/userRoutes');
const userService = require('../../src/services/userService');

jest.mock('../../src/services/userService');

let app;
beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/user', userRoutes);
});

afterEach(() => jest.clearAllMocks());

describe('GET /user/:dni', () => {
    it('400 si falta dni', async () => {
        await request(app).get('/user/').expect(404); // ruta no coincide
    });

    it('404 si userService devuelve null', async () => {
        userService.findUserByDni.mockResolvedValue(null);
        await request(app).get('/user/9999').expect(404);
    });

    it('200 con user', async () => {
        const fake = { firstName: 'L' };
        userService.findUserByDni.mockResolvedValue(fake);
        userService.buildUserResponse.mockReturnValue(fake);
        const res = await request(app).get('/user/1234').expect(200);
        expect(res.body).toEqual({ user: fake });
    });
});
