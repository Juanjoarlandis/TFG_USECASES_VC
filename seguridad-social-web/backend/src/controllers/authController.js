/**
 * @file authController.js
 * @description Controller for handling authentication-related endpoints such as wallet login and token refresh.
 * @module controllers/authController
 */

const authService = require('../services/authService');
const logger = require('../../logger');

module.exports = {
    /**
     * Handles wallet login requests.
     *
     * This controller method receives an email and password in the request body,
     * validates their presence, and calls the authentication service to perform login and identity credential verification.
     * On success, it responds with a JSON object containing the result.
     *
     * @async
     * @function walletLogin
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async walletLogin(req, res, next) {
        try {
            logger.debug('POST /auth/wallet-login - start');
            const { email, password } = req.body;
            if (!email || !password) {
                logger.warn('Missing email or password');
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.loginAndVerifyIdentityCredential(email, password);
            logger.debug('Login and verification completed successfully');
            return res.status(200).json(result);
        } catch (error) {
            logger.error('Error in walletLogin:', error.message);
            next(error);
        }
    },

    /**
     * Handles token refresh requests.
     *
     * This method expects a refresh token in the request body. It calls the authentication service
     * to refresh the tokens. On success, the new tokens are returned in the JSON response.
     *
     * @async
     * @function refresh
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>}
     */
    async refresh(req, res, next) {
        try {
            logger.debug('POST /auth/refresh - refreshing token');
            const { refreshToken } = req.body;
            if (!refreshToken) {
                logger.warn('No refresh token provided');
                return res.status(400).json({ error: 'No refresh token provided' });
            }

            const result = await authService.refreshTokens(refreshToken);
            return res.status(200).json(result);
        } catch (err) {
            logger.error('Error in refresh:', err.message);
            next(err);
        }
    }
};
