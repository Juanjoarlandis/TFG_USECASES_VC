/**
 * @file app.js
 * @description Backend de la aplicación utilizando Express.js, MongoDB y JWT para la gestión de credenciales y usuarios.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

/**
 * @typedef {Object} RevokedCredential
 * @property {String} credentialId - Identificador único de la credencial revocada.
 */

/**
 * Esquema de Mongoose para credenciales revocadas.
 */
const RevokedCredentialSchema = new mongoose.Schema({
    credentialId: { type: String, unique: true }
});
const RevokedCredential = mongoose.model('RevokedCredential', RevokedCredentialSchema);

const sessions = {}; // Almacenamiento de sesiones en memoria

const OFFER_EXPIRATION_MS = 1 * 60 * 1000; // 1 minuto de expiración, ajustar según necesidades

/**
 * Middleware para registrar las solicitudes entrantes y las respuestas salientes.
 */
app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body:', Object.keys(req.body).length > 0 ? JSON.stringify(req.body, null, 2) : '{}');
    next();
});

/**
 * Encuentra un usuario existente o crea/actualiza uno nuevo con los datos proporcionados.
 *
 * @param {Object} userData - Datos del usuario a encontrar o crear.
 * @returns {Promise<User>} El usuario encontrado o creado.
 */
async function findOrCreateOrUpdateUser(userData) {
    let user = await User.findOne({ documentNumber: userData.documentNumber });
    if (!user) {
        user = new User({
            firstName: userData.firstName,
            familyName: userData.familyName,
            documentNumber: userData.documentNumber,
            currentAddress: userData.currentAddress || [],
            gender: userData.gender,
            nationality: userData.nationality,
            birthDate: userData.birthDate,
            nss: userData.nss,
            personalNumber: userData.personalNumber,
            laserEngravedSerial: userData.laserEngravedSerial,
            dniIssueDate: userData.dniIssueDate,
            canNumber: userData.canNumber,
            sex: userData.sex,
            placeOfBirth: userData.placeOfBirth,
            ascendants: userData.ascendants,
            issuingTeamCode: userData.issuingTeamCode,
            hasAltaCredential: false,
            altaIssueDate: null,
            altaCredentialJti: null
        });
    } else {
        user.firstName = userData.firstName;
        user.familyName = userData.familyName;
        user.currentAddress = userData.currentAddress || user.currentAddress;
        user.gender = userData.gender;
        user.nationality = userData.nationality;
        user.birthDate = userData.birthDate;
        user.nss = userData.nss;
        user.personalNumber = userData.personalNumber;
        user.laserEngravedSerial = userData.laserEngravedSerial;
        user.dniIssueDate = userData.dniIssueDate;
        user.canNumber = userData.canNumber;
        user.sex = userData.sex;
        user.placeOfBirth = userData.placeOfBirth;
        user.ascendants = userData.ascendants;
        user.issuingTeamCode = userData.issuingTeamCode;
    }
    await user.save();
    return user;
}

/**
 * Decodifica una credencial JWT completa.
 *
 * @param {String} jwtCredential - La credencial JWT a decodificar.
 * @returns {Object|null} El objeto decodificado o null si falla.
 */
function decodeVC(jwtCredential) {
    return jwt.decode(jwtCredential);
}

/**
 * Extrae los datos del usuario del sujeto de la credencial decodificada.
 *
 * @param {Object} cs - El sujeto de la credencial decodificada.
 * @returns {Object} Datos extraídos del usuario.
 */
