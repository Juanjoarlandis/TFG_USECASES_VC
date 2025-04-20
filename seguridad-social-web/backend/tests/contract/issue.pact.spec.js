const path = require('path');
const { Pact, Matchers } = require('@pact-foundation/pact');

/* 👉  usamos axios real */
const axios = jest.requireActual('axios');

const provider = new Pact({
    consumer: 'verifier-backend',
    provider: 'walt-id',
    port: 1235,                         // distinto al 1234
    log: path.resolve(process.cwd(), 'tests/contract/logs/pact.log'),
    dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
    spec: 2,
});

describe('Pact /openid4vc/jwt/issue', () => {
    beforeAll(() => provider.setup());
    afterEach(() => provider.removeInteractions());
    afterAll(() => provider.finalize());

    it('cumple contrato', async () => {
        await provider.addInteraction({
            state: 'walt.id issuer disponible',
            uponReceiving: 'solicitud de jwt issue',
            withRequest: {
                method: 'POST',
                path: '/openid4vc/jwt/issue',
                headers: { 'Content-Type': 'application/json' },
                body: Matchers.like({
                    issuerKey: {},
                    issuerDid: 'did:web:test',
                    credentialConfigurationId: 'id',
                    credentialData: {},
                    mapping: {},
                    authenticationMethod: 'PRE_AUTHORIZED',
                }),
            },
            willRespondWith: {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: Matchers.term({
                    matcher: '^https?://.*',
                    generate: 'http://walt.id/issue?offer=xyz',
                }),
            },
        });

        /* --- llamada real al mock server Pact --- */
        const { data } = await axios.post(
            'http://localhost:1235/openid4vc/jwt/issue',
            {
                issuerKey: {},
                issuerDid: 'did:web:test',
                credentialConfigurationId: 'id',
                credentialData: {},
                mapping: {},
                authenticationMethod: 'PRE_AUTHORIZED',
            },
        );

        expect(data).toMatch(/^https?:\/\//);
        await provider.verify();
    });
});
