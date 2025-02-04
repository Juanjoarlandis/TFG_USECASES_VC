/**
 * @file offerController.js
 * @description Controller for handling credential offer operations.
 * This module provides an endpoint to use a credential offer in the wallet.
 * @module controllers/offerController
 */

const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    /**
     * Uses a credential offer.
     *
     * This function retrieves the offer URL and DID from the request body,
     * obtains the wallet token and wallet ID via the HolderSessionManager, and then calls
     * the wallet API endpoint to use the offer. The offer URL is sent as plain text.
     *
     * @async
     * @function useCredentialOffer
     * @param {import('express').Request} req - Express request object containing `offerUrl` and `did` in its body.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>} Responds with the JSON data from the wallet API.
     */
    async useCredentialOffer(req, res) {
        try {
            const { offerUrl, did } = req.body;
            if (!offerUrl || !did) {
                return res.status(400).json({ error: 'Missing offerUrl or did' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'text/plain'
                }
            };

            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(did)}`;
            logger.debug(`Calling useOfferRequest URL: ${url}`);

            const response = await axios.post(url, offerUrl, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error using credential offer:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
