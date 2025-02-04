/**
 * @file didController.js
 * @description Controller for handling DID (Decentralized Identifier) operations.
 * This module currently provides functionality to list DIDs from the wallet.
 * @module controllers/didController
 */

const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    /**
     * Retrieves the list of DIDs from the wallet.
     *
     * This function obtains the authentication token and wallet ID from the HolderSessionManager,
     * then calls the wallet API to retrieve the list of DIDs.
     *
     * @async
     * @function listDIDs
     * @param {import('express').Request} _req - Express request object (unused).
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async listDIDs(_req, res) {
        try {
            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/dids`, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error obtaining DIDs:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
