// tests/unit/controllers/didController.spec.js
const httpMocks = require('node-mocks-http');
const didController = require('../../../src/controllers/didController');
const HolderSessionManager = require('../../../src/services/HolderSessionManager');
const walletService = require('../../../src/services/walletService');

jest.mock('../../../src/services/HolderSessionManager');
jest.mock('../../../src/services/walletService');

describe('didController.listDIDs', () => {
    it('flujo feliz', async () => {
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        HolderSessionManager.getWalletId.mockReturnValue('w‑1');
        walletService.listDIDs.mockResolvedValue([{ did: 'did:key:abc' }]);

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        await didController.listDIDs(req, res, () => { });

        expect(res._getJSONData()).toEqual([{ did: 'did:key:abc' }]);
    });
});
