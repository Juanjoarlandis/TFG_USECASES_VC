// src/controllers/issuanceController.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { sessions } = require('../utils/validations');
const User = require('../models/User');

const { VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

module.exports = {
    async offerIssuance(req, res, next) {
        try {
            const { stateId } = req.body;
            if (!sessions[stateId] || !sessions[stateId].user) {
                return res.status(404).json({ error: 'No hay usuario asociado a esta sesión o no existe la sesión' });
            }

            const user = sessions[stateId].user;
            if (!user.hasAltaCredential) {
                return res.status(400).json({ error: 'El usuario no tiene una alta pendiente de emisión' });
            }

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
            const codigoCuentaCotizacion = employerData.contributionAccountCode;

            const revocationId = uuidv4();

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
                        "codigoCuentaCotizacion": codigoCuentaCotizacion
                    }
                }
            };

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

            const dbUser = await User.findOne({ documentNumber: user.documentNumber });
            if (dbUser) {
                dbUser.altaCredentialJti = revocationId;
                dbUser.altaCredentialData = altaCredential;
                await dbUser.save();
            }

            const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
            const issuanceRequestBody = {
                issuerKey: issuerKey,
                issuerDid: issuerDid,
                credentialConfigurationId,
                credentialData: altaCredential,
                "mapping": {
                    "id": "<uuid>",
                    "issuer": {
                        "id": "<issuerDid>"
                    },
                    "credentialSubject": {
                        "id": "<subjectDid>"
                    },
                    "issuanceDate": "<timestamp>",
                    "expirationDate": "<timestamp-in:365d>"
                },
                "authenticationMethod": "PRE_AUTHORIZED"
            };

            const issueResponse = await axios.post(`${WALTID_ISSUER_URL}/openid4vc/jwt/issue`, issuanceRequestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'statusCallbackUri': callbackUrl
                }
            });

            sessions[stateId].user = dbUser;
            sessions[stateId].issuanceOfferUrl = issueResponse.data;
            sessions[stateId].issuanceStatus = 'offered';

            res.status(200).json({ issuanceOfferUrl: issueResponse.data, state: stateId });
        } catch (err) {
            next(err);
        }
    },

    async issuanceStatusCallback(req, res, next) {
        try {
            const { stateId } = req.params;
            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            sessions[stateId].issuanceStatus = 'accepted';
            res.status(200).json({ message: 'Issuance callback processed successfully' });
        } catch (err) {
            next(err);
        }
    },

    async getIssuanceSessionStatus(req, res, next) {
        try {
            const { stateId } = req.params;
            if (!sessions[stateId]) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            const { issuanceStatus } = sessions[stateId];
            res.status(200).json({ issuanceStatus: issuanceStatus || 'unknown' });
        } catch (err) {
            next(err);
        }
    }
};
