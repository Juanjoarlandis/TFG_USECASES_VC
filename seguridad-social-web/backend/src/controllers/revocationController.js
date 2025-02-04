/**
 * @file revocationController.js
 * @description Controller for handling credential revocation.
 * This module allows revoking a credential by updating the internal database,
 * marking the credential as revoked in a blacklist, and removing it from the wallet.
 * @module controllers/revocationController
 */

const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');
const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');

module.exports = {
    /**
     * Revokes a credential for a user.
     *
     * This function performs the following steps:
     * 1. Finds the user by their document number (dni) provided in the request body.
     * 2. Logs credential-related fields of the user.
     * 3. Updates the user record to mark the credential as revoked.
     * 4. Retrieves the credential ID from the wallet (if available).
     * 5. Inserts the credential ID into the revoked credentials (blacklist) collection.
     * 6. Attempts to delete the credential from the wallet.
     *
     * On success, it returns a JSON object containing a success message and the updated user.
     *
     * @async
     * @function revokeCredential
     * @param {import('express').Request} req - Express request object containing the `dni` in its body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object with a success message and the user data.
     */
    async revokeCredential(req, res, next) {
        try {
            const { dni } = req.body;
            console.log('[revokeCredential] Received request body:', req.body);

            // 1) Find the user by document number (dni)
            const user = await User.findOne({ documentNumber: dni });
            console.log('[revokeCredential] Found user:', user);

            if (!user) {
                console.warn('[revokeCredential] No user found with DNI:', dni);
                return res.status(404).json({ error: 'User not found' });
            }

            // 2) Log credential-related fields of the user
            console.log('[revokeCredential] user.hasAltaCredential:', user.hasAltaCredential);
            console.log('[revokeCredential] user.altaIssueDate:', user.altaIssueDate);
            console.log('[revokeCredential] user.altaCredentialData:', user.altaCredentialData);
            console.log('[revokeCredential] user.altaCredentialJti:', user.altaCredentialJti);

            // 3) Update user record (internal revocation)
            user.hasAltaCredential = false;
            user.altaIssueDate = null;

            // 4) Retrieve the wallet credential ID from the user's data
            let walletCredentialId = null;
            if (user.altaCredentialData && user.altaCredentialData.id) {
                walletCredentialId = user.altaCredentialData.id;
            }
            console.log('[revokeCredential] walletCredentialId:', walletCredentialId);

            // Set the credential data to null and save changes in the database
            user.altaCredentialData = null;
            await user.save();
            console.log('[revokeCredential] User updated in DB:', user);

            // 5) Mark the credential as revoked in the blacklist
            if (user.altaCredentialJti) {
                try {
                    console.log('[revokeCredential] Inserting credentialId in RevokedCredential:', user.altaCredentialJti);
                    await RevokedCredential.create({ credentialId: user.altaCredentialJti });
                } catch (err) {
                    if (err.code === 11000) {
                        console.warn('[revokeCredential] Credential already exists in the blacklist:', user.altaCredentialJti);
                    } else {
                        console.error('[revokeCredential] Error adding to blacklist:', err);
                    }
                }
            } else {
                console.warn('[revokeCredential] No altaCredentialJti found for the user.');
            }

            // 6) Delete the credential from the wallet if the wallet credential ID exists
            if (walletCredentialId) {
                console.log('[revokeCredential] Proceeding to delete the credential from the wallet:', walletCredentialId);

                try {
                    const token = await HolderSessionManager.getToken();
                    const walletId = await HolderSessionManager.getWalletId();
                    const encodedId = walletCredentialId; // If necessary, encode the ID here

                    const deleteUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodedId}?permanent=true`;
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: '*/*'
                        }
                    };

                    console.log('[revokeCredential] deleteUrl:', deleteUrl);
                    console.log('[revokeCredential] Request config:', config);

                    const resp = await axios.delete(deleteUrl, config);
                    console.log('[revokeCredential] DELETE response status:', resp.status, 'data:', resp.data);
                } catch (err) {
                    console.error('[revokeCredential] Error permanently deleting credential from the wallet:', err.message);
                }
            } else {
                console.log('[revokeCredential] walletCredentialId does not exist; skipping DELETE request to wallet.');
            }

            return res.status(200).json({
                message: 'Credential revoked and permanently deleted from the wallet successfully',
                user
            });
        } catch (err) {
            console.error('[revokeCredential] General error:', err);
            next(err);
        }
    }
};
