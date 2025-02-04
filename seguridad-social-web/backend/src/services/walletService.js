/**
 * @file walletService.js
 * @description Provides services to interact with the wallet API for retrieving user information,
 * listing DIDs, and listing credentials.
 * @module services/walletService
 */

const axios = require('axios');
const logger = require('../../logger');

/**
 * Retrieves the holder's user information from the wallet.
 *
 * Sends a GET request to the wallet API using the provided token to obtain user information.
 *
 * @async
 * @function getUserInfo
 * @param {string} token - The JWT token for authentication.
 * @returns {Promise<Object>} The user information returned by the wallet API.
 * @throws {Error} If the API request fails.
 */
async function getUserInfo(token) {
    logger.debug('walletService.getUserInfo - requesting holder info');
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
    };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`, config);
    logger.debug('walletService.getUserInfo - info received');
    return response.data;
}

/**
 * Retrieves the list of DIDs (Decentralized Identifiers) from the wallet.
 *
 * Sends a GET request to the wallet API using the provided token and walletId.
 *
 * @async
 * @function listDIDs
 * @param {string} token - The JWT token for authentication.
 * @param {string} walletId - The wallet identifier.
 * @returns {Promise<Array>} An array of DID objects.
 * @throws {Error} If the API request fails.
 */
async function listDIDs(token, walletId) {
    logger.debug(`walletService.listDIDs - Listing DIDs for wallet: ${walletId}`);
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
    };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/dids`, config);
    logger.debug('walletService.listDIDs - DIDs received:', response.data);
    return response.data;
}

/**
 * Retrieves the list of credentials from the wallet.
 *
 * Sends a GET request to the wallet API using the provided token and walletId,
 * with a query parameter to sort the credentials by the time they were added.
 *
 * @async
 * @function listCredentials
 * @param {string} token - The JWT token for authentication.
 * @param {string} walletId - The wallet identifier.
 * @returns {Promise<Array>} An array of credential objects.
 * @throws {Error} If the API request fails.
 */
async function listCredentials(token, walletId) {
    logger.debug(`walletService.listCredentials - Listing credentials for wallet: ${walletId}`);
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
    };
    const response = await axios.get(`${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials?sortBy=addedOn`, config);
    logger.debug('walletService.listCredentials - Credentials received:', response.data.map(c => c.id));
    return response.data;
}

module.exports = {
    getUserInfo,
    listDIDs,
    listCredentials
};