function extractUserDataFromDecodedCredentialSubject(cs) {
    let firstName = '';
    let familyName = '';
    let documentNumber = '';
    let currentAddress = [];

    let gender = '';
    let nationality = '';
    let birthDate = null;
    let nss = '';

    let personalNumber = '';
    let laserEngravedSerial = '';
    let dniIssueDate = null;
    let canNumber = '';
    let sex = '';

    let placeOfBirth = {};
    let ascendants = [];
    let issuingTeamCode = '';

    if (cs.dni) {
        documentNumber = cs.dni.identifier || '';
        firstName = cs.dni.givenName || '';
        familyName = cs.dni.familyName || '';
        gender = cs.dni.gender || '';
        nationality = cs.dni.nationality || '';
        nss = cs.dni.nss || '';
        if (cs.dni.birthDate) {
            birthDate = new Date(cs.dni.birthDate);
        }

        // frontSide
        if (cs.dni.frontSide) {
            personalNumber = cs.dni.frontSide.personalNumber || '';
            laserEngravedSerial = cs.dni.frontSide.laserEngravedSerial || '';
            canNumber = cs.dni.frontSide.canNumber || '';
            sex = cs.dni.frontSide.sex || '';
            if (cs.dni.frontSide.issueDate) {
                dniIssueDate = new Date(cs.dni.frontSide.issueDate);
            }
        }

        // backSide
        if (cs.dni.backSide) {
            if (cs.dni.backSide.address) {
                const addr = cs.dni.backSide.address;
                currentAddress = [
                    addr.street || '',
                    addr.locality || '',
                    addr.province || '',
                    addr.country || '',
                    addr.postalCode || ''
                ].filter(Boolean);
            }
            if (cs.dni.backSide.placeOfBirth) {
                placeOfBirth = {
                    locality: cs.dni.backSide.placeOfBirth.locality || '',
                    province: cs.dni.backSide.placeOfBirth.province || '',
                    country: cs.dni.backSide.placeOfBirth.country || ''
                };
            }
            if (Array.isArray(cs.dni.backSide.ascendants)) {
                ascendants = cs.dni.backSide.ascendants.map(a => ({
                    givenName: a.givenName || '',
                    familyName: a.familyName || ''
                }));
            }
            issuingTeamCode = cs.dni.backSide.issuingTeamCode || '';
        }
    }

    return {
        firstName,
        familyName,
        documentNumber,
        currentAddress,
        gender,
        nationality,
        birthDate,
        nss,
        personalNumber,
        laserEngravedSerial,
        dniIssueDate,
        canNumber,
        sex,
        placeOfBirth,
        ascendants,
        issuingTeamCode
    };
}

/**
 * Extrae los datos del usuario necesarios para la emisión de una credencial de alta.
 *
 * @param {Array<String>} credentialsJwtArray - Array de credenciales JWT.
 * @returns {Object} Datos de identidad del usuario.
 * @throws {Error} Si no se encuentra la credencial de identidad.
 */
function extractUserDataForAlta(credentialsJwtArray) {
    const decodedCreds = credentialsJwtArray.map(jwtCred => jwt.decode(jwtCred));
    const identityCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('CustomIdentityCredential'));
    if (!identityCredDecoded) {
        throw new Error('No se encontró la credencial de identidad');
    }

    const idData = extractUserDataFromDecodedCredentialSubject(identityCredDecoded.vc.credentialSubject);

    const residenceCredDecoded = decodedCreds.find(c =>
        c.vc && (c.vc.type.includes('PassportCh') || c.vc.type.includes('ProofOfResidenceCredential'))
    );

    if (residenceCredDecoded && residenceCredDecoded.vc.credentialSubject && Array.isArray(residenceCredDecoded.vc.credentialSubject.address)) {
        idData.currentAddress = residenceCredDecoded.vc.credentialSubject.address;
    }

    return { idData };
}

/**
 * Verifica si una credencial está revocada.
 *
 * @param {String} credentialId - Identificador de la credencial.
 * @returns {Promise<Boolean>} True si está revocada, false en caso contrario.
 */
async function isCredentialRevoked(credentialId) {
    const revoked = await RevokedCredential.findOne({ credentialId });
    return !!revoked;
}

/**
 * Verifica si alguna de las credenciales presentadas está revocada.
 *
 * @param {Array<String>} credentialsJwtArray - Array de credenciales JWT.
 * @returns {Promise<Boolean>} True si alguna está revocada, false en caso contrario.
 */
