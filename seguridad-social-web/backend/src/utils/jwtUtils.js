/**
 * @file jwtUtils.js
 * @description Utility functions for generating and verifying JWT access and refresh tokens.
 * @module utils/jwtUtils
 */

const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

/**
 * Generates a new access token and refresh token for the given user ID.
 *
 * @function generateTokens
 * @param {string} userId - The unique identifier for the user.
 * @returns {Object} An object containing the generated accessToken and refreshToken.
 */
function generateTokens(userId) {
    const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRATION
    });
    const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRATION
    });
    return { accessToken, refreshToken };
}

/**
 * Verifies the provided access token using the JWT secret.
 *
 * @function verifyAccessToken
 * @param {string} token - The access token to verify.
 * @returns {Object} The decoded token payload if verification is successful.
 * @throws {Error} Throws an error if the token is invalid or expired.
 */
function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Verifies the provided refresh token using the JWT refresh secret.
 *
 * @function verifyRefreshToken
 * @param {string} token - The refresh token to verify.
 * @returns {Object} The decoded token payload if verification is successful.
 * @throws {Error} Throws an error if the token is invalid or expired.
 */
function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
