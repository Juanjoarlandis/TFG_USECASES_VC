/**
 * @file HolderSessionManager.js
 * @description Manages the session for the holder by handling login, token renewal, and wallet information retrieval.
 * Stores relevant data in Redis.
 * @module services/HolderSessionManager
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../../logger');
const { redisClient } = require('../config/redis');

// Redis keys for storing session information.
const TOKEN_KEY = 'holder:token';
const TOKEN_EXPIRY_KEY = 'holder:token_expiry';
const WALLET_ID_KEY = 'holder:wallet_id';
const ACCOUNT_ID_KEY = 'holder:account_id';
const EMAIL_KEY = 'holder:email';
const PASSWORD_KEY = 'holder:password';

class HolderSessionManager {
    /**
     * Creates an instance of HolderSessionManager.
     * Implements a singleton pattern.
     */
    constructor() {
        if (HolderSessionManager.instance) {
            return HolderSessionManager.instance;
        }
        HolderSessionManager.instance = this;
    }

    /**
     * Logs in to the wallet using email and password.
     * Sends a login request to the wallet, stores the token and login metadata in Redis,
     * and loads wallet information.
     *
     * @async
     * @function loginHolderWithCredentials
     * @param {string} email - The user's email address.
     * @param {string} password - The user's password.
     * @returns {Promise<void>}
     * @throws {Error} If the login fails or no token is received.
     */
    async loginHolderWithCredentials(email, password) {
        logger.debug('[HolderSessionManager] loginHolderWithCredentials', { email });

        try {
            // 1) Send login request to the wallet.
            const loginData = { type: 'email', email, password };
            const WALLET_COORD_URL = process.env.WALLET_COORD_URL;
            const response = await axios.post(
                `${WALLET_COORD_URL}/wallet-api/auth/login`,
                loginData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (!response.data?.token) {
                throw new Error('No token in login response.');
            }

            const token = response.data.token;
            // Store token in Redis.
            await redisClient.set(TOKEN_KEY, token);

            // Also store email and password for future token renewal.
            await redisClient.set(EMAIL_KEY, email);
            await redisClient.set(PASSWORD_KEY, password);

            // Calculate token expiration (exp in seconds -> convert to ms).
            const decoded = jwt.decode(token);
            if (decoded?.exp) {
                const expiryMs = decoded.exp * 1000;
                await redisClient.set(TOKEN_EXPIRY_KEY, expiryMs.toString());
            } else {
                // If no expiration, remove the expiry key.
                await redisClient.del(TOKEN_EXPIRY_KEY);
            }

            // 2) Load wallet information (accountId and walletId).
            await this.loadWalletInfo();

            logger.info('[HolderSessionManager] User logged in successfully. Token stored in Redis.');
        } catch (err) {
            logger.error('[HolderSessionManager] Error loginHolderWithCredentials:', err.message);
            throw err;
        }
    }

    /**
     * Loads wallet information (accountId and walletId) after login.
     *
     * Retrieves wallet account details from the wallet API and stores the accountId and walletId in Redis.
     *
     * @async
     * @function loadWalletInfo
     * @returns {Promise<void>}
     * @throws {Error} If no wallets are found for the account.
     */
    async loadWalletInfo() {
        const token = await this.getToken();
        const WALLET_COORD_URL = process.env.WALLET_COORD_URL;

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            }
        };
        const resp = await axios.get(`${WALLET_COORD_URL}/wallet-api/wallet/accounts/wallets`, config);

        const { account, wallets } = resp.data;
        if (!wallets?.length) {
            throw new Error('No wallets found for this account.');
        }

        // Store accountId and walletId in Redis.
        await redisClient.set(ACCOUNT_ID_KEY, account);
        await redisClient.set(WALLET_ID_KEY, wallets[0].id);

        logger.info(`[HolderSessionManager] loadWalletInfo => accountId=${account}, walletId=${wallets[0].id}`);
    }

    /**
     * Retrieves the current token from Redis.
     * Renews the token if it is about to expire (within a 1-minute buffer).
     *
     * @async
     * @function getToken
     * @returns {Promise<string>} The current valid token.
     * @throws {Error} If no token is found in Redis.
     */
    async getToken() {
        const token = await redisClient.get(TOKEN_KEY);
        if (!token) {
            throw new Error('[HolderSessionManager] No token in Redis. Not logged in.');
        }

        // Check token expiration.
        const expiryString = await redisClient.get(TOKEN_EXPIRY_KEY);
        const expiryMs = expiryString ? parseInt(expiryString, 10) : null;

        if (expiryMs) {
            const now = Date.now();
            const bufferTime = 60_000; // 1 minute buffer

            if (now > expiryMs - bufferTime) {
                logger.warn('[HolderSessionManager] Token about to expire. Renewing...');
                await this.renewToken();
                return redisClient.get(TOKEN_KEY); // Return the new token
            }
        }

        // Return current token if not expiring soon.
        return token;
    }

    /**
     * Renews the token by logging in again using the stored email and password.
     *
     * @async
     * @function renewToken
     * @returns {Promise<void>}
     * @throws {Error} If email or password is missing in Redis.
     */
    async renewToken() {
        const email = await redisClient.get(EMAIL_KEY);
        const password = await redisClient.get(PASSWORD_KEY);

        if (!email || !password) {
            throw new Error('[HolderSessionManager] Missing email/password in Redis, cannot renew token.');
        }

        await this.loginHolderWithCredentials(email, password);
    }

    /**
     * Retrieves the wallet ID from Redis.
     *
     * @async
     * @function getWalletId
     * @returns {Promise<string>} The wallet ID.
     */
    async getWalletId() {
        return redisClient.get(WALLET_ID_KEY);
    }

    /**
     * Retrieves the account ID from Redis.
     *
     * @async
     * @function getAccountId
     * @returns {Promise<string>} The account ID.
     */
    async getAccountId() {
        return redisClient.get(ACCOUNT_ID_KEY);
    }
}

module.exports = new HolderSessionManager();
