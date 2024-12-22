// src/controllers/offerController.js
const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    async useCredentialOffer(req, res) {
        try {
            const { offerUrl, did } = req.body;
            if (!offerUrl || !did) return res.status(400).json({ error: 'Missing offerUrl or did' });

            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'text/plain' }
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
