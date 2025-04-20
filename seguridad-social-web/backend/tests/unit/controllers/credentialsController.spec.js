// tests/unit/controllers/credentialsController.spec.js
const httpMocks = require('node-mocks-http');
const credentialsController = require('../../../src/controllers/credentialsController');
const credentialsService = require('../../../src/services/credentialsService');

jest.mock('../../../src/services/credentialsService');

function mockReqRes(params = {}) {
    return {
        req: httpMocks.createRequest(params),
        res: httpMocks.createResponse(),
    };
}

describe('credentialsController', () => {
    afterEach(() => jest.clearAllMocks());

    it('listCredentials', async () => {
        credentialsService.listCredentials.mockResolvedValue([{ id: '1' }]);
        const { req, res } = mockReqRes();

        await credentialsController.listCredentials(req, res, () => { });

        expect(res._getJSONData()).toEqual([{ id: '1' }]);
    });

    it('getCredentialById – 400 sin id', async () => {
        const { req, res } = mockReqRes({ params: {} });
        await credentialsController.getCredentialById(req, res, () => { });
        expect(res.statusCode).toBe(400);
    });

    it('deleteCredential – error service', async () => {
        credentialsService.deleteCredential.mockRejectedValue({ status: 500, message: 'fail' });
        const { req, res } = mockReqRes({ params: { id: 'x' } });
        await credentialsController.deleteCredential(req, res, () => { });
        expect(res.statusCode).toBe(500);
    });
});
