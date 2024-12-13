// server/src/utils/jwtUtils.js

const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

function generateTokens(userId) {
    const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRATION
    });
    const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRATION
    });
    return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
