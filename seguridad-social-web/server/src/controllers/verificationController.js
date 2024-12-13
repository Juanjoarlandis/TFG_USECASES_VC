// src/controllers/verificationController.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { findOrCreateOrUpdateUser, checkCredentialsRevocation, extractUserDataFromDecodedCredentialSubject, sessions } = require('../utils/validations');
const User = require('../models/User');

const OFFER_EXPIRATION_MS = 60 * 1000; // 1 minuto
const { WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL } = process.env;

module.exports = {
    async offerVerification(req, res, next) {
        try {
            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Faltan variables de entorno' });
            }
            const stateId = uuidv4();
            const requestBody = req.body;

            const headers = {
                'Content-Type': 'application/json',
                'authorizeBaseUrl': 'openid4vp://authorize',
                'responseMode': 'direct_post',
                'statusCallbackUri': `${VERIFIER_COORD_PUBLIC_URL}/verification/statusCallback/${stateId}`
            };

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

    async offerVerification3Creds(req, res, next) {
        try {
            if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
                return res.status(500).json({ error: 'Faltan variables de entorno' });
            }

            if (!ISS_COORD_URL) {
                return res.status(500).json({ error: 'Falta la variable de entorno ISS_COORD_URL' });
            }

            const stateId = uuidv4();
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

                const user = await findOrCreateOrUpdateUser(idData);
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

    async statusCallback(req, res, next) {
        try {
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

                const vpDecoded = jwt.decode(vpToken);
                const credentialsJwt = vpDecoded.vp && vpDecoded.vp.verifiableCredential ? vpDecoded.vp.verifiableCredential : [];
                if (credentialsJwt.length < 1) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'Falta la credencial requerida' });
                }

                const revoked = await checkCredentialsRevocation(credentialsJwt);
                if (revoked) {
                    sessions[stateId].status = 'failed';
                    return res.status(400).json({ error: 'La credencial está revocada' });
                }

                const vcDecoded = jwt.decode(credentialsJwt[0]);
                const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
                const user = await findOrCreateOrUpdateUser(userData);

                const token = "ejemplo-de-token";
                sessions[stateId].user = user;
                sessions[stateId].token = token;
            }

            res.status(200).send('Status callback processed successfully');
        } catch (err) {
            next(err);
        }
    },

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
                        personalNumber: u.personalNumber,
                        laserEngravedSerial: u.laserEngravedSerial,
                        dniIssueDate: u.dniIssueDate,
                        canNumber: u.canNumber,
                        sex: u.sex,
                        placeOfBirth: u.placeOfBirth,
                        ascendants: u.ascendants,
                        issuingTeamCode: u.issuingTeamCode,
                        altaCredentialData: u.altaCredentialData || null
                    };
                }
            }

            res.status(200).json({
                status: sessionData.status,
                token: sessionData.token || null,
                user: userResponse
            });
        } catch (err) {
            next(err);
        }
    }
};
