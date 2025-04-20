// backend/tests/integration/revocationRoutes.int.spec.js
const express = require('express');
const request = require('supertest');

const revocationRoutes = require('../../src/routes/revocationRoutes');
const setupContainers = require('./setupTestContainers');

const User = require('../../src/models/User');
const RevokedCredential = require('../../src/models/RevokedCredential');
const axios = require('axios');

// ────── Mocks ──────
jest.mock('../../src/models/User');
jest.mock('../../src/models/RevokedCredential');
jest.mock('axios');               // evita peticiones reales a la wallet

// ────── Variables de apoyo ──────
let app;
let containers;

/* ------------------------------------------------------------------ */
/*                               SET‑UP                               */
/* ------------------------------------------------------------------ */
beforeAll(async () => {
    // 1) Arranca Mongo + Redis en memoria
    containers = await setupContainers();

    // 2) Crea la app de Express y monta las rutas que vamos a probar
    app = express();
    app.use(express.json());
    app.use('/revocar', revocationRoutes);
});

afterAll(async () => {
    // Detén mongo‑memory‑server y redis‑mock
    await setupContainers.teardown();
});

/* ------------------------------------------------------------------ */
/*                               TESTS                                */
/* ------------------------------------------------------------------ */
describe('POST /revocar/credencial', () => {
    it('revoca credencial y responde 200', async () => {
        /* --- Arrange -------------------------------------------------- */
        // Usuario encontrado en Mongo
        User.findOne.mockResolvedValue({
            save: jest.fn(),             // simulamos .save()
            altaCredentialJti: 'jti-1',
            hasAltaCredential: true,
            altaCredentialData: { id: 'cred‑1' },
        });

        // Alta añadida a lista negra
        RevokedCredential.create.mockResolvedValue({});

        // DELETE a la wallet (si se llama) no falla
        axios.delete.mockResolvedValue({ status: 200 });

        /* --- Act ------------------------------------------------------ */
        const res = await request(app)
            .post('/revocar/credencial')
            .send({ dni: '1234' })
            .expect(200);                // supertest ya aserta el status

        /* --- Assert --------------------------------------------------- */
        expect(res.body).toHaveProperty(
            'message',
            'Credencial revocada y eliminada permanentemente del wallet con éxito',
        );
        expect(User.findOne).toHaveBeenCalledWith({ documentNumber: '1234' });
        expect(RevokedCredential.create).toHaveBeenCalledWith({
            credentialId: 'jti-1',
        });
    });
});
