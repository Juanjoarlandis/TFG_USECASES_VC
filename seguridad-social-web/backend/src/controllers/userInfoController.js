/**
 * @file userInfoController.js
 * @description Controller for retrieving user information from the wallet.
 * This module provides an endpoint to obtain the authenticated holder's user information.
 * @module controllers/userInfoController
 */

const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    /**
     * Retrieves the holder's user information.
     *
     * This function obtains the authentication token from the HolderSessionManager,
     * then calls the wallet API to retrieve user information.
     * On success, it responds with a JSON object containing the user data.
     *
     * @async
     * @function getUserInfo
     * @param {import('express').Request} _req - Express request object (unused).
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>} Sends a JSON response with the user information or an error message.
     */
    async getUserInfo(_req, res) {
        try {
            const token = await HolderSessionManager.getToken();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error obtaining Holder user info:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
