// backend/tests/integration/verificationRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const verificationRoutes = require('../../src/routes/verificationRoutes');
const setupContainers = require('./setupTestContainers');
const axios = require('axios');

jest.mock('axios');

let app;
let containers;

/* ------------------------------------------------------------------ */
/*                               SET‑UP                               */
/* ------------------------------------------------------------------ */
beforeAll(async () => {
    containers = await setupContainers();
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
describe('POST /verification/offer (flow feliz)', () => {
    it('debería devolver 200 con verificationUrl y state', async () => {
        /* Stub de la llamada a walt.id */
        axios.post.mockResolvedValue({
            data: 'http://walt.id/verify?state=xyz',
        });

        const res = await request(app)
            .post('/verification/offer')
            .send({
                request_credentials: [
                    { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
                ],
            })
            .expect(200);

        expect(res.body).toHaveProperty(
            'verificationUrl',
            'http://walt.id/verify?state=xyz',
        );
        expect(typeof res.body.state).toBe('string');
    });
});
