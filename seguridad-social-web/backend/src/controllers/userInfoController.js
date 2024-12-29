// src/controllers/userInfoController.js
const logger = require('../../logger');
const userService = require('../services/userService');

module.exports = {
    async getUserInfo(_req, res, next) {
        try {
            logger.debug('[userInfoController] getUserInfo - start');
            const walletInfo = await userService.getHolderUserInfo();
            return res.status(200).json(walletInfo);
        } catch (error) {
            logger.error('[userInfoController] Error obtaining Holder user info:', error.message);
            if (error.status) {
                return res.status(error.status).json({ error: error.message });
            }
            next(error);
        }
    }
};
