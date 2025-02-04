/**
 * @file verificationController.js
 * @description Controller for handling verification operations.
 * This module manages both manual verification (with QR) and automatic verification flows,
 * including the handling of various callbacks (e.g., statusCallback, statusCallbackAlta, and statusCallbackWalletLogin)
 * as well as session status retrieval.
 * @module controllers/verificationController
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const {
    findOrCreateOrUpdateUser,
    checkCredentialsRevocation,
    extractUserDataFromDecodedCredentialSubject,
    sessions
} = require('../utils/validations');
const User = require('../models/User');
const { generateTokens } = require('../utils/jwtUtils');
const logger = require('../../logger');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest,
    getOrSelectDidSomewhere
} = require('../services/presentationService');

const OFFER_EXPIRATION_MS = 60 * 1000;
const { WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL } = process.env;

module.exports = {
    /**
     * Initiates a manual verification offer.
     *
     * This endpoint sends a verification request to the external verification service (WaltID)
     * using the provided request body. It generates a unique stateId and stores a new session with status "pending".
     *
     * @async
     * @function offerVerification
     * @param {import('express').Request} req - Express request object containing the verification request body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing the verificationUrl and stateId.
     */
    async offerVerification(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Missing environment variables WALTID_VERIFIER_URL or VERIFIER_COORD_PUBLIC_URL' });
            }

            const stateId = uuidv4();
            const requestBody = req.body;

            const headers = {
                'Content-Type': 'application/json',
                'authorizeBaseUrl': 'openid4vp://authorize',
                'responseMode': 'direct_post',
                'statusCallbackUri': `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallback/${stateId}`
            };

            logger.debug(`[verificationController] -> POST ${WALTID_VERIFIER_URL}/openid4vc/verify (manual), stateId=${stateId}`);
            const response = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

            sessions[stateId] = {
                status: 'pending',
                verificationUrl: response.data,
                verificationResult: null
            };

            res.status(200).json({ verificationUrl: response.data, state: stateId });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Initiates an automatic verification offer for 3 credentials.
     *
     * This function generates a stateId and retrieves a list of issuer DIDs from the issuer coordinator.
     * It builds a verification request for exactly 3 credentials and sends it to the verification service.
     * The resulting verificationUrl and session data are stored, and then the function automatically
     * resolves the presentation request, matches credentials, and triggers the presentation request.
     *
     * @async
     * @function offerVerification3CredsAutomatic
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing a message, stateId, and verificationUrl.
     */
    async offerVerification3CredsAutomatic(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3CredsAutomatic - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({
                    error: 'Missing environment variables WALTID_VERIFIER_URL or VERIFIER_COORD_PUBLIC_URL'
                });
            }
            if (!ISS_COORD_URL) {
                return res.status(500).json({
                    error: 'Missing environment variable ISS_COORD_URL'
                });
            }

            // 1) Generate stateId
            const stateId = uuidv4();

            // 2) Retrieve allowed issuer DIDs
            const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
            const { issuers } = didsResponse.data || {};
            if (!issuers || issuers.length < 3) {
                return res.status(500).json({ error: 'Could not obtain 3 issuers' });
            }

            // 3) Prepare the verification request body for exactly 3 credentials
            const requestBody = {
                vp_policies: [
                    { policy: 'minimum-credentials', args: 3 },
                    { policy: 'maximum-credentials', args: 100 }
                ],
                vc_policies: [
                    'signature',
                    'expired',
                    'not-before',
                    'revoked_status_list',
                    {
                        policy: 'allowed-issuer',
                        args: issuers
                    }
                ],
                request_credentials: [
                    { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
                    { type: 'PassportCredential', format: 'jwt_vc_json' },
                    { type: 'EmployerRegistrationCredential', format: 'jwt_vc_json' }
                ]
            };

            // 4) Call the verification service
            const headers = {
                'Content-Type': 'application/json',
                authorizeBaseUrl: 'openid4vp://authorize',
                responseMode: 'direct_post',
                statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
            };

            logger.debug(`[verificationController] -> POST ${WALTID_VERIFIER_URL}/openid4vc/verify, stateId=${stateId}`);
            const responseWalt = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

            const verificationUrl = responseWalt.data;

            // 5) Store session data with expiration
            sessions[stateId] = {
                status: 'pending',
                verificationUrl,
                verificationResult: null,
                type: 'alta',
                expiresAt: Date.now() + OFFER_EXPIRATION_MS
            };

            // ============== AUTOMATIC PART: resolve, match, and use the presentation request ==============
            logger.debug('[offerVerification3CredsAutomatic] -> resolvePresentationRequest');
            const resolvedPresentationRequest = await resolvePresentationRequest(verificationUrl);
            logger.debug(`[offerVerification3CredsAutomatic] resolvedPresentationRequest = ${JSON.stringify(resolvedPresentationRequest, null, 2)}`);

            const presentationDefinition = extractPresentationDefinition(resolvedPresentationRequest);
            logger.debug(`[offerVerification3CredsAutomatic] presentationDefinition = ${JSON.stringify(presentationDefinition, null, 2)}`);

            logger.debug('[offerVerification3CredsAutomatic] -> matchCredentialsForPresentation');
            const matchedCreds = await matchCredentialsForPresentation(presentationDefinition);
            if (!matchedCreds || matchedCreds.length < 3) {
                logger.error('[offerVerification3CredsAutomatic] Less than 3 matching credentials found in wallet');
                sessions[stateId].status = 'failed';
                return res.status(400).json({ error: 'No matching 3 credentials in the wallet' });
            }

            // Select the credential IDs (this example assumes all returned credentials are needed)
            const selectedCredsIds = matchedCreds.map(c => c.id);

            // Retrieve a default DID from the wallet or another source
            const did = await getOrSelectDidSomewhere();

            logger.debug('[offerVerification3CredsAutomatic] -> usePresentationRequest with selected credentials');
            const useResp = await usePresentationRequest(
                did,
                resolvedPresentationRequest,
                selectedCredsIds,
                null // No disclosures
            );
            logger.debug(`[offerVerification3CredsAutomatic] useResp = ${JSON.stringify(useResp, null, 2)}`);

            // 6) Return information for polling by the frontend
            return res.status(200).json({
                message: 'Automatic verification for 3 credentials initiated. Check callback for results.',
                state: stateId,
                verificationUrl
            });
        } catch (err) {
            logger.error('[offerVerification3CredsAutomatic] Error:', err.message);
            next(err);
        }
    },

    /**
     * Initiates a manual verification offer for 3 credentials.
     *
     * Similar to the automatic version, this endpoint prepares a verification request for exactly 3 credentials,
     * but it is intended for a manual flow (e.g., using QR codes).
     *
     * @async
     * @function offerVerification3Creds
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing the verificationUrl and stateId.
     */
    async offerVerification3Creds(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3Creds - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Missing environment variables WALTID_VERIFIER_URL or VERIFIER_COORD_PUBLIC_URL' });
            }
            if (!ISS_COORD_URL) {
                return res.status(500).json({ error: 'Missing environment variable ISS_COORD_URL' });
            }

            const stateId = uuidv4();
            const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
            const { issuers } = didsResponse.data;
            if (!issuers || issuers.length < 3) {
                return res.status(500).json({ error: 'Could not obtain 3 issuer DIDs' });
            }

            const requestBody = {
                vp_policies: [
                    { policy: 'minimum-credentials', args: 3 },
                    { policy: 'maximum-credentials', args: 100 }
                ],
                vc_policies: [
                    'signature',
                    'expired',
                    'not-before',
                    'revoked_status_list',
                    {
                        policy: 'allowed-issuer',
                        args: issuers
                    }
                ],
                request_credentials: [
                    { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
                    { type: 'PassportCredential', format: 'jwt_vc_json' },
                    { type: 'EmployerRegistrationCredential', format: 'jwt_vc_json' }
                ]
            };

            const headers = {
                'Content-Type': 'application/json',
                'authorizeBaseUrl': 'openid4vp://authorize',
                'responseMode': 'direct_post',
                'statusCallbackUri': `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
            };

            logger.debug(`[verificationController] -> POST ${WALTID_VERIFIER_URL}/openid4vc/verify (3 creds manual), stateId=${stateId}`);
            const response = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

            sessions[stateId] = {
                status: 'pending',
                verificationUrl: response.data,
                verificationResult: null,
                type: 'alta',
                expiresAt: Date.now() + OFFER_EXPIRATION_MS
            };

            res.status(200).json({ verificationUrl: response.data, state: stateId });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Processes the status callback for a verification (Alta) process.
     *
     * This endpoint is called by the verification service after the verification process completes.
     * It updates the session status based on the verification result and processes tokens,
     * decodes the credential JWTs, verifies required credentials, checks for revocation,
     * and updates or creates the user record accordingly.
     *
     * @async
     * @function statusCallbackAlta
     * @param {import('express').Request} req - Express request object with stateId as a URL parameter and verification data in the body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a success message if processed successfully.
     */
    async statusCallbackAlta(req, res, next) {
        try {
            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const { verificationResult, tokenResponse } = verificationData;
            sessions[stateId].verificationResult = verificationResult;
            sessions[stateId].status = verificationResult === true ? 'verified' : 'failed';

            if (verificationResult === true) {
                const vpToken = tokenResponse && tokenResponse.vp_token;
                if (!vpToken) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'vp_token not found' });
                }

                const vpDecoded = jwt.decode(vpToken);
                const credentialsJwt = vpDecoded?.vp?.verifiableCredential;
                if (!credentialsJwt || credentialsJwt.length < 3) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Required 3 credentials not presented' });
                }

                const decodedCreds = credentialsJwt.map(c => jwt.decode(c));

                const hasIdentity = decodedCreds.some(c => c?.vc?.type?.includes('CustomIdentityCredential'));
                const hasPassport = decodedCreds.some(c => c?.vc?.type?.includes('PassportCredential'));
                const hasEmployer = decodedCreds.some(c => c?.vc?.type?.includes('EmployerRegistrationCredential'));

                if (!hasIdentity || !hasPassport || !hasEmployer) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Missing required credentials (Identity, Passport, Employer)' });
                }

                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'One of the credentials is revoked' });
                }

                const identityCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('CustomIdentityCredential'));
                const passportCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('PassportCredential'));
                const employerCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('EmployerRegistrationCredential'));

                if (!identityCredDecoded) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Identity credential not found' });
                }

                // Extract identity data and process address information
                const idData = extractUserDataFromDecodedCredentialSubject(identityCredDecoded.vc.credentialSubject);

                let fullAddress = '';
                if (passportCredDecoded && passportCredDecoded.vc?.credentialSubject) {
                    if (idData.currentAddress && idData.currentAddress.length > 0) {
                        fullAddress = idData.currentAddress.join(', ');
                    } else {
                        const ps = passportCredDecoded.vc.credentialSubject;
                        fullAddress = ps.placeOfBirth ? ps.placeOfBirth : 'Calle Ejemplo 123, Madrid';
                    }
                } else {
                    fullAddress = idData.currentAddress && idData.currentAddress.length > 0 ? idData.currentAddress.join(', ') : 'Calle Ejemplo 123, Madrid';
                }

                if (!employerCredDecoded || !employerCredDecoded.vc?.credentialSubject) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Employer credential could not be extracted' });
                }

                const employerSubject = employerCredDecoded.vc.credentialSubject;
                const employerName = employerSubject.employerName || 'Empresa de Servicios S.A.';
                const contributionAccountCode = employerSubject.employerContributionAccountCode || '0111-2222-33-4444444444';
                const socialSecurityRegime = employerSubject.socialSecurityRegime || 'Régimen General';
                const collectiveAgreements = employerSubject.collectiveAgreements || [
                    'Convenio Colectivo de Empresas de Servicios Generales',
                    'Convenio Colectivo Sectorial'
                ];

                const user = await findOrCreateOrUpdateUser(idData, 'manual');
                user.hasAltaCredential = true;
                user.altaIssueDate = new Date();
                await user.save();

                // Set a placeholder token (in production, use a proper token)
                const token = "example-alta-token";
                sessions[stateId].user = user;
                sessions[stateId].token = token;
                sessions[stateId].employerData = {
                    employerName,
                    contributionAccountCode,
                    socialSecurityRegime,
                    collectiveAgreements
                };
                sessions[stateId].userAddress = fullAddress;
            }

            res.status(200).send('Status callback alta processed successfully');
        } catch (err) {
            next(err);
        }
    },

    /**
     * Processes a generic verification callback for a single credential.
     *
     * This endpoint updates the session with the verification result,
     * decodes the provided vp_token, checks revocation, and creates/updates the user.
     * It then generates new access and refresh tokens for the user.
     *
     * @async
     * @function statusCallback
     * @param {import('express').Request} req - Express request object containing stateId in params and verification data in the body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a success message upon processing the callback.
     */
    async statusCallback(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallback - start');

            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const { verificationResult } = verificationData;
            sessions[stateId].verificationResult = verificationResult;
            sessions[stateId].status = verificationResult ? 'verified' : 'failed';

            if (verificationResult) {
                const vpToken = verificationData.tokenResponse && verificationData.tokenResponse.vp_token;
                if (!vpToken) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No vp_token' });
                }

                logger.debug(`[verificationController] VP token => ${vpToken}`);
                const vpDecoded = jwt.decode(vpToken);
                logger.debug(`[verificationController] vpDecoded => ${JSON.stringify(vpDecoded, null, 2)}`);

                const credentialsJwt = vpDecoded?.vp?.verifiableCredential || [];
                if (!credentialsJwt.length) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Required credential missing' });
                }

                // Check for revocation
                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Credential is revoked' });
                }

                const vcDecoded = jwt.decode(credentialsJwt[0]);
                logger.debug(`[verificationController] vcDecoded => ${JSON.stringify(vcDecoded, null, 2)}`);

                const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
                const user = await findOrCreateOrUpdateUser(userData, 'manual');
                const { accessToken, refreshToken } = generateTokens(user._id.toString());
                user.refreshTokens.push(refreshToken);
                await user.save();

                sessions[stateId].user = user;
                sessions[stateId].token = accessToken;
                sessions[stateId].refreshToken = refreshToken;
            }

            res.status(200).json({ message: 'statusCallback processed successfully' });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Processes a special verification callback for wallet login.
     *
     * Similar to the generic callback, this endpoint is specifically used for the
     * "/verification/statusCallbackWalletLogin/:stateId" route. It updates the user with the "automatic" flow,
     * generates new tokens, and saves the user in the session.
     *
     * @async
     * @function statusCallbackWalletLogin
     * @param {import('express').Request} req - Express request object with stateId in params and verification data in the body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing a message and the session status.
     */
    async statusCallbackWalletLogin(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallbackWalletLogin - start');

            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const { verificationResult } = verificationData;
            sessions[stateId].verificationResult = verificationResult;
            sessions[stateId].status = verificationResult ? 'verified' : 'failed';

            if (verificationResult) {
                const vpToken = verificationData.tokenResponse && verificationData.tokenResponse.vp_token;
                if (!vpToken) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No vp_token' });
                }
                logger.debug(`[verificationController] (walletLogin) VP token => ${vpToken}`);

                const vpDecoded = jwt.decode(vpToken);
                logger.debug(`[verificationController] (walletLogin) vpDecoded => ${JSON.stringify(vpDecoded, null, 2)}`);

                const credentialsJwt = vpDecoded?.vp?.verifiableCredential || [];
                if (!credentialsJwt.length) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Identity credential missing' });
                }

                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Credential revoked' });
                }

                const vcDecoded = jwt.decode(credentialsJwt[0]);
                logger.debug(`[verificationController] (walletLogin) vcDecoded => ${JSON.stringify(vcDecoded, null, 2)}`);

                const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
                const user = await findOrCreateOrUpdateUser(userData, 'automatic');

                const { accessToken, refreshToken } = generateTokens(user._id.toString());
                user.refreshTokens.push(refreshToken);
                await user.save();

                sessions[stateId].user = user;
                sessions[stateId].token = accessToken;
                sessions[stateId].refreshToken = refreshToken;
            }

            res.status(200).json({ message: 'statusCallbackWalletLogin processed', status: sessions[stateId].status });
        } catch (err) {
            next(err);
        }
    },

    /**
     * Retrieves the current verification session status.
     *
     * This endpoint returns the status of the verification session (e.g., pending, verified, failed, expired)
     * along with token information and user details if available.
     *
     * @async
     * @function getVerificationSession
     * @param {import('express').Request} req - Express request object containing stateId in params.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing the session status, tokens, and user data.
     */
    async getVerificationSession(req, res, next) {
        try {
            const { stateId } = req.params;
            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Session not found' });
            }

            const sessionData = sessions[stateId];
            if (sessionData.expiresAt && Date.now() > sessionData.expiresAt && sessionData.status === 'pending') {
                sessionData.status = 'expired';
            }

            let userResponse = null;
            if (sessionData.user && sessionData.user.documentNumber) {
                const u = await User.findOne({ documentNumber: sessionData.user.documentNumber });
                if (u) {
                    userResponse = {
                        firstName: u.firstName,
                        familyName: u.familyName,
                        documentNumber: u.documentNumber,
                        currentAddress: u.currentAddress,
                        hasAltaCredential: u.hasAltaCredential,
                        altaIssueDate: u.altaIssueDate,
                        gender: u.gender,
                        nationality: u.nationality,
                        birthDate: u.birthDate,
                        nss: u.nss,
                        altaCredentialData: u.altaCredentialData || null
                    };
                }
            }

            res.status(200).json({
                status: sessionData.status,
                token: sessionData.token || null,
                refreshToken: sessionData.refreshToken || null,
                user: userResponse
            });
        } catch (err) {
            next(err);
        }
    }
};

/**
 * Extracts the presentation definition from a resolved presentation request.
 *
 * The function supports two cases:
 * 1. When the input is a string with query parameters (e.g., "openid4vp://...?presentation_definition=...").
 * 2. When the input is an object with a "presentation_definition" property.
 *
 * @function extractPresentationDefinition
 * @param {string|Object} resolvedPresentationRequest - The resolved presentation request.
 * @returns {Object} The parsed presentation definition.
 * @throws {Error} If the presentation definition cannot be extracted.
 * @private
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
    // Case 1: String with query parameters
    if (typeof resolvedPresentationRequest === 'string') {
        const urlObj = new URL(resolvedPresentationRequest);
        const presDef = urlObj.searchParams.get('presentation_definition');
        if (!presDef) {
            throw new Error('No presentation_definition in resolvedPresentationRequest');
        }
        return JSON.parse(decodeURIComponent(presDef));
    }
    // Case 2: Object with a presentation_definition property
    else if (typeof resolvedPresentationRequest === 'object') {
        if (resolvedPresentationRequest.presentation_definition) {
            return resolvedPresentationRequest.presentation_definition;
        }
    }
    // If neither case applies, throw an error
    throw new Error('Could not extract presentationDefinition');
}
