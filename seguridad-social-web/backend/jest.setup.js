// jest.setup.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const nock = require('nock');
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';
process.env.SIGNING_KEY = process.env.SIGNING_KEY || 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb=';

// Interceptamos todas las llamadas a WaltID antes de que corran los tests:
beforeAll(() => {
    const base = process.env.WALTID_VERIFIER_URL || 'http://caddy:7003';
    nock(base)
        .post('/openid4vc/verify')
        .reply(200, 'http://walt.id/verify?state=xyz');
});

afterAll(() => {
    nock.cleanAll();
    nock.restore();
});
