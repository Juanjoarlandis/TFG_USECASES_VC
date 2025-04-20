// tests/unit/utils/jwtUtils.invalid.spec.js
const { verifyAccessToken } = require('../../../src/utils/jwtUtils');
const jwt = require('jsonwebtoken');

describe('jwtUtils.verifyAccessToken – error', () => {
    it('lanza JsonWebTokenError si la firma no coincide', () => {
        const bad = jwt.sign({ sub: '1' }, 'otro-secret');
        expect(() => verifyAccessToken(bad)).toThrow('invalid signature');
    });
});
