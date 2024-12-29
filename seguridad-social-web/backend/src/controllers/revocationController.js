// src/controllers/revocationController.js
const revocationService = require('../services/revocationService');
const logger = require('../../logger');

module.exports = {
    async revokeCredential(req, res, next) {
        try {
            const { dni } = req.body;
            logger.debug(`[revocationController] revokeCredential - dni=${dni}`);
            if (!dni) {
                return res.status(400).json({ error: 'Missing dni' });
            }

            const result = await revocationService.revokeCredential(dni);
            // result => { message, user }
            return res.status(200).json(result);
        } catch (error) {
            logger.error('[revocationController] Error general:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    }
};
