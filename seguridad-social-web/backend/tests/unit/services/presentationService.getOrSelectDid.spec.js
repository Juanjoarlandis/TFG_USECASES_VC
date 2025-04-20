// tests/unit/services/presentationService.getOrSelectDid.spec.js
const presentationService = require(
    '../../../src/services/presentationService',
);
const HolderSessionManager = require(
    '../../../src/services/HolderSessionManager',
);
const walletService = require('../../../src/services/walletService');

jest.mock('../../../src/services/HolderSessionManager');
jest.mock('../../../src/services/walletService');

describe('presentationService.getOrSelectDidSomewhere', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        HolderSessionManager.getToken.mockResolvedValue('tkn');
        HolderSessionManager.getWalletId.mockReturnValue('w‑123');
    });

    it('devuelve el primer DID cuando existe', async () => {
        walletService.listDIDs.mockResolvedValue([{ did: 'did:key:abc' }]);

        const did = await presentationService.getOrSelectDidSomewhere();

        expect(did).toBe('did:key:abc');
        expect(walletService.listDIDs).toHaveBeenCalledWith('tkn', 'w‑123');
    });

    it('lanza error si la wallet no tiene DIDs', async () => {
        walletService.listDIDs.mockResolvedValue([]);

        await expect(
            presentationService.getOrSelectDidSomewhere(),
        ).rejects.toThrow(/No se encontraron DIDs/);
    });
});
