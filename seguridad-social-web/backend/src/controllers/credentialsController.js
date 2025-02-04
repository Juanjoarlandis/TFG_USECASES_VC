/**
 * @file credentialsController.js
 * @description Controller for handling credential-related operations such as listing, retrieving, deleting,
 * accepting, rejecting, and checking the status of credentials.
 * @module controllers/credentialsController
 */

const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');
const logger = console; // Note: Replace with a proper logger if needed.

module.exports = {
    /**
     * Lists all credentials from the wallet.
     *
     * Retrieves the token and wallet ID from the HolderSessionManager,
     * then calls the wallet API to get the list of credentials.
     *
     * @async
     * @function listCredentials
     * @param {import('express').Request} _req - Express request object (unused).
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async listCredentials(_req, res) {
        try {
            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
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

    /**
     * Retrieves a credential by its ID.
     *
     * Validates that the credential ID is provided and then retrieves the credential details
     * from the wallet API.
     *
     * @async
     * @function getCredentialById
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async getCredentialById(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) {
                return res.status(400).json({ error: 'Missing credentialId' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            const response = await axios.get(url, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error getting credential by ID:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Deletes a credential by its ID.
     *
     * Validates that the credential ID is provided and then calls the wallet API to delete the credential.
     *
     * @async
     * @function deleteCredential
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async deleteCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) {
                return res.status(400).json({ error: 'Missing credentialId' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            await axios.delete(url, config);
            res.status(200).json('Credential deleted successfully');
        } catch (error) {
            logger.error('Error deleting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Accepts a credential by its ID.
     *
     * Validates that the credential ID is provided and then calls the wallet API to accept the credential.
     *
     * @async
     * @function acceptCredential
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async acceptCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) {
                return res.status(400).json({ error: 'Missing credentialId' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const acceptUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/accept`;
            const response = await axios.post(acceptUrl, {}, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error accepting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Rejects a credential by its ID.
     *
     * Validates that the credential ID is provided and then calls the wallet API to reject the credential.
     *
     * @async
     * @function rejectCredential
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async rejectCredential(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) {
                return res.status(400).json({ error: 'Missing credentialId' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/reject`;
            const response = await axios.post(url, {}, config);
            res.status(200).json(response.data);
        } catch (error) {
            logger.error('Error rejecting credential:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    },

    /**
     * Retrieves the status of a credential.
     *
     * Validates that the credential ID is provided and then retrieves its status
     * from the wallet API. Assumes the credential status is determined by the presence of a "pending" flag.
     *
     * @async
     * @function getCredentialStatus
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @returns {Promise<void>}
     */
    async getCredentialStatus(req, res) {
        try {
            const credentialId = req.params.id;
            if (!credentialId) {
                return res.status(400).json({ error: 'Missing credentialId' });
            }

            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            };
            const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
            const response = await axios.get(url, config);

            res.status(200).json({ status: response.data.pending ? 'pending' : 'issued' });
        } catch (error) {
            logger.error('Error getting credential status:', error.message);
            res.status(error.response?.status || 500).json({ error: error.message });
        }
    }
};
