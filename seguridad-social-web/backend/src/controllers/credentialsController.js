// src/controllers/credentialsController.js
const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console;

module.exports = {
    async listCredentials(_req, res) {
        try {
            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const credsUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials`;
            const response = await axios.get(credsUrl, config);
            const creds = response.data;
            logger.info('Credentials listed successfully');
            res.status(200).json(creds);
        } catch (error) {
            logger.error('Error listing credentials:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async getCredentialById(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' });

            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            const response = await axios.get(url, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error getting credential by ID:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async deleteCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' });

            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            await axios.delete(url, config);
            res.status(200).json('Credential deleted successfully');
        } catch (error) {
            logger.error('Error deleting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async acceptCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' });

            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const acceptUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/accept`;
            const response = await axios.post(acceptUrl, {}, config);

            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error accepting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async rejectCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' });

            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/reject`;
            const response = await axios.post(url, {}, config);

            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error rejecting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    async getCredentialStatus(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) return res.status(400).json({ error: 'Missing credentialId' });

            // En el wallet-api no había persistencia de estado extra, asumimos que la credencial se refleja tal cual.
            // Podríamos simplemente devolver un mock o consultar la credencial y ver si está "pending" o "issued".
            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            const response = await axios.get(url, config);

            res.status(200).json({ status: response.data.pending ? 'pending' : 'issued' });
        } catch (error) {
            logger.error('Error getting credential status:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