async function checkCredentialsRevocation(credentialsJwtArray) {
    for (let jwtCred of credentialsJwtArray) {
        const vcDecoded = decodeVC(jwtCred);
        if (!vcDecoded) {
            // Sin decodificación no podemos continuar
            return true;
        }
        // Prioriza jti, si no existe, usa vc.id
        let credId = vcDecoded.jti || (vcDecoded.vc && vcDecoded.vc.id ? vcDecoded.vc.id : null);
        if (!credId) {
            return true;
        }
        const revoked = await isCredentialRevoked(credId);
        if (revoked) return true;
    }
    return false;
}

const { WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

/**
 * @route POST /verification/offer
 * @description Endpoint para una verificación simple de credenciales.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.post('/verification/offer', async (req, res) => {
    if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
        return res.status(500).json({ error: 'Faltan variables de entorno' });
    }

    const stateId = uuidv4();
    const requestBody = req.body;

    try {
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
    } catch (error) {
        console.error('Error en /verification/offer:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /verification/offer3creds
 * @description Endpoint para una verificación que requiere tres credenciales:
 * CustomIdentityCredential, PassportCredential y EmployerRegistrationCredential
 * para proceder con la emisión de la credencial de Alta.
 */
app.post('/verification/offer3creds', async (req, res) => {
    if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
        return res.status(500).json({ error: 'Faltan variables de entorno' });
    }

    const stateId = uuidv4();
    const requestBody = {
        vp_policies: [
            { "policy": "minimum-credentials", "args": 3 },
            { "policy": "maximum-credentials", "args": 100 }
        ],
        vc_policies: [
            "signature",
            "expired",
            "not-before",
            "revoked_status_list"
        ],
        request_credentials: [
            { "type": "CustomIdentityCredential", "format": "jwt_vc_json" },
            { "type": "PassportCredential", "format": "jwt_vc_json" },
            { "type": "EmployerRegistrationCredential", "format": "jwt_vc_json" }
        ]
    };

    try {
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
    } catch (error) {
        console.error('Error en /verification/offer3creds:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /verification/statusCallbackAlta/:stateId
 * @description Callback para procesar el resultado de la verificación de alta con 3 credenciales.
 * Ahora se requieren las 3 credenciales: Identidad, Pasaporte y Registro del Empleador.
 */
app.post('/verification/statusCallbackAlta/:stateId', async (req, res) => {
    const { stateId } = req.params;
    const verificationData = req.body;

    if (!sessions[stateId]) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const { verificationResult } = verificationData;
    sessions[stateId].verificationResult = verificationResult;
    sessions[stateId].status = verificationResult === true ? 'verified' : 'failed';

    if (verificationResult === true) {
        const vpToken = verificationData.tokenResponse && verificationData.tokenResponse.vp_token;
        if (!vpToken) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'No se encontró el vp_token' });
        }

        const vpDecoded = jwt.decode(vpToken);
        const credentialsJwt = vpDecoded.vp && vpDecoded.vp.verifiableCredential ? vpDecoded.vp.verifiableCredential : [];

        if (credentialsJwt.length < 3) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'No se presentaron las 3 credenciales requeridas' });
        }

        const decodedCreds = credentialsJwt.map(c => jwt.decode(c));
        const hasIdentity = decodedCreds.some(c => c?.vc?.type?.includes('CustomIdentityCredential'));
        const hasPassport = decodedCreds.some(c => c?.vc?.type?.includes('PassportCredential'));
        const hasEmployer = decodedCreds.some(c => c?.vc?.type?.includes('EmployerRegistrationCredential'));

        if (!hasIdentity || !hasPassport || !hasEmployer) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'Faltan una o más de las credenciales requeridas (Identidad, Pasaporte, Empleador)' });
        }

        // Verificar revocación
        const revoked = await checkCredentialsRevocation(credentialsJwt);
        if (revoked) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'Una de las credenciales está revocada' });
        }

        // Extraer credenciales
        const identityCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('CustomIdentityCredential'));
        const passportCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('PassportCredential'));
        const employerCredDecoded = decodedCreds.find(c => c.vc && c.vc.type.includes('EmployerRegistrationCredential'));

        if (!identityCredDecoded) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'No se encontró la credencial de identidad (requerida)' });
        }

        // Datos de usuario (identidad)
        const idData = extractUserDataFromDecodedCredentialSubject(identityCredDecoded.vc.credentialSubject);

        // Extraer dirección completa del pasaporte (si tiene)
        let fullAddress = '';
        if (passportCredDecoded && passportCredDecoded.vc.credentialSubject) {
            // Aquí asumimos que hay datos suficientes para formar una dirección
            // Por ejemplo, si el pasaporte no contiene una dirección tan detallada,
            // se podría combinar con la identidad. Ajustar según el esquema real.
            const ps = passportCredDecoded.vc.credentialSubject;
            // Si el pasaporte no trae dirección, podemos usar la de idData.currentAddress
            if (idData.currentAddress && idData.currentAddress.length > 0) {
                fullAddress = idData.currentAddress.join(', ');
            } else {
                // Sin dirección en Identity, inventamos o usamos pasaporte si tuviera:
                // Ajustar según la info real del pasaporte:
                fullAddress = ps.placeOfBirth ? ps.placeOfBirth : "Calle Ejemplo 123, Madrid";
            }
        } else {
            // Si no hay pasaporte o no tiene dirección, usamos la de identidad:
            if (idData.currentAddress && idData.currentAddress.length > 0) {
                fullAddress = idData.currentAddress.join(', ');
            } else {
                fullAddress = "Calle Ejemplo 123, Madrid";
            }
        }

        // Datos del empleador
        if (!employerCredDecoded || !employerCredDecoded.vc || !employerCredDecoded.vc.credentialSubject) {
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

        // Guardamos también datos del empleador y la dirección completa del usuario en la sesión para usarlos en la emisión
        sessions[stateId].employerData = {
            employerName,
            contributionAccountCode,
            socialSecurityRegime,
            collectiveAgreements
        };

        sessions[stateId].userAddress = fullAddress;
    }

    res.status(200).send('Status callback alta processed successfully');
});

