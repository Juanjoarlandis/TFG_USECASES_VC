// backend/tests/integration/verificationSession.int.spec.js
const express = require('express');
const request = require('supertest');
const verificationRoutes = require('../../src/routes/verificationRoutes');
const setupContainers = require('./setupTestContainers');
const sessionStore = require('../../src/utils/sessionStore');

let app;
let containers;

/* ------------------------------------------------------------------ */
/*                               SET‑UP                               */
/* ------------------------------------------------------------------ */
beforeAll(async () => {
    containers = await setupContainers();          // Mongo + Redis in‑memory
    app = express();
    app.use(express.json());
    app.use('/verification', verificationRoutes);
});

afterAll(async () => {
    await setupContainers.teardown();
});

/* ------------------------------------------------------------------ */
/*                               TESTS                                */
/* ------------------------------------------------------------------ */
describe('GET /verification/session/:stateId', () => {
    it('devuelve expired cuando pasa el ttl', async () => {
        const stateId = 'state-ttl-1';                 // ← guion ASCII
        await sessionStore.setSession(stateId, {
            status: 'pending',
            verificationUrl: 'http://example.com',
            expiresAt: Date.now() - 1,                   // ya caducada
        });

        const res = await request(app)
            .get(`/verification/session/${stateId}`)
            .expect(200);

        expect(res.body.status).toBe('expired');
    });

    it('404 si la sesión no existe', async () => {
        await request(app)
            .get('/verification/session/no-such')        // ← guion ASCII
            .expect(404);
    });
});
