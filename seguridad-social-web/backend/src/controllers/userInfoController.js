// src/controllers/userInfoController.js
const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    async getUserInfo(_req, res) {
        try {
            const token = await HolderSessionManager.getToken();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error obtaining Holder user info:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
