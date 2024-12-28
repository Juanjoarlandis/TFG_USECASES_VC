// src/controllers/didController.js
const logger = require('../../logger');
const HolderSessionManager = require('../services/HolderSessionManager');
const { listDIDs } = require('../services/walletService');

module.exports = {
    async listDIDs(_req, res, next) {
        try {
            logger.debug('[didController] listDIDs - start');

            // 1) Obtener token y walletId desde HolderSessionManager
            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();

            // 2) Llamar al método de walletService que ya existe
            const dids = await listDIDs(token, walletId);

            // 3) Devolver la respuesta
            return res.status(200).json(dids);
        } catch (error) {
            logger.error('[didController] Error obtaining DIDs:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    }
};
