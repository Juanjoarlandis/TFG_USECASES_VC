// src/controllers/authController.js
const authService = require('../services/authService');
const logger = require('../../logger');

module.exports = {
    async walletLogin(req, res, next) {
        try {
            logger.debug('POST /auth/wallet-login - inicio');
            const { email, password } = req.body;
            if (!email || !password) {
                logger.warn('[authController] Faltan email o password');
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.loginAndVerifyIdentityCredential(email, password);
            logger.debug('[authController] Login y verificación completados con éxito');
            return res.status(200).json(result);

        } catch (error) {
            logger.error('[authController] Error en walletLogin:', error.message);

            // Si el error ya trae un status (por ej. error.status = 401, 403, etc.), podemos responder directamente
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }

            // Sino, delegamos al middleware global
            next(error);
        }
    },

    async refresh(req, res, next) {
        try {
            logger.debug('POST /auth/refresh - Refrescando token');
            const { refreshToken } = req.body;
            if (!refreshToken) {
                logger.warn('[authController] No se proporcionó refresh token');
                return res.status(400).json({ error: 'No refresh token provided' });
            }

            const result = await authService.refreshTokens(refreshToken);
            return res.status(200).json(result);
        } catch (error) {
            logger.error('[authController] Error en refresh:', error.message);

            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }

            next(error);
        }
    }
};
