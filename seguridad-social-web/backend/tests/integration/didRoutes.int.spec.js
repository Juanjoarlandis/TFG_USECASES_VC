// backend/tests/integration/didRoutes.int.spec.js
const request = require('supertest');
const express = require('express');
const didRoutes = require('../../src/routes/didRoutes');
const HolderSessionManager = require('../../src/services/HolderSessionManager');
const walletService = require('../../src/services/walletService');

jest.mock('../../src/services/HolderSessionManager');
jest.mock('../../src/services/walletService');

let app;
beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/wallet-api', didRoutes);
});

afterEach(() => jest.clearAllMocks());

describe('GET /wallet-api/dids', () => {
    it('200 con lista de DIDs', async () => {
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        HolderSessionManager.getWalletId.mockReturnValue('w1');
        walletService.listDIDs.mockResolvedValue([{ did: 'did:1' }]);

        const res = await request(app).get('/wallet-api/dids').expect(200);
        expect(res.body).toEqual([{ did: 'did:1' }]);
    });
});
