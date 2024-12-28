// src/services/verificationService.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../../logger');

const {
    findOrCreateOrUpdateUser,
    checkCredentialsRevocation,
    extractUserDataFromDecodedCredentialSubject
} = require('../utils/validations');
const sessionStore = require('../utils/sessionStore'); // Asegúrate de que usa Redis
const User = require('../models/User');
const { generateTokens } = require('../utils/jwtUtils');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest,
    getOrSelectDidSomewhere
} = require('./presentationService');

// Config/env
const OFFER_EXPIRATION_MS = 60 * 1000;
const { WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL } = process.env;

/**
 * Función auxiliar que extrae la `presentation_definition` 
 * del "resolvedPresentationRequest" que walt.id devuelve.
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
    // Caso 1: es string con query params (por ej: openid4vp://...?presentation_definition=...)
    if (typeof resolvedPresentationRequest === 'string') {
        const urlObj = new URL(resolvedPresentationRequest);
        const presDef = urlObj.searchParams.get('presentation_definition');
        if (!presDef) {
            throw new Error('No presentation_definition in resolvedPresentationRequest');
        }
        return JSON.parse(decodeURIComponent(presDef));
    }

    // Caso 2: es objeto con { presentation_definition }
    else if (typeof resolvedPresentationRequest === 'object') {
        if (resolvedPresentationRequest.presentation_definition) {
            return resolvedPresentationRequest.presentation_definition;
        }
    }

    throw new Error('Could not extract presentationDefinition');
}

module.exports = {
    /**
     * Genera una oferta de verificación OID4VC para una sola credencial.
     * @param {object} requestBody - los datos para la verificación (por ej. request_credentials, etc.)
     * @returns {object} - { stateId, verificationUrl }
     */
    async offerVerificationOneCred(requestBody) {
        if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
            const err = new Error('Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL');
            err.status = 500;
            throw err;
        }

        // Generar stateId
        const stateId = uuidv4();

        // Cabeceras exigidas por walt.id
        const headers = {
            'Content-Type': 'application/json',
            authorizeBaseUrl: 'openid4vp://authorize',
            responseMode: 'direct_post',
            statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallback/${stateId}`
        };

        // Llamada a walt.id
        const response = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

        // Guardar en Redis
        const sessionData = {
            status: 'pending',
            verificationUrl: response.data,
            verificationResult: null
        };
        await sessionStore.setSession(stateId, sessionData);

        return {
            stateId,
            verificationUrl: response.data
        };
    },

    /**
     * Genera una oferta de verificación OID4VC para un caso "3 creds" de forma manual.
     * @returns {object} - { stateId, verificationUrl }
     */
    async offerVerification3CredsManual() {
        if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL || !ISS_COORD_URL) {
            const err = new Error('Faltan variables de entorno (WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL)');
            err.status = 500;
            throw err;
        }

        // Generamos stateId
        const stateId = uuidv4();

        // Pedir DIDs de issuers al issuer_coord (ejemplo)
        const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
        const { issuers } = didsResponse.data;
        if (!issuers || issuers.length < 3) {
            const err = new Error('No se pudieron obtener los 3 DIDs de los issuers');
            err.status = 500;
            throw err;
        }

        // Body para walt.id (pidiendo EXACTAMENTE 3 credenciales)
        const requestBody = {
            vp_policies: [
                { policy: 'minimum-credentials', args: 3 },
                { policy: 'maximum-credentials', args: 100 }
            ],
            vc_policies: [
                'signature',
                'expired',
                'not-before',
                {
                    policy: 'webhook',
                    args: 'http://issuer_coord:5500/webhook-verify'
                },
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
            authorizeBaseUrl: 'openid4vp://authorize',
            responseMode: 'direct_post',
            statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
        };

        const response = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

        // Creamos la sesión
        const sessionData = {
            status: 'pending',
            verificationUrl: response.data,
            verificationResult: null,
            type: 'alta',
            expiresAt: Date.now() + OFFER_EXPIRATION_MS
        };
        await sessionStore.setSession(stateId, sessionData);

        return {
            stateId,
            verificationUrl: response.data
        };
    },

    /**
     * Genera una oferta de verificación "3 creds" y ejecuta la verificación automáticamente en backend.
     * @returns {object} - { message, state, verificationUrl }
     */
    async offerVerification3CredsAutomatic() {
        if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL || !ISS_COORD_URL) {
            const err = new Error('Faltan variables de entorno (WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL)');
            err.status = 500;
            throw err;
        }

        const stateId = uuidv4();

        // Ejemplo: listar issuer DIDs
        const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
        const { issuers } = didsResponse.data;
        if (!issuers || issuers.length < 3) {
            const err = new Error('No se pudieron obtener los 3 issuers');
            err.status = 500;
            throw err;
        }

        // Body pidiendo EXACTAMENTE 3 credenciales
        const requestBody = {
            vp_policies: [
                { policy: 'minimum-credentials', args: 3 },
                { policy: 'maximum-credentials', args: 100 }
            ],
            vc_policies: [
                'signature',
                'expired',
                'not-before',
                {
                    policy: 'webhook',
                    args: 'http://issuer_coord:5500/webhook-verify'
                },
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
            authorizeBaseUrl: 'openid4vp://authorize',
            responseMode: 'direct_post',
            statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
        };

        const responseWalt = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });
        const verificationUrl = responseWalt.data;

        // Guardar en Redis
        const sessionData = {
            status: 'pending',
            verificationUrl,
            verificationResult: null,
            type: 'alta',
            expiresAt: Date.now() + 1 * 60 * 1000
        };
        await sessionStore.setSession(stateId, sessionData);

        // ============= Ejecución automática (sin QR) ============
        const resolvedPresentationRequest = await resolvePresentationRequest(verificationUrl);
        const presentationDefinition = extractPresentationDefinition(resolvedPresentationRequest);

        const matchedCreds = await matchCredentialsForPresentation(presentationDefinition);
        if (!matchedCreds || matchedCreds.length < 3) {
            sessionData.status = 'failed';
            await sessionStore.setSession(stateId, sessionData);
            const err = new Error('No matching 3 credentials in the wallet');
            err.status = 400;
            throw err;
        }

        const selectedCredsIds = matchedCreds.map((c) => c.id);
        const did = await getOrSelectDidSomewhere();

        await usePresentationRequest(did, resolvedPresentationRequest, selectedCredsIds, null);

        return {
            message: 'Verificación de 3 credenciales (alta automática) iniciada. Revisar callback.',
            state: stateId,
            verificationUrl
        };
    },

    /**
     * Maneja el callback "statusCallbackAlta" para 3 creds.
     * @param {string} stateId 
     * @param {object} verificationData 
     * @returns {void} - lanza errores o actualiza la sesión
     */
    async handleStatusCallbackAlta(stateId, verificationData) {
        let sessionData = await sessionStore.getSession(stateId);
        if (!sessionData) {
            const err = new Error('Sesión no encontrada');
            err.status = 404;
            throw err;
        }

        const { verificationResult, tokenResponse } = verificationData;
        sessionData.verificationResult = verificationResult;
        sessionData.status = verificationResult ? 'verified' : 'failed';

        if (verificationResult) {
            // Extraer vpToken
            const vpToken = tokenResponse && tokenResponse.vp_token;
            if (!vpToken) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('No se encontró el vp_token');
                err.status = 400;
                throw err;
            }

            const vpDecoded = jwt.decode(vpToken);
            const credentialsJwt = vpDecoded?.vp?.verifiableCredential;
            if (!credentialsJwt || credentialsJwt.length < 3) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('No se presentaron las 3 credenciales requeridas');
                err.status = 400;
                throw err;
            }

            // Validar credenciales, revocación, etc.
            const revoked = await checkCredentialsRevocation(credentialsJwt);
            if (revoked) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('Una de las credenciales está revocada');
                err.status = 400;
                throw err;
            }

            // Decodificar y extraer user
            // ... (similar a tu lógica actual)
            // ...
            // Por ejemplo, la cred de identidad:
            const decodedCreds = credentialsJwt.map((c) => jwt.decode(c));
            const identityCredDecoded = decodedCreds.find((c) => c?.vc?.type?.includes('CustomIdentityCredential'));
            if (!identityCredDecoded) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('No se encontró la credencial de identidad');
                err.status = 400;
                throw err;
            }

            const idData = extractUserDataFromDecodedCredentialSubject(identityCredDecoded.vc.credentialSubject);
            const user = await findOrCreateOrUpdateUser(idData, 'manual');
            user.hasAltaCredential = true;
            user.altaIssueDate = new Date();
            await user.save();

            // Rellenamos sessionData con campos
            sessionData.user = user;
            sessionData.token = 'ejemplo-de-token-alta';

            // ... etc. Empleador, userAddress, etc.
        }

        await sessionStore.setSession(stateId, sessionData);
    },

    /**
     * Maneja el callback genérico (1 cred).
     * @param {string} stateId 
     * @param {object} verificationData 
     */
    async handleStatusCallbackGeneric(stateId, verificationData) {
        let sessionData = await sessionStore.getSession(stateId);
        if (!sessionData) {
            const err = new Error('Sesión no encontrada');
            err.status = 404;
            throw err;
        }

        const { verificationResult } = verificationData;
        sessionData.verificationResult = verificationResult;
        sessionData.status = verificationResult ? 'verified' : 'failed';

        if (verificationResult) {
            const vpToken = verificationData.tokenResponse && verificationData.tokenResponse.vp_token;
            if (!vpToken) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('No vp_token');
                err.status = 400;
                throw err;
            }

            const vpDecoded = jwt.decode(vpToken);
            const credentialsJwt = vpDecoded?.vp?.verifiableCredential || [];
            if (!credentialsJwt.length) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('Falta la credencial requerida');
                err.status = 400;
                throw err;
            }

            // Revocación
            const revoked = await checkCredentialsRevocation(credentialsJwt);
            if (revoked) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('La credencial está revocada');
                err.status = 400;
                throw err;
            }

            // Decodificar
            const vcDecoded = jwt.decode(credentialsJwt[0]);
            const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);

            // Actualizar/crear user
            const user = await findOrCreateOrUpdateUser(userData, 'manual');
            // Generar tokens
            const { accessToken, refreshToken } = generateTokens(user._id.toString());
            user.refreshTokens.push(refreshToken);
            await user.save();

            sessionData.user = user;
            sessionData.token = accessToken;
            sessionData.refreshToken = refreshToken;
        }

        await sessionStore.setSession(stateId, sessionData);
    },

    /**
     * Maneja el callback "walletLogin" (flujo automático).
     * @param {string} stateId 
     * @param {object} verificationData 
     */
    async handleStatusCallbackWalletLogin(stateId, verificationData) {
        let sessionData = await sessionStore.getSession(stateId);
        if (!sessionData) {
            const err = new Error('Sesión no encontrada');
            err.status = 404;
            throw err;
        }

        const { verificationResult } = verificationData;
        sessionData.verificationResult = verificationResult;
        sessionData.status = verificationResult ? 'verified' : 'failed';

        if (verificationResult) {
            const vpToken = verificationData.tokenResponse && verificationData.tokenResponse.vp_token;
            if (!vpToken) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('No vp_token');
                err.status = 400;
                throw err;
            }

            const vpDecoded = jwt.decode(vpToken);
            const credentialsJwt = vpDecoded?.vp?.verifiableCredential || [];
            if (!credentialsJwt.length) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('Falta la credencial de identidad');
                err.status = 400;
                throw err;
            }

            // Revocación
            const revoked = await checkCredentialsRevocation(credentialsJwt);
            if (revoked) {
                sessionData.status = 'failed';
                await sessionStore.setSession(stateId, sessionData);
                const err = new Error('Credencial revocada');
                err.status = 400;
                throw err;
            }

            // Decodificar la primera cred (identidad)
            const vcDecoded = jwt.decode(credentialsJwt[0]);
            const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
            const user = await findOrCreateOrUpdateUser(userData, 'automatic');

            const { accessToken, refreshToken } = generateTokens(user._id.toString());
            user.refreshTokens.push(refreshToken);
            await user.save();

            sessionData.user = user;
            sessionData.token = accessToken;
            sessionData.refreshToken = refreshToken;
        }

        await sessionStore.setSession(stateId, sessionData);
    },

    /**
     * Devuelve la información de la sesión (status, user, etc.).
     * @param {string} stateId 
     * @returns {object} - { status, token, refreshToken, user }
     */
    async getVerificationSession(stateId) {
        let sessionData = await sessionStore.getSession(stateId);
        if (!sessionData) {
            const err = new Error('Sesión no encontrada');
            err.status = 404;
            throw err;
        }

        // Chequeo de expiración
        if (sessionData.expiresAt && Date.now() > sessionData.expiresAt && sessionData.status === 'pending') {
            sessionData.status = 'expired';
            await sessionStore.setSession(stateId, sessionData);
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

        return {
            status: sessionData.status,
            token: sessionData.token || null,
            refreshToken: sessionData.refreshToken || null,
            user: userResponse
        };
    }
};
