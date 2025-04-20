const path = require('path');
const { Pact } = require('@pact-foundation/pact');

module.exports = new Pact({
    consumer: 'verifier-backend',
    provider: 'walt-id',
    port: 1234,
    log: path.resolve(process.cwd(), 'tests/contract/logs/pact.log'),
    dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
    spec: 2
});