/**
 * @route POST /issuance/offer
 * @description Endpoint para ofrecer la emisión de una credencial de alta.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.post('/issuance/offer', async (req, res) => {
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

    // Datos del trabajador
    const apellidos = user.familyName || "Perez";
    const nombre = user.firstName || "Mario";
    const dni = user.documentNumber || "12345678A";
    const nss = user.nss || "123456789012";
    const domicilio = userAddress; // dirección completa obtenida del paso anterior
    const fechaInicioActividad = "2024-12-08"; // puede ser fija o dinámica
    const grupoCotizacion = "Grupo 4";
    const tipoContrato = "Indefinido tiempo completo";
    const coeficienteJornada = "100%";
    const ocupacion = "Administrativo";
    const codigoCuentaCotizacion = employerData.contributionAccountCode;

    const revocationId = uuidv4();

    // Construimos la credencial final de Alta según el ejemplo proporcionado
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

    // Como ya no usamos "AltaSeguridadSocialCredential", cambiamos credentialConfigurationId 
    // si es necesario. Aquí asumimos que "CustomIdentityCredential_jwt_vc_json" 
    // puede seguir usándose, o configuramos uno para "SocialSecurityRegistrationCredential".
    const credentialConfigurationId = "CustomIdentityCredential_jwt_vc_json";

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

    try {
        const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
        const issueResponse = await axios.post(`${WALTID_ISSUER_URL}/openid4vc/jwt/issue`, issuanceRequestBody, {
            headers: {
                'Content-Type': 'application/json',
                'statusCallbackUri': callbackUrl
            }
        });

        const issuedCredentialJwt = issueResponse.data;
        const dbUser = await User.findOne({ documentNumber: user.documentNumber });
        if (dbUser) {
            dbUser.altaCredentialJti = revocationId;
            await dbUser.save();
        }

        sessions[stateId].user = dbUser;
        sessions[stateId].issuanceOfferUrl = issuedCredentialJwt;
        sessions[stateId].issuanceStatus = 'offered';

        res.status(200).json({ issuanceOfferUrl: issuedCredentialJwt, state: stateId });
    } catch (error) {
        console.error('Error emitiendo credencial:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @route POST /issuance/statusCallback/:stateId
 * @description Callback para procesar el resultado de la emisión de una credencial.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.post('/issuance/statusCallback/:stateId', async (req, res) => {
    const { stateId } = req.params;

    if (!sessions[stateId]) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Asumimos que la llamada del callback significa credencial aceptada.
    // Si WaltID manda datos adicionales, puedes analizarlos aquí.
    sessions[stateId].issuanceStatus = 'accepted';

    res.status(200).json({ message: 'Issuance callback processed successfully' });
});

/**
 * @route GET /issuance/session/:stateId
 * @description Endpoint para consultar el estado de la emisión de una credencial.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.get('/issuance/session/:stateId', async (req, res) => {
    const { stateId } = req.params;
    if (!sessions[stateId]) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const { issuanceStatus } = sessions[stateId];
    res.status(200).json({ issuanceStatus: issuanceStatus || 'unknown' });
});

/**
 * @route POST /verification/statusCallback/:stateId
 * @description Callback genérico para procesar el resultado de una verificación.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.post('/verification/statusCallback/:stateId', async (req, res) => {
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

        // Comprobar revocación
        const revoked = await checkCredentialsRevocation(credentialsJwt);
        if (revoked) {
            sessions[stateId].status = 'failed';
            return res.status(400).json({ error: 'La credencial está revocada' });
        }

        const vcDecoded = decodeVC(credentialsJwt[0]);
        const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
        const user = await findOrCreateOrUpdateUser(userData);

        const token = "ejemplo-de-token";
        sessions[stateId].user = user;
        sessions[stateId].token = token;
    }

    res.status(200).send('Status callback processed successfully');
});

/**
 * @route GET /verification/session/:stateId
 * @description Endpoint para consultar el estado de una sesión de verificación.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.get('/verification/session/:stateId', async (req, res) => {
    const { stateId } = req.params;
    if (!sessions[stateId]) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const sessionData = sessions[stateId];

    // Comprobar expiración
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
                issuingTeamCode: u.issuingTeamCode
            };
        }
    }

    res.status(200).json({
        status: sessionData.status,
        token: sessionData.token || null,
        user: userResponse
    });
});

/**
 * @route POST /revocar-credencial
 * @description Endpoint para revocar una credencial basada en el DNI del usuario.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.post('/revocar-credencial', async (req, res) => {
    const { dni } = req.body;
    const user = await User.findOne({ documentNumber: dni });
    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    user.hasAltaCredential = false;
    user.altaIssueDate = null;
    await user.save();

    if (user.altaCredentialJti) {
        try {
            await RevokedCredential.create({ credentialId: user.altaCredentialJti });
        } catch (e) {
            if (e.code !== 11000) {
                console.error('Error añadiendo a la lista negra:', e);
            }
        }
    } else {
        console.warn('No se encontró altaCredentialJti en el usuario, no se pudo revocar en la lista negra.');
    }

    return res.status(200).json({ message: 'Credencial revocada con éxito', user });
});

/**
 * @route GET /user/:dni
 * @description Endpoint para obtener la información de un usuario por su DNI.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
app.get('/user/:dni', async (req, res) => {
    const { dni } = req.params;
    const user = await User.findOne({ documentNumber: dni });
    if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userResponse = {
        firstName: user.firstName,
        familyName: user.familyName,
        documentNumber: user.documentNumber,
        currentAddress: user.currentAddress,
        hasAltaCredential: user.hasAltaCredential,
        altaIssueDate: user.altaIssueDate,

        gender: user.gender,
        nationality: user.nationality,
        birthDate: user.birthDate,
        nss: user.nss,
        personalNumber: user.personalNumber,
        laserEngravedSerial: user.laserEngravedSerial,
        dniIssueDate: user.dniIssueDate,
        canNumber: user.canNumber,
        sex: user.sex,
        placeOfBirth: user.placeOfBirth,
        ascendants: user.ascendants,
        issuingTeamCode: user.issuingTeamCode
    };

    return res.status(200).json({ user: userResponse });
});

/**
 * Middleware final para registrar el estado de las respuestas enviadas.
 */
app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`Respuesta enviada con status ${res.statusCode}`);
    });
    next();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});
