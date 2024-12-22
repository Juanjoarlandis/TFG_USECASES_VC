const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { findOrCreateOrUpdateUser, checkCredentialsRevocation, extractUserDataFromDecodedCredentialSubject, sessions } = require('../utils/validations');
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

/**
 * verificationController.js
 * -------------------------
 * Maneja la verificación "manual" (con QR) y la parte de callbacks en manual o para el 
 * login automático ("statusCallbackWalletLogin/:stateId").
 */
module.exports = {

    async offerVerification(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL' });
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

    async offerVerification3CredsAutomatic(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3CredsAutomatic - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({
                    error: 'Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL'
                });
            }
            if (!ISS_COORD_URL) {
                return res.status(500).json({
                    error: 'Falta la variable ISS_COORD_URL'
                });
            }

            // 1) Generar stateId
            const stateId = uuidv4();

            // 2) Obtener (opc.) la lista de DIDs permitidos (por ejemplo)
            const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
            const { issuers } = didsResponse.data || {};
            if (!issuers || issuers.length < 3) {
                return res.status(500).json({ error: 'No se pudieron obtener los 3 issuers' });
            }

            // 3) Preparar body pidiendo EXACTAMENTE 3 credenciales 
            const requestBody = {
                // Políticas de VP (ejemplo)
                vp_policies: [
                    { policy: 'minimum-credentials', args: 3 },
                    { policy: 'maximum-credentials', args: 100 }
                ],
                // Políticas de VC
                vc_policies: [
                    'signature',
                    'expired',
                    'not-before',
                    'revoked_status_list',
                    {
                        policy: 'allowed-issuer',
                        args: issuers  // array de DIDs permitidos
                    }
                ],
                // Tipos de credenciales requeridas
                request_credentials: [
                    { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
                    { type: 'PassportCredential', format: 'jwt_vc_json' },
                    { type: 'EmployerRegistrationCredential', format: 'jwt_vc_json' }
                ]
            };

            // 4) Llamamos a walt.id
            const headers = {
                'Content-Type': 'application/json',
                authorizeBaseUrl: 'openid4vp://authorize',
                responseMode: 'direct_post',
                // callback donde walt.id nos notificará el resultado => statusCallbackAlta
                statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
            };

            logger.debug(`[verificationController] -> POST ${WALTID_VERIFIER_URL}/openid4vc/verify, stateId=${stateId}`);
            const responseWalt = await axios.post(`${WALTID_VERIFIER_URL}/openid4vc/verify`, requestBody, { headers });

            const verificationUrl = responseWalt.data; // openid4vp://... ?

            // 5) Guardar en sessions
            sessions[stateId] = {
                status: 'pending',
                verificationUrl,
                verificationResult: null,
                type: 'alta',
                // por ejemplo, expiración en 1 minuto
                expiresAt: Date.now() + 1 * 60 * 1000
            };

            // ============== PARTE AUTOMÁTICA (resolvemos en backend) ==============
            logger.debug('[offerVerification3CredsAutomatic] -> resolvePresentationRequest');
            const resolvedPresentationRequest = await resolvePresentationRequest(verificationUrl);
            logger.debug(`[offerVerification3CredsAutomatic] resolvedPresentationRequest = ${JSON.stringify(resolvedPresentationRequest, null, 2)}`);

            // Extraer la presentationDefinition
            const presentationDefinition = extractPresentationDefinition(resolvedPresentationRequest);
            logger.debug(`[offerVerification3CredsAutomatic] presentationDefinition = ${JSON.stringify(presentationDefinition, null, 2)}`);

            // matchCredentialsForPresentation
            logger.debug('[offerVerification3CredsAutomatic] -> matchCredentialsForPresentation');
            const matchedCreds = await matchCredentialsForPresentation(presentationDefinition);
            if (!matchedCreds || matchedCreds.length < 3) {
                logger.error('[offerVerification3CredsAutomatic] No se encontraron 3 credenciales en la wallet');
                // Cambia el estado a 'failed'
                sessions[stateId].status = 'failed';
                return res.status(400).json({ error: 'No matching 3 credentials in the wallet' });
            }

            // Por si se devuelven muchas, filtramos las 3 que necesitamos
            // (OJO, esto depende de cómo walt.id devuelva matchedCreds: 
            //  puede que ya vengan 3 exactas, o vengan 5 y tengas que filtrar 
            //  por type=CustomIdentityCredential, etc.)
            // Ejemplo naive:
            const selectedCredsIds = matchedCreds.map(c => c.id);

            // DID "por defecto" (puedes haberlo tomado de HolderSessionManager)
            // O del token que tengas en tu "presentationService"
            const did = await getOrSelectDidSomewhere();

            logger.debug('[offerVerification3CredsAutomatic] -> usePresentationRequest con las 3 credenciales');
            const useResp = await usePresentationRequest(
                did,
                resolvedPresentationRequest,
                selectedCredsIds,
                null // sin disclosures
            );
            logger.debug(`[offerVerification3CredsAutomatic] useResp = ${JSON.stringify(useResp, null, 2)}`);

            // 6) Devolver info al frontend (stateId, por si quiere hacer polling, etc.)
            return res.status(200).json({
                message: 'Verificación de 3 credenciales (alta automática) iniciada. Revisar callback.',
                state: stateId,
                verificationUrl
            });
        } catch (err) {
            logger.error('[offerVerification3CredsAutomatic] Error:', err.message);
            next(err);
        }
    },

    // =============== Ejemplo: "offerVerification3Creds" (manual alta) ===============
    async offerVerification3Creds(req, res, next) {
        try {
            logger.debug('[verificationController] offerVerification3Creds - start');

            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL' });
            }
            if (!ISS_COORD_URL) {
                return res.status(500).json({ error: 'Falta la variable ISS_COORD_URL' });
            }

            const stateId = uuidv4();
            // Pedimos los 3 DIDs, etc. ejemplo
            const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
            const { issuers } = didsResponse.data;
            if (!issuers || issuers.length < 3) {
                return res.status(500).json({ error: 'No se pudieron obtener los 3 DIDs de los issuers' });
            }

            const requestBody = {
                vp_policies: [
                    { "policy": "minimum-credentials", "args": 3 },
                    { "policy": "maximum-credentials", "args": 100 }
                ],
                vc_policies: [
                    "signature",
                    "expired",
                    "not-before",
                    "revoked_status_list",
                    {
                        "policy": "allowed-issuer",
                        "args": issuers
                    }
                ],
                request_credentials: [
                    { "type": "CustomIdentityCredential", "format": "jwt_vc_json" },
                    { "type": "PassportCredential", "format": "jwt_vc_json" },
                    { "type": "EmployerRegistrationCredential", "format": "jwt_vc_json" }
                ]
            };

            const headers = {
                'Content-Type': 'application/json',
                'authorizeBaseUrl': 'openid4vp://authorize',
                'responseMode': 'direct_post',
                'statusCallbackUri': `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackAlta/${stateId}`
            };

            logger.debug(`[verificationController] -> POST ${WALTID_VERIFIER_URL}/openid4vc/verify (3 creds), stateId=${stateId}`);
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

    // =============== Callback para verificación del Alta ===============
    async statusCallbackAlta(req, res, next) {
        try {
            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            const { verificationResult, tokenResponse } = verificationData;
            sessions[stateId].verificationResult = verificationResult;
            sessions[stateId].status = verificationResult === true ? 'verified' : 'failed';

            if (verificationResult === true) {
                const vpToken = tokenResponse && tokenResponse.vp_token;
                if (!vpToken) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No se encontró el vp_token' });
                }

                const vpDecoded = jwt.decode(vpToken);
                const credentialsJwt = vpDecoded?.vp?.verifiableCredential;
                if (!credentialsJwt || credentialsJwt.length < 3) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No se presentaron las 3 credenciales requeridas' });
                }

                const decodedCreds = credentialsJwt.map(c => jwt.decode(c));

                const hasIdentity = decodedCreds.some(c => c?.vc?.type?.includes('CustomIdentityCredential'));
                const hasPassport = decodedCreds.some(c => c?.vc?.type?.includes('PassportCredential'));
                const hasEmployer = decodedCreds.some(c => c?.vc?.type?.includes('EmployerRegistrationCredential'));

                if (!hasIdentity || !hasPassport || !hasEmployer) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Faltan credenciales requeridas (Identidad, Pasaporte, Empleador)' });
                }

                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Una de las credenciales está revocada' });
                }

                const identityCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('CustomIdentityCredential'));
                const passportCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('PassportCredential'));
                const employerCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('EmployerRegistrationCredential'));

                if (!identityCredDecoded) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No se encontró la credencial de identidad' });
                }

                // Extraer datos de identidad
                const idData = extractUserDataFromDecodedCredentialSubject(identityCredDecoded.vc.credentialSubject);

                // Procesar dirección
                let fullAddress = '';
                if (passportCredDecoded && passportCredDecoded.vc?.credentialSubject) {
                    if (idData.currentAddress && idData.currentAddress.length > 0) {
                        fullAddress = idData.currentAddress.join(', ');
                    } else {
                        const ps = passportCredDecoded.vc.credentialSubject;
                        fullAddress = ps.placeOfBirth ? ps.placeOfBirth : "Calle Ejemplo 123, Madrid";
                    }
                } else {
                    if (idData.currentAddress && idData.currentAddress.length > 0) {
                        fullAddress = idData.currentAddress.join(', ');
                    } else {
                        fullAddress = "Calle Ejemplo 123, Madrid";
                    }
                }

                // Datos empleador
                if (!employerCredDecoded || !employerCredDecoded.vc?.credentialSubject) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'No se pudo extraer la credencial del empleador' });
                }

                const employerSubject = employerCredDecoded.vc.credentialSubject;
                const employerName = employerSubject.employerName || "Empresa de Servicios S.A.";
                const contributionAccountCode = employerSubject.employerContributionAccountCode || "0111-2222-33-4444444444";
                const socialSecurityRegime = employerSubject.socialSecurityRegime || "Régimen General";
                const collectiveAgreements = employerSubject.collectiveAgreements || ["Convenio Colectivo de Empresas de Servicios Generales", "Convenio Colectivo Sectorial"];

                const user = await findOrCreateOrUpdateUser(idData, 'manual');
                user.hasAltaCredential = true;
                user.altaIssueDate = new Date();
                await user.save();

                const token = "ejemplo-de-token-alta";
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

    // =============== Callback genérico (1 cred) ===============
    async statusCallback(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallback - start');

            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
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
                    return res.status(400).json({ error: 'Falta la credencial requerida' });
                }

                // Comprobar si revocada
                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'La credencial está revocada' });
                }

                // Decodificar la primera
                const vcDecoded = jwt.decode(credentialsJwt[0]);
                logger.debug(`[verificationController] vcDecoded => ${JSON.stringify(vcDecoded, null, 2)}`);

                // Extraer userData
                const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);

                // Crear/actualizar user
                const user = await findOrCreateOrUpdateUser(userData, 'manual');
                // Generar tokens
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

    // =============== Callback para "walletLogin" especial ===============
    // Similar al anterior, pero destinado a la ruta "/verification/statusCallbackWalletLogin/:stateId"
    // Se crea/actualiza el user y se emite token real, etc.
    async statusCallbackWalletLogin(req, res, next) {
        try {
            logger.debug('[verificationController] statusCallbackWalletLogin - start');

            const { stateId } = req.params;
            const verificationData = req.body;

            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
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
                    return res.status(400).json({ error: 'Falta la credencial de identidad' });
                }

                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Credencial revocada' });
                }

                // Decodificar la credencial 0
                const vcDecoded = jwt.decode(credentialsJwt[0]);
                logger.debug(`[verificationController] (walletLogin) vcDecoded => ${JSON.stringify(vcDecoded, null, 2)}`);

                const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
                // Creamos/actualizamos usuario con flow=automatic
                const user = await findOrCreateOrUpdateUser(userData, 'automatic');

                // Generar tokens
                const { accessToken, refreshToken } = generateTokens(user._id.toString());
                user.refreshTokens.push(refreshToken);
                await user.save();

                // Almacenamos
                sessions[stateId].user = user;
                sessions[stateId].token = accessToken;
                sessions[stateId].refreshToken = refreshToken;
            }

            res.status(200).json({ message: 'statusCallbackWalletLogin processed', status: sessions[stateId].status });
        } catch (err) {
            next(err);
        }
    },

    // =============== Consultar estado de la sesión ===============
    async getVerificationSession(req, res, next) {
        try {
            const { stateId } = req.params;
            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
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
