// backend/tests/integration/presentationRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const walletRoutes = require('../../src/routes/walletRoutes');
const presentationService = require('../../src/services/presentationService');
const HolderSessionManager = require('../../src/services/HolderSessionManager');
const walletService = require('../../src/services/walletService');

jest.mock('../../src/services/presentationService');
jest.mock('../../src/services/HolderSessionManager');
jest.mock('../../src/services/walletService');

let app;
beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/wallet-api', walletRoutes);
});

afterEach(() => jest.clearAllMocks());

describe('POST /wallet-api/resolve-presentation-request', () => {
    it('400 si falta presentationRequestUrl', async () => {
        await request(app).post('/wallet-api/resolve-presentation-request').send({}).expect(400);
    });
    it('200 y devuelve data', async () => {
        presentationService.resolvePresentationRequest.mockResolvedValue({ ok: true });
        const res = await request(app)
            .post('/wallet-api/resolve-presentation-request')
            .send({ presentationRequestUrl: 'url' })
            .expect(200);
        expect(res.body).toEqual({ ok: true });
    });
});

describe('POST /wallet-api/match-credentials', () => {
    it('400 si falta presentationDefinition', async () => {
        await request(app).post('/wallet-api/match-credentials').send({}).expect(400);
    });
    it('200 y devuelve data', async () => {
        presentationService.matchCredentialsForPresentation.mockResolvedValue([1, 2]);
        const res = await request(app)
            .post('/wallet-api/match-credentials')
            .send({ presentationDefinition: {} })
            .expect(200);
        expect(res.body).toEqual([1, 2]);
    });
});

describe('POST /wallet-api/use-presentation-request', () => {
    it('400 si faltan campos', async () => {
        await request(app).post('/wallet-api/use-presentation-request').send({}).expect(400);
    });
    it('200 y devuelve data', async () => {
        presentationService.usePresentationRequest.mockResolvedValue({ result: true });
        const payload = {
            did: 'd',
            presentationRequest: {},
            selectedCredentials: [1],
            disclosures: { x: 1 },
        };
        const res = await request(app)
            .post('/wallet-api/use-presentation-request')
            .send(payload)
            .expect(200);
        expect(res.body).toEqual({ result: true });
    });
});
