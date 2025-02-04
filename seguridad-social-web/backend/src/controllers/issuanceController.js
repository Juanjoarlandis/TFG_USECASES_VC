/**
 * @file issuanceController.js
 * @description Controller for handling credential issuance operations.
 * This module provides endpoints for offering an issuance, processing issuance status callbacks,
 * retrieving issuance session status, and claiming a credential.
 * @module controllers/issuanceController
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { sessions } = require('../utils/validations');
const User = require('../models/User');
const logger = require('../../logger');

const { VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

const HolderSessionManager = require('../services/HolderSessionManager');
const { listDIDs } = require('../services/walletService');

module.exports = {
    /**
     * Offers a credential issuance.
     *
     * This function verifies the session and user data stored in the sessions object,
     * constructs the credential (including worker and employer data), saves the credential
     * information in the database, and sends an issuance request to the external issuer service.
     * On success, it stores the issuance offer URL and status in the session.
     *
     * @async
     * @function offerIssuance
     * @param {import('express').Request} req - Express request object containing the session stateId in its body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing the issuance offer URL and stateId.
     */
    async offerIssuance(req, res, next) {
        try {
            // Log request body (for debugging purposes)
            console.log('[offerIssuance] Request body:', req.body);

            const { stateId } = req.body;
            console.log('[offerIssuance] Received stateId:', stateId);

            // Validate session existence and user presence
            if (!sessions[stateId]) {
                console.log('[offerIssuance] No session found for the provided stateId');
                return res.status(404).json({ error: 'No user associated with this session or session does not exist' });
            }
            if (!sessions[stateId].user) {
                console.log('[offerIssuance] Session exists but user is missing');
                return res.status(404).json({ error: 'No user in the session' });
            }

            const user = sessions[stateId].user;
            console.log('[offerIssuance] User documentNumber:', user.documentNumber);
            console.log('[offerIssuance] User hasAltaCredential:', user.hasAltaCredential);

            if (!user.hasAltaCredential) {
                console.log('[offerIssuance] User does not have an issuance pending');
                return res.status(400).json({ error: 'User does not have a pending issuance' });
            }

            // Retrieve additional session data or set defaults
            const employerData = sessions[stateId].employerData || {
                employerName: 'Empresa de Servicios S.A.',
                contributionAccountCode: '0111-2222-33-4444444444',
                socialSecurityRegime: 'Régimen General',
                collectiveAgreements: [
                    'Convenio Colectivo de Empresas de Servicios Generales',
                    'Convenio Colectivo Sectorial'
                ]
            };
            const userAddress = sessions[stateId].userAddress || 'Calle Ejemplo 123, Madrid';

            console.log('[offerIssuance] Employer data:', employerData);
            console.log('[offerIssuance] User address:', userAddress);

            // Construct worker data
            const apellidos = user.familyName || 'Perez';
            const nombre = user.firstName || 'Mario';
            const dni = user.documentNumber || '12345678A';
            const nss = user.nss || '123456789012';
            const domicilio = userAddress;
            const fechaInicioActividad = '2024-12-08';
            const grupoCotizacion = 'Grupo 4';
            const tipoContrato = 'Indefinido tiempo completo';
            const coeficienteJornada = '100%';
            const ocupacion = 'Administrativo';

            // Generate a unique revocation ID
            const revocationId = uuidv4();
            console.log('[offerIssuance] Generated revocationId:', revocationId);

            // Build the base credential data (altaCredential)
            const altaCredential = {
                "@context": [
                    "https://www.w3.org/ns/credentials/v2",
                    "https://www.w3.org/ns/credentials/examples/v2"
                ],
                "id": `urn:uuid:${revocationId}`,
                "type": ["VerifiableCredential", "SocialSecurityRegistrationCredential"],
                "issuer": {
                    "id": "did:web:tesoreria.seguridadsocial.gob.es",
                    "name": "Tesorería General de la Seguridad Social - España",
                    "description": "Issuer of the social security registration credential"
                },
                "name": "Social Security Registration Credential",
                "description": "Verifiable credential for registering in the social security system",
                "validFrom": "2024-12-08T10:19:28Z",
                "expirationDate": "2025-12-08T10:19:28Z",
                "category": "SocialSecurityEnrollment",
                "credentialSubject": {
                    "id": "did:web:trabajador.example.com",
                    "employer": {
                        "employerName": employerData.employerName,
                        "contributionAccountCode": employerData.contributionAccountCode,
                        "socialSecurityRegime": employerData.socialSecurityRegime,
                        "collectiveAgreements": employerData.collectiveAgreements
                    },
                    "worker": {
                        "apellidos": apellidos,
                        "nombre": nombre,
                        "dni": dni,
                        "nss": nss,
                        "domicilio": domicilio,
                        "fechaInicioActividad": fechaInicioActividad,
                        "grupoCotizacion": grupoCotizacion,
                        "tipoContrato": tipoContrato,
                        "coeficienteJornada": coeficienteJornada,
                        "ocupacion": ocupacion,
                        "codigoCuentaCotizacion": employerData.contributionAccountCode
                    }
                }
            };

            console.log('[offerIssuance] Constructed altaCredential:', altaCredential);

            // Save credential data in the database by updating the user record
            const dbUser = await User.findOne({ documentNumber: user.documentNumber });
            if (!dbUser) {
                console.log('[offerIssuance] No user found in DB with documentNumber:', user.documentNumber);
            } else {
                dbUser.altaCredentialJti = revocationId;
                dbUser.altaCredentialData = altaCredential;
                console.log('[offerIssuance] Updated dbUser with credential data');
                await dbUser.save();
            }

            // Build the callback URL for the issuance status callback
            const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
            console.log('[offerIssuance] Callback URL:', callbackUrl);

            // Prepare issuer data and the issuance request body
            const issuerDid = 'did:web:5a4b7b0ff4db.ngrok.app';
            const issuerKey = {
                "type": "jwk",
                "jwk": {
                    "kty": "OKP",
                    "d": "MQiwQ0LRJwY3_E6Hio4HXqb-owk8pNd_7lgBO1p6tac",
                    "crv": "Ed25519",
                    "kid": "SD44Rn7TCc8o8eWlOz-_G_pdBXhqufvAPiclQzsjP8w",
                    "x": "xXmUTXp7JyH9EMtjnObS7lZVtFPe0zEJKqrXxmElaCY"
                }
            };
            const credentialConfigurationId = "CustomIdentityCredential_jwt_vc_json";

            const issuanceRequestBody = {
                issuerKey,
                issuerDid,
                credentialConfigurationId,
                credentialData: altaCredential,
                mapping: {
                    "id": altaCredential.id,
                    "issuer": { "id": "<issuerDid>" },
                    "credentialSubject": { "id": "<subjectDid>" },
                    "issuanceDate": "<timestamp>",
                    "expirationDate": "<timestamp-in:365d>"
                },
                authenticationMethod: "PRE_AUTHORIZED"
            };

            console.log('[offerIssuance] Issuance request body:', issuanceRequestBody);

            // Call the external issuance service (WaltID Issuer)
            const issueResponse = await axios.post(
                `${WALTID_ISSUER_URL}/openid4vc/jwt/issue`,
                issuanceRequestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'statusCallbackUri': callbackUrl
                    }
                }
            );
            console.log('[offerIssuance] Issuance response data:', issueResponse.data);

            // Update the session with issuance offer data and status
            sessions[stateId].user = dbUser || user; // fallback if dbUser is not found
            sessions[stateId].issuanceOfferUrl = issueResponse.data;
            sessions[stateId].issuanceStatus = 'offered';

            console.log('[offerIssuance] Session after update:', sessions[stateId]);

            // Respond with the issuance offer URL and session state
            return res.status(200).json({ issuanceOfferUrl: issueResponse.data, state: stateId });
        } catch (err) {
            console.error('[offerIssuance] Error:', err);
            next(err);
        }
    },

    /**
     * Processes the issuance status callback.
     *
     * This endpoint is called by the external issuance service when the issuance is accepted.
     * It updates the session status to "accepted".
     *
     * @async
     * @function issuanceStatusCallback
     * @param {import('express').Request} req - Express request object containing stateId in params.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a success message upon updating the session.
     */
    async issuanceStatusCallback(req, res, next) {
        try {
            console.log('[issuanceStatusCallback] Params:', req.params);
            const { stateId } = req.params;

            if (!sessions[stateId]) {
                console.log('[issuanceStatusCallback] No session found for stateId:', stateId);
                return res.status(404).json({ error: 'Session not found' });
            }

            // Mark issuance as accepted in the session
            sessions[stateId].issuanceStatus = 'accepted';
            console.log('[issuanceStatusCallback] Issuance status set to accepted');

            res.status(200).json({ message: 'Issuance callback processed successfully' });
        } catch (err) {
            console.error('[issuanceStatusCallback] Error:', err);
            next(err);
        }
    },

    /**
     * Retrieves the current issuance session status.
     *
     * This endpoint returns the status of the issuance process stored in the session.
     *
     * @async
     * @function getIssuanceSessionStatus
     * @param {import('express').Request} req - Express request object containing stateId in params.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing the issuance status.
     */
    async getIssuanceSessionStatus(req, res, next) {
        try {
            console.log('[getIssuanceSessionStatus] Params:', req.params);
            const { stateId } = req.params;

            if (!sessions[stateId]) {
                console.log('[getIssuanceSessionStatus] No session exists for stateId:', stateId);
                return res.status(404).json({ error: 'Session not found' });
            }

            const { issuanceStatus } = sessions[stateId];
            console.log('[getIssuanceSessionStatus] Issuance status:', issuanceStatus);

            res.status(200).json({ issuanceStatus: issuanceStatus || 'unknown' });
        } catch (err) {
            console.error('[getIssuanceSessionStatus] Error:', err);
            next(err);
        }
    },

    /**
     * Claims the credential (Alta Credential) from the wallet.
     *
     * This function retrieves the issuance offer URL from the session and then calls the wallet API endpoint
     * to claim the credential. It requires the wallet token and wallet ID, selects a DID from the wallet,
     * and sends the claim request with a plain text payload. Upon successful claim, the session status is updated.
     *
     * @async
     * @function claimAltaCredential
     * @param {import('express').Request} req - Express request object containing stateId in its body.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Responds with a JSON object containing a success message and claimed credentials.
     */
    async claimAltaCredential(req, res, next) {
        try {
            console.log('[claimAltaCredential] Request body:', req.body);
            const { stateId } = req.body;
            console.log('[claimAltaCredential] Received stateId:', stateId);

            if (!stateId || !sessions[stateId]) {
                console.log('[claimAltaCredential] Invalid stateId or session not found');
                return res.status(400).json({ error: 'Invalid stateId or session does not exist' });
            }

            const issuanceOfferUrl = sessions[stateId].issuanceOfferUrl;
            console.log('[claimAltaCredential] issuanceOfferUrl from session:', issuanceOfferUrl);

            if (!issuanceOfferUrl) {
                return res.status(400).json({ error: 'No issuanceOfferUrl in session' });
            }

            // Retrieve token and wallet ID from HolderSessionManager
            const token = await HolderSessionManager.getToken();
            const walletId = await HolderSessionManager.getWalletId();
            console.log('[claimAltaCredential] Token available:', !!token, 'Wallet ID:', walletId);

            if (!token || !walletId) {
                return res.status(500).json({ error: 'Wallet session not found (missing token or walletId)' });
            }

            // Retrieve DID from the wallet
            const dids = await listDIDs(token, walletId);
            console.log('[claimAltaCredential] Retrieved DIDs:', dids);
            if (!dids || !dids.length) {
                return res.status(400).json({ error: 'No DIDs found in the wallet' });
            }
            const did = dids[0].did;
            console.log('[claimAltaCredential] Selected DID:', did);

            // Construct the URL for claiming the credential
            const useOfferUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(did)}&requireUserInput=false`;
            console.log('[claimAltaCredential] Claim URL:', useOfferUrl);
            console.log('[claimAltaCredential] Payload (issuanceOfferUrl):', issuanceOfferUrl);

            // Send the claim request with Content-Type 'text/plain'
            const resp = await axios.post(useOfferUrl, issuanceOfferUrl, {
                headers: {
                    'Content-Type': 'text/plain',
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('[claimAltaCredential] Wallet response:', resp.data);

            // Update the session status to 'claimed'
            sessions[stateId].issuanceStatus = 'claimed';

            return res.status(200).json({
                message: 'Credential claimed successfully',
                claimedCredentials: resp.data
            });
        } catch (err) {
            console.error('[claimAltaCredential] Error:', err);
            next(err);
        }
    }
};
