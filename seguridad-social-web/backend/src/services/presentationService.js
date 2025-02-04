/**
 * @file presentationService.js
 * @description Provides services for handling presentation requests.
 * This module includes functions to resolve a presentation request, match credentials for a presentation,
 * use a presentation request, and select a DID from the wallet.
 * @module services/presentationService
 */

const axios = require('axios');
const HolderSessionManager = require('./HolderSessionManager');
const { listDIDs } = require('./walletService');

/**
 * Resolves a presentation request.
 *
 * Sends the provided presentation request URL to the wallet API endpoint for resolution.
 *
 * @async
 * @function resolvePresentationRequest
 * @param {string} presentationRequestUrl - The presentation request URL to resolve.
 * @returns {Promise<string>} The resolved presentation request data.
 * @throws {Error} If the request fails.
 */
async function resolvePresentationRequest(presentationRequestUrl) {
    const token = await HolderSessionManager.getToken();
    const walletId = await HolderSessionManager.getWalletId();
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/plain',
            'Content-Type': 'text/plain'
        }
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/resolvePresentationRequest`;
    const response = await axios.post(url, presentationRequestUrl, config);
    return response.data;
}

/**
 * Matches credentials for a given presentation definition.
 *
 * Sends the presentation definition to the wallet API to find matching credentials.
 *
 * @async
 * @function matchCredentialsForPresentation
 * @param {Object} presentationDefinition - The presentation definition object.
 * @returns {Promise<Object>} The matched credentials data.
 * @throws {Error} If the request fails.
 */
async function matchCredentialsForPresentation(presentationDefinition) {
    const token = await HolderSessionManager.getToken();
    const walletId = await HolderSessionManager.getWalletId();
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/matchCredentialsForPresentationDefinition`;
    const response = await axios.post(url, presentationDefinition, config);
    return response.data;
}

/**
 * Uses a presentation request to present selected credentials.
 *
 * Sends the DID, presentation request, and selected credential IDs (and optionally disclosures)
 * to the wallet API endpoint to use the presentation request.
 *
 * @async
 * @function usePresentationRequest
 * @param {string} did - The decentralized identifier (DID) to use.
 * @param {string} presentationRequest - The original presentation request.
 * @param {Array<string>} selectedCredentials - Array of selected credential IDs.
 * @param {Object} [disclosures] - Optional disclosures.
 * @returns {Promise<Object>} The response data from using the presentation request.
 * @throws {Error} If the request fails.
 */
async function usePresentationRequest(did, presentationRequest, selectedCredentials, disclosures) {
    const token = await HolderSessionManager.getToken();
    const walletId = await HolderSessionManager.getWalletId();
    const payload = { did, presentationRequest, selectedCredentials };
    if (disclosures) payload.disclosures = disclosures;

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/usePresentationRequest`;
    const response = await axios.post(url, payload, config);
    return response.data;
}

/**
 * Retrieves or selects a DID from the wallet.
 *
 * Retrieves the token and walletId from the HolderSessionManager, lists all DIDs
 * in the wallet, and returns the first valid DID found.
 *
 * @async
 * @function getOrSelectDidSomewhere
 * @returns {Promise<string>} The selected DID.
 * @throws {Error} If token, walletId, or any valid DID is not found.
 */
async function getOrSelectDidSomewhere() {
    // 1) Retrieve token from the wallet.
    const token = await HolderSessionManager.getToken();
    // 2) Retrieve walletId.
    const walletId = await HolderSessionManager.getWalletId();

    if (!token || !walletId) {
        throw new Error('[getOrSelectDidSomewhere] Token or walletId not found');
    }

    // 3) List DIDs in the wallet.
    const dids = await listDIDs(token, walletId);
    if (!dids || !dids.length) {
        throw new Error('[getOrSelectDidSomewhere] No DIDs found in the wallet');
    }

    // 4) Select the first DID.
    const did = dids[0].did;
    if (!did) {
        throw new Error('[getOrSelectDidSomewhere] Invalid DID');
    }

    return did;
}

module.exports = {
    getOrSelectDidSomewhere,
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
};
