const path = require('path');
const { Pact, Matchers } = require('@pact-foundation/pact');

/* 👉  Cargamos la implementación real, ignorando el mock global */
const axios = jest.requireActual('axios');   // ⬅️  ESTA LÍNEA ES LA CLAVE

const provider = new Pact({
    consumer: 'verifier-backend',
    provider: 'walt-id',
    port: 1234,
    log: path.resolve(process.cwd(), 'tests/contract/logs/pact.log'),
    dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
    spec: 2,
});

describe('Pact /openid4vc/verify', () => {
    beforeAll(() => provider.setup());
    afterEach(() => provider.removeInteractions());
    afterAll(() => provider.finalize());

    it('cumple contrato', async () => {
        await provider.addInteraction({
            state: 'walt.id disponible',
            uponReceiving: 'solicitud de verify',
            withRequest: {
                method: 'POST',
                path: '/openid4vc/verify',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    request_credentials: [
                        { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
                    ],
                },
            },
            willRespondWith: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: Matchers.term({
                    matcher: '^https?://.*',
                    generate: 'http://walt.id/verify?state=abc123',
                }),
            },
        });

        /* --- llamada real al mock server Pact --- */
        const { data } = await axios.post('http://localhost:1234/openid4vc/verify', {
            request_credentials: [
                { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
            ],
        });

        expect(data).toMatch(/^https?:\/\//);
        await provider.verify();
    });
});
