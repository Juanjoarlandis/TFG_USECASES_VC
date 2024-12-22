// src/controllers/issuanceController.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { sessions } = require('../utils/validations');
const User = require('../models/User');

// Puedes usar un logger más completo (winston, pino, etc.) o console.log
const logger = require('../../logger');

const { VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

// Si estás usando HolderSessionManager y listDIDs en claimAltaCredential
const HolderSessionManager = require('../services/HolderSessionManager');
const { listDIDs } = require('../services/walletService');

module.exports = {
    async offerIssuance(req, res, next) {
        try {
            console.log('[offerIssuance] => BODY:', req.body);

            const { stateId } = req.body;
            console.log('[offerIssuance] => stateId recibido:', stateId);

            // Verificamos la sesión
            if (!sessions[stateId]) {
                console.log('[offerIssuance] => ¡No existe sessions[stateId]!');
                return res.status(404).json({ error: 'No hay usuario asociado a esta sesión o no existe la sesión' });
            }
            if (!sessions[stateId].user) {
                console.log('[offerIssuance] => ¡sessions[stateId] existe pero .user es falsy!');
                return res.status(404).json({ error: 'No hay usuario en la sesión' });
            }

            const user = sessions[stateId].user;
            console.log('[offerIssuance] => user.documentNumber:', user.documentNumber);
            console.log('[offerIssuance] => user.hasAltaCredential:', user.hasAltaCredential);

            if (!user.hasAltaCredential) {
                console.log('[offerIssuance] => El usuario no tiene hasAltaCredential=true');
                return res.status(400).json({ error: 'El usuario no tiene una alta pendiente de emisión' });
            }

            // Recuperamos datos extra de la sesión
            const employerData = sessions[stateId].employerData || {
                employerName: "Empresa de Servicios S.A.",
                contributionAccountCode: "0111-2222-33-4444444444",
                socialSecurityRegime: "Régimen General",
                collectiveAgreements: [
                    "Convenio Colectivo de Empresas de Servicios Generales",
                    "Convenio Colectivo Sectorial"
                ]
            };
            const userAddress = sessions[stateId].userAddress || "Calle Ejemplo 123, Madrid";

            console.log('[offerIssuance] => employerData:', employerData);
            console.log('[offerIssuance] => userAddress:', userAddress);

            // Construimos datos del trabajador
            const apellidos = user.familyName || "Perez";
            const nombre = user.firstName || "Mario";
            const dni = user.documentNumber || "12345678A";
            const nss = user.nss || "123456789012";
            const domicilio = userAddress;
            const fechaInicioActividad = "2024-12-08";
            const grupoCotizacion = "Grupo 4";
            const tipoContrato = "Indefinido tiempo completo";
            const coeficienteJornada = "100%";
            const ocupacion = "Administrativo";

            const revocationId = uuidv4();
            console.log('[offerIssuance] => revocationId (UUID):', revocationId);

            // Credencial base
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
                    "description": "Entidad emisora de la credencial de alta en la Seguridad Social"
                },
                "name": "Credencial de Alta en la Seguridad Social",
                "description": "Credencial verificable de alta en el régimen de la Seguridad Social del trabajador",
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

            console.log('[offerIssuance] => altaCredential:', altaCredential);

            // Guardamos en DB
            const dbUser = await User.findOne({ documentNumber: user.documentNumber });
            if (!dbUser) {
                console.log('[offerIssuance] => No se encontró dbUser con documentNumber=', user.documentNumber);
            } else {
                dbUser.altaCredentialJti = revocationId;
                dbUser.altaCredentialData = altaCredential;
                console.log('[offerIssuance] => dbUser, set altaCredentialJti y altaCredentialData');
                await dbUser.save();
            }

            // Llamada de issuance
            const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
            console.log('[offerIssuance] => callbackUrl =', callbackUrl);

            const issuerDid = "did:web:5a4b7b0ff4db.ngrok.app";
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

            console.log('[offerIssuance] => issuanceRequestBody:', issuanceRequestBody);

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
            console.log('[offerIssuance] => issueResponse.data =', issueResponse.data);

            // Guardamos en la sesión
            sessions[stateId].user = dbUser || user; // por si dbUser no existe
            sessions[stateId].issuanceOfferUrl = issueResponse.data;
            sessions[stateId].issuanceStatus = 'offered';

            console.log('[offerIssuance] => sessions[stateId] después de guardar =>', sessions[stateId]);

            // Responder al front
            return res.status(200).json({ issuanceOfferUrl: issueResponse.data, state: stateId });
        } catch (err) {
            console.error('[offerIssuance] => Error:', err);
            next(err);
        }
    },

    async issuanceStatusCallback(req, res, next) {
        try {
            console.log('[issuanceStatusCallback] => params:', req.params);
            const { stateId } = req.params;

            if (!sessions[stateId]) {
                console.log('[issuanceStatusCallback] => Sesión no encontrada para stateId=', stateId);
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            // Asumimos que si llegó aquí, la issuance fue aceptada
            sessions[stateId].issuanceStatus = 'accepted';
            console.log('[issuanceStatusCallback] => issuanceStatus se marcó como accepted');

            res.status(200).json({ message: 'Issuance callback processed successfully' });
        } catch (err) {
            console.error('[issuanceStatusCallback] => Error:', err);
            next(err);
        }
    },

    async getIssuanceSessionStatus(req, res, next) {
        try {
            console.log('[getIssuanceSessionStatus] => params:', req.params);
            const { stateId } = req.params;

            if (!sessions[stateId]) {
                console.log('[getIssuanceSessionStatus] => No existe la sesión para stateId=', stateId);
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            const { issuanceStatus } = sessions[stateId];
            console.log('[getIssuanceSessionStatus] => issuanceStatus=', issuanceStatus);

            res.status(200).json({ issuanceStatus: issuanceStatus || 'unknown' });
        } catch (err) {
            console.error('[getIssuanceSessionStatus] => Error:', err);
            next(err);
        }
    },

    async claimAltaCredential(req, res, next) {
        try {
            console.log('[claimAltaCredential] => BODY:', req.body);
            const { stateId } = req.body;
            console.log('[claimAltaCredential] => stateId recibido:', stateId);

            if (!stateId || !sessions[stateId]) {
                console.log('[claimAltaCredential] => stateId inválido o no existe la sesión');
                return res.status(400).json({ error: 'stateId inválido o no existe la sesión' });
            }

            const issuanceOfferUrl = sessions[stateId].issuanceOfferUrl;
            console.log('[claimAltaCredential] => issuanceOfferUrl en sesión=', issuanceOfferUrl);

            if (!issuanceOfferUrl) {
                return res.status(400).json({ error: 'No hay issuanceOfferUrl en la sesión' });
            }

            // Obtenemos token y walletId de la wallet
            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            console.log('[claimAltaCredential] => token?', !!token, ' walletId=', walletId);

            if (!token || !walletId) {
                return res
                    .status(500)
                    .json({ error: 'No se encontró sesión de la wallet (token o walletId)' });
            }

            // DID del holder
            const dids = await listDIDs(token, walletId);
            console.log('[claimAltaCredential] => dids =', dids);
            if (!dids || !dids.length) {
                return res.status(400).json({ error: 'No se encontraron DIDs en la wallet' });
            }
            const did = dids[0].did;
            console.log('[claimAltaCredential] => selected did=', did);

            // URL del endpoint de waltid para reclamar la cred
            const useOfferUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(did)}&requireUserInput=false`;
            console.log('[claimAltaCredential] => POST ->', useOfferUrl);
            console.log('[claimAltaCredential] => Body (issuanceOfferUrl)=', issuanceOfferUrl);

            // Aqui el cambio esencial: 'Content-Type': 'text/plain'
            // y enviamos `issuanceOfferUrl` tal cual (sin JSON.stringify).
            const resp = await axios.post(useOfferUrl, issuanceOfferUrl, {
                headers: {
                    'Content-Type': 'text/plain',
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('[claimAltaCredential] => wallet response =>', resp.data);

            // Marcamos como 'claimed'
            sessions[stateId].issuanceStatus = 'claimed';

            return res.status(200).json({
                message: 'Credencial de Alta reclamada con éxito',
                claimedCredentials: resp.data
            });
        } catch (err) {
            console.error('[claimAltaCredential] => Error:', err);
            next(err);
        }
    }
};
