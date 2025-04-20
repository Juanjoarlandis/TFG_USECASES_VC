// backend/tests/integration/issuanceRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const issuanceRoutes = require('../../src/routes/issuanceRoutes');
const setupContainers = require('./setupTestContainers');
const axios = require('axios');

jest.mock('axios');

let app;
let containers;

beforeAll(async () => {
    containers = await setupContainers();
    app = express();
    app.use(express.json());
    app.use('/issuance', issuanceRoutes);
});

afterAll(async () => {
    await setupContainers.teardown();
});

describe('POST /issuance/offerIssuance', () => {
    it('retorna 200 y issuanceOfferUrl', async () => {
        // (a) Preparamos Redis
        const stateId = 'state‑integration‑1';
        const sessionStore = require('../../src/utils/sessionStore');
        await sessionStore.setSession(stateId, {
            user: { documentNumber: '1234', hasAltaCredential: true },
        });

        // (b) mock axios al issuer
        axios.post.mockResolvedValue({ data: 'http://walt.id/issue?offer=xyz' });

        const res = await request(app)
            .post('/issuance/offerIssuance')
            .send({ stateId })
            .expect(200);

        expect(res.body).toHaveProperty(
            'issuanceOfferUrl',
            'http://walt.id/issue?offer=xyz',
        );
    });
});
