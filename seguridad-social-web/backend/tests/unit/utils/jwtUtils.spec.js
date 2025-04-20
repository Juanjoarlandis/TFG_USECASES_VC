const { generateTokens } = require('../../../src/utils/jwtUtils');
const jwt = require('jsonwebtoken');

describe('jwtUtils', () => {
    it('generateTokens produce accessToken y refreshToken válidos', () => {
        const userId = '12345';
        const { accessToken, refreshToken } = generateTokens(userId);

        const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET);
        expect(decodedAccess.sub).toBe(userId);

        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        expect(decodedRefresh.sub).toBe(userId);
    });
});
