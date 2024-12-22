const authService = require('../services/authService');
const logger = require('../../logger');

module.exports = {
    async walletLogin(req, res, next) {
        try {
            logger.debug('POST /auth/wallet-login - inicio');
            const { email, password } = req.body;
            if (!email || !password) {
                logger.warn('Faltan email o password');
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await authService.loginAndVerifyIdentityCredential(email, password);
            logger.debug('Login y verificación completados con éxito');
            return res.status(200).json(result);

        } catch (error) {
            logger.error('Error en walletLogin:', error.message);
            next(error);
        }
    },



    async refresh(req, res, next) {
        try {
            logger.debug('POST /auth/refresh - Refrescando token');
            const { refreshToken } = req.body;
            if (!refreshToken) {
                logger.warn('No se proporcionó refresh token');
                return res.status(400).json({ error: 'No refresh token provided' });
            }

            const result = await authService.refreshTokens(refreshToken);
            return res.status(200).json(result);
        } catch (err) {
            logger.error('Error en refresh:', err.message);
            next(err);
        }
    }
};
