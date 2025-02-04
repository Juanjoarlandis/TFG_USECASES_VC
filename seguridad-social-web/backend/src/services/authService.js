/**
 * @file authService.js
 * @description Provides authentication services for automatic login and token refresh.
 * Implements a flow for automatic login via the wallet using OID4VC verification, and token refresh logic.
 * @module services/authService
 */

const HolderSessionManager = require('./HolderSessionManager');
const { verifyRefreshToken, generateTokens } = require('../utils/jwtUtils');
const { getUserInfo, listDIDs, listCredentials } = require('./walletService');
const { sessions } = require('../utils/validations');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const logger = require('../../logger');

// Functions for presenting credentials without QR code
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
} = require('./presentationService');

module.exports = {
    /**
     * Performs automatic login and identity credential verification.
     *
     * This function implements the following steps:
     * 1. Logs in to the wallet with the provided email and password.
     * 2. Retrieves the wallet token and walletId.
     * 3. Verifies that a CustomIdentityCredential exists in the wallet.
     * 4. Requests a verification offer (without QR) from the external verification service.
     * 5. Resolves the presentation request locally, matches the credential, and uses the presentation request.
     * 6. Stores session information (with a unique stateId) for later polling via a callback.
     *
     * @async
     * @function loginAndVerifyIdentityCredential
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<Object>} An object containing a message, stateId, and verificationUrl.
     * @throws {Error} Throws an error if any step fails (e.g., missing walletId, missing DID, or missing credentials).
     */
    async loginAndVerifyIdentityCredential(email, password) {
        logger.debug(`[authService] loginAndVerifyIdentityCredential - Start with email=${email}`);

        // 1) Log in to the wallet
        await HolderSessionManager.loginHolderWithCredentials(email, password);
        logger.debug('[authService] HolderSessionManager.loginHolderWithCredentials OK.');

        // 2) Retrieve token and walletId
        const token = await HolderSessionManager.getToken();
        const walletId = await HolderSessionManager.getWalletId();
        if (!walletId) {
            logger.error('[authService] No walletId found after login');
            throw new Error('No walletId found after login');
        }
        logger.debug(`[authService] token? ${!!token}, walletId=${walletId}`);

        // Retrieve additional holder info (optional)
        const userInfo = await getUserInfo(token);
        logger.debug(`[authService] userInfo: ${JSON.stringify(userInfo, null, 2)}`);

        // List DIDs from the wallet (for logging purposes)
        const dids = await listDIDs(token, walletId);
        logger.debug(`[authService] DIDs => ${JSON.stringify(dids, null, 2)}`);
        const did = (dids[0] && dids[0].did) || null;
        if (!did) {
            logger.error('[authService] DID not found in wallet');
            throw new Error('No DID found in wallet');
        }

        // Optionally, verify that the wallet contains a CustomIdentityCredential
        const creds = await listCredentials(token, walletId);
        const identityCred = creds.find(c =>
            c.parsedDocument &&
            Array.isArray(c.parsedDocument.type) &&
            c.parsedDocument.type.includes('CustomIdentityCredential')
        );
        if (!identityCred) {
            logger.error('[authService] No CustomIdentityCredential found in wallet');
            throw new Error('No CustomIdentityCredential found');
        }
        logger.debug(`[authService] Found identityCred => ${identityCred.id}`);

        // 3) Request a verification offer from the external service (without QR)
        const stateId = uuidv4();
        const requestBody = {
            request_credentials: [
                {
                    type: "CustomIdentityCredential",
                    format: "jwt_vc_json"
                }
            ]
        };
        const headers = {
            'Content-Type': 'application/json',
            'authorizeBaseUrl': 'openid4vp://authorize',
            'responseMode': 'direct_post',
            // Callback for the verification result
            'statusCallbackUri': `${process.env.VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackWalletLogin/${stateId}`
        };

        logger.debug(`[authService] POST -> ${process.env.WALTID_VERIFIER_URL}/openid4vc/verify, state=${stateId}`);
        const offerResp = await axios.post(
            `${process.env.WALTID_VERIFIER_URL}/openid4vc/verify`,
            requestBody,
            { headers }
        );
        const verificationUrl = offerResp.data;
        logger.debug(`[authService] verificationUrl = ${verificationUrl}`);

        // 4) Store session data for automatic processing
        sessions[stateId] = {
            status: 'pending',
            verificationUrl,
            verificationResult: null,
            user: null,
            flow: 'automatic'
        };

        // 5) Automatically resolve the presentation request (instead of QR scanning)
        logger.debug('[authService] -> resolvePresentationRequest');
        const resolvedPresentationRequest = await resolvePresentationRequest(verificationUrl);
        logger.debug(`[authService] resolvedPresentationRequest = ${JSON.stringify(resolvedPresentationRequest, null, 2)}`);

        // Extract the presentationDefinition from the resolved presentation request
        const presentationDefinition = extractPresentationDefinition(resolvedPresentationRequest);
        logger.debug(`[authService] presentationDefinition: ${JSON.stringify(presentationDefinition, null, 2)}`);

        logger.debug('[authService] -> matchCredentialsForPresentation');
        const matchedCreds = await matchCredentialsForPresentation(presentationDefinition);
        if (!matchedCreds || !matchedCreds.length) {
            logger.error('[authService] No matching credentials found in the wallet');
            throw new Error('No matching credentials found in the wallet');
        }
        logger.debug(`[authService] matchedCreds => ${JSON.stringify(matchedCreds, null, 2)}`);

        // 6) Use the presentation request with the matched credential (using the first match)
        const selectedCredentialId = matchedCreds[0].id;
        logger.debug(`[authService] -> usePresentationRequest with credId=${selectedCredentialId}`);

        const useResp = await usePresentationRequest(
            did,
            resolvedPresentationRequest,
            [selectedCredentialId],
            null // No disclosures
        );
        logger.debug(`[authService] usePresentationRequest response => ${JSON.stringify(useResp, null, 2)}`);

        // 7) Return response indicating that automatic login has been initiated
        return {
            message: 'Automatic login initiated. Verification in progress. Poll /verification/session/:stateId',
            state: stateId,
            verificationUrl
        };
    },

    /**
     * Refreshes JWT tokens.
     *
     * This function verifies the provided refresh token, retrieves the corresponding user,
     * and generates new access and refresh tokens. The old refresh token is replaced with the new one.
     *
     * @async
     * @function refreshTokens
     * @param {string} refreshToken - The current refresh token.
     * @returns {Promise<Object>} An object containing the new accessToken and refreshToken.
     * @throws {Error} Throws an error if the refresh token is invalid or the user is not found.
     */
    async refreshTokens(refreshToken) {
        logger.debug(`[*] [authService] refreshTokens - refreshToken: ${refreshToken}`);
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            logger.warn('[!] Invalid refresh token');
            throw new Error('Invalid refresh token');
        }

        const user = await User.findById(decoded.sub);
        if (!user) {
            logger.warn(`[!] User with id=${decoded.sub} not found`);
            throw new Error('User not found');
        }

        if (!user.refreshTokens.includes(refreshToken)) {
            logger.warn('[!] Refresh token not recognized');
            throw new Error('Refresh token not recognized');
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
        // Replace the old refresh token with the new one
        user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();
        logger.debug('[*] Refresh token refreshed successfully');

        return { accessToken, refreshToken: newRefreshToken };
    }
};

/**
 * Helper function to extract the presentationDefinition from a resolved presentation request.
 *
 * Supports two cases:
 * 1. When the input is a string with query parameters (e.g., "openid4vp://...?presentation_definition=...").
 * 2. When the input is an object with a "presentation_definition" property.
 *
 * @function extractPresentationDefinition
 * @param {string|Object} resolvedPresentationRequest - The resolved presentation request.
 * @returns {Object} The parsed presentation definition.
 * @throws {Error} Throws an error if the presentation definition cannot be extracted.
 * @private
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
    // Case 1: Input is a string with query parameters
    if (typeof resolvedPresentationRequest === 'string') {
        const urlObj = new URL(resolvedPresentationRequest);
        const presDef = urlObj.searchParams.get('presentation_definition');
        if (!presDef) {
            throw new Error('No presentation_definition in resolvedPresentationRequest');
        }
        return JSON.parse(decodeURIComponent(presDef));

        // Case 2: Input is an object with a "presentation_definition" property
    } else if (typeof resolvedPresentationRequest === 'object') {
        if (resolvedPresentationRequest.presentation_definition) {
            return resolvedPresentationRequest.presentation_definition;
        }
    }

    // If neither case applies, throw an error
    throw new Error('Could not extract presentationDefinition');
}
