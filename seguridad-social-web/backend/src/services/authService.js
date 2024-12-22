const HolderSessionManager = require('./HolderSessionManager');
const { verifyRefreshToken, generateTokens } = require('../utils/jwtUtils');
const { getUserInfo, listDIDs, listCredentials } = require('./walletService');
const { sessions } = require('../utils/validations');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const logger = require('../../logger');

// Funciones para presentar la credencial sin QR
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
} = require('./presentationService');

/**
 * authService.js
 * --------------
 * Maneja el flujo de login "automático" (sin QR visible) para credenciales de identidad,
 * realizando la verificación mediante OID4VC directamente desde el backend.
 */
module.exports = {
    /**
     * loginAndVerifyIdentityCredential:
     *  1) Autentica en la wallet con email y password.
     *  2) Pide a WaltId una oferta de verificación (CustomIdentityCredential).
     *  3) Resuelve localmente la presentation request (sin QR).
     *  4) Hace match de credencial.
     *  5) Usa la credencial (presenta).
     *  6) Espera callback en `/verification/statusCallbackWalletLogin/:stateId`.
     */
    async loginAndVerifyIdentityCredential(email, password) {
        logger.debug(`[authService] loginAndVerifyIdentityCredential - Start with email=${email}`);

        // 1) Login en la wallet
        await HolderSessionManager.loginHolderWithCredentials(email, password);
        logger.debug('[authService] HolderSessionManager.loginHolderWithCredentials OK.');

        // 2) Obtenemos token y walletId
        const token = await HolderSessionManager.getToken();
        const walletId = HolderSessionManager.getWalletId();
        if (!walletId) {
            logger.error('[authService] No walletId found after login');
            throw new Error('No walletId found after login');
        }
        logger.debug(`[authService] token? ${!!token}, walletId=${walletId}`);

        // Info extra del holder (opcional)
        const userInfo = await getUserInfo(token);
        logger.debug(`[authService] userInfo: ${JSON.stringify(userInfo, null, 2)}`);

        // Listar DIDs en la wallet (opcional para logs)
        const dids = await listDIDs(token, walletId);
        logger.debug(`[authService] DIDs => ${JSON.stringify(dids, null, 2)}`);
        const did = (dids[0] && dids[0].did) || null;
        if (!did) {
            logger.error('[authService] DID not found in wallet');
            throw new Error('No DID found in wallet');
        }

        // (Opcional) Comprobamos que exista una credencial de identidad. 
        // No es la "verificación" real, pero sirve para saber si la wallet *tiene* la cred.
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

        // 3) Pedimos a walt.id una "offer" para verificar (sin QR).
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
            // Callback donde nos dirán si la credencial era válida o no
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

        // Guardamos en sessions
        sessions[stateId] = {
            status: 'pending',
            verificationUrl,
            verificationResult: null,
            user: null,
            flow: 'automatic'
        };

        // 4) En lugar de dar "verificationUrl" al frontend para que escanee un QR,
        //    resolvemos directamente en el backend.
        logger.debug('[authService] -> resolvePresentationRequest');
        const resolvedPresentationRequest = await resolvePresentationRequest(verificationUrl);
        logger.debug(`[authService] resolvedPresentationRequest = ${JSON.stringify(resolvedPresentationRequest, null, 2)}`);

        // 5) Extraer la presentationDefinition de resolvedPresentationRequest
        //    (puede venir como string con query params o como objeto con { presentation_definition })
        const presentationDefinition = extractPresentationDefinition(resolvedPresentationRequest);
        logger.debug(`[authService] presentationDefinition: ${JSON.stringify(presentationDefinition, null, 2)}`);

        logger.debug('[authService] -> matchCredentialsForPresentation');
        const matchedCreds = await matchCredentialsForPresentation(presentationDefinition);
        if (!matchedCreds || !matchedCreds.length) {
            logger.error('[authService] No matched creds for CustomIdentityCredential');
            throw new Error('No matching credentials found in the wallet');
        }
        logger.debug(`[authService] matchedCreds => ${JSON.stringify(matchedCreds, null, 2)}`);

        // 6) usePresentationRequest con la credencial matcheada (matchedCreds[0].id)
        const selectedCredentialId = matchedCreds[0].id;
        logger.debug(`[authService] -> usePresentationRequest with credId=${selectedCredentialId}`);

        const useResp = await usePresentationRequest(
            did,
            resolvedPresentationRequest,
            [selectedCredentialId],
            null // sin disclosures
        );
        logger.debug(`[authService] usePresentationRequest response => ${JSON.stringify(useResp, null, 2)}`);

        // 7) Devolvemos algo; la verificación se completará en el callback
        return {
            message: 'Login automático iniciado. Verificación en curso. Poll /verification/session/:stateId',
            state: stateId,
            verificationUrl
        };
    },

    /**
     * refreshTokens: refresca un token JWT estándar.
     */
    async refreshTokens(refreshToken) {
        logger.debug(`[*] [authService] refreshTokens - refreshToken: ${refreshToken}`);
        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            logger.warn('[!] Refresh token inválido');
            throw new Error('Invalid refresh token');
        }

        const user = await User.findById(decoded.sub);
        if (!user) {
            logger.warn(`[!] User with id=${decoded.sub} not found`);
            throw new Error('User not found');
        }

        if (!user.refreshTokens.includes(refreshToken)) {
            logger.warn('[!] Refresh token no reconocido');
            throw new Error('Refresh token not recognized');
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
        user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();
        logger.debug('[*] Refresh token refrescado con éxito');

        return { accessToken, refreshToken: newRefreshToken };
    }
};

/**
 * Función de ayuda para extraer la "presentationDefinition" de un string
 * con query params o de un objeto con la definición en su interior.
 * Ajusta o refina según lo que walt.id te devuelva en "resolvedPresentationRequest".
 */
function extractPresentationDefinition(resolvedPresentationRequest) {
    // Caso 1: es string con query params (ej: "openid4vp://...?presentation_definition=...")
    if (typeof resolvedPresentationRequest === 'string') {
        const urlObj = new URL(resolvedPresentationRequest);
        const presDef = urlObj.searchParams.get('presentation_definition');
        if (!presDef) {
            throw new Error('No presentation_definition in resolvedPresentationRequest');
        }
        return JSON.parse(decodeURIComponent(presDef));

        // Caso 2: es un objeto con la clave presentation_definition
    } else if (typeof resolvedPresentationRequest === 'object') {
        if (resolvedPresentationRequest.presentation_definition) {
            return resolvedPresentationRequest.presentation_definition;
        }
    }

    // Si nada de lo anterior, lanzamos error
    throw new Error('Could not extract presentationDefinition');
}
