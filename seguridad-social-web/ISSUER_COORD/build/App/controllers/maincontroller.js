"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.easterEgg = exports.delcred = exports.upstatus = exports.getscredx = exports.getcred = exports.statusCallback = exports.issue = exports.schema = exports.didweb = exports.cr_did = exports.ping = void 0;
exports.loadid = loadid;
exports.saveid = saveid;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const logger_1 = __importDefault(require("../../logger"));
const models_1 = require("../../models/models");
const uuid_1 = require("uuid"); // Para generar UUIDs
const axios_1 = __importDefault(require("axios"));
const errors_1 = require("../errors/errors");
/**
 * Responde a las solicitudes de "ping" con un "pong".
 * @param _req - Objeto de solicitud de Express.
 * @param res - Objeto de respuesta de Express.
 */
const ping = (_req, res) => {
    logger_1.default.info('Ping received');
    res.send('pong');
};
exports.ping = ping;
/**
 * Crea un DID (Decentralized Identifier) utilizando el servicio walt.id.
 * @param _req - Objeto de solicitud de Express.
 * @param res - Objeto de respuesta de Express.
 */
const cr_did = async (_req, res) => {
    try {
        // **1. Construcción de la URL del Emisor**
        const issuer_url = process.env.ISS_URL;
        const parsedUrl = new URL(issuer_url);
        let domain = parsedUrl.hostname;
        if (parsedUrl.port) {
            domain += `:${parsedUrl.port}`;
        }
        const pathUrl = parsedUrl.pathname.replace(/^\//, '');
        // **2. Preparación del Cuerpo de la Petición para walt.id**
        const roleId = process.env.ROLE_ID;
        const secredId = process.env.SECRET_ID;
        const requestBody = {
            key: {
                backend: 'tse',
                keyType: 'Ed25519',
                config: {
                    server: 'http://host.docker.internal:8200/v1/transit', // URL del engine transit
                    auth: {
                        roleId: roleId, // Poner aquí el role_id leído de Vault
                        secretId: secredId // Poner aquí el secret_id obtenido de Vault
                    }
                }
            },
            did: {
                method: 'key'
            }
        };
        const waltidUrl = `${process.env.WALTID_URL}/onboard/issuer`; // Asegúrate que WALTID_URL apunte a tu instancia de walt.id issuer.
        const response = await (0, node_fetch_1.default)(waltidUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`Error al crear el DID: ${response.statusText}`);
        }
        const data = await response.json();
        const issuerDid = data.issuerDid;
        const issuerKey = data.issuerKey;
        // **4. Construcción del Documento DID**
        const publicKeyJwk = Object.assign({}, issuerKey.jwk);
        delete publicKeyJwk.d; // Eliminamos la clave privada del publicKeyJwk
        const verificationMethod = {
            id: `${issuerDid}#key-1`,
            type: 'JsonWebKey2020',
            controller: issuerDid,
            publicKeyJwk: publicKeyJwk,
        };
        const didDocument = {
            '@context': 'https://www.w3.org/ns/did/v1',
            id: issuerDid,
            verificationMethod: [verificationMethod],
            authentication: [verificationMethod.id],
            assertionMethod: [verificationMethod.id],
        };
        logger_1.default.info('Documento DID creado exitosamente');
        logger_1.default.debug('Documento DID:', didDocument);
        // **5. Guardar el Documento DID en 'did.json'**
        const didFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'dids', 'did.json');
        fs_1.default.writeFileSync(didFilePath, JSON.stringify(didDocument, null, 2));
        logger_1.default.info('Documento DID guardado exitosamente en did.json');
        // **6. Guardar el 'issuerKey' en 'issuerKey.json'**
        const issuerKeyFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'dids', 'issuerKey.json');
        fs_1.default.writeFileSync(issuerKeyFilePath, JSON.stringify(issuerKey, null, 2));
        logger_1.default.info('Issuer Key guardado exitosamente en issuerKey.json');
        // **7. Devolver el DID Creado**
        res.status(201).json({ issuerDid });
    }
    catch (error) {
        logger_1.default.error('Ocurrió un error al crear el DID:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.cr_did = cr_did;
/**
 * Recupera el documento DID almacenado.
 * @param _req - Objeto de solicitud de Express.
 * @param res - Objeto de respuesta de Express.
 */
const didweb = async (_req, res) => {
    try {
        const tempFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'dids', 'did.json');
        const data = checkdoc(tempFilePath);
        logger_1.default.info('DID Document accessed successfully');
        res.status(200).json(JSON.parse(data));
    }
    catch (error) {
        logger_1.default.error('Error occurred:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.didweb = didweb;
/**
 * Proporciona el esquema JSON para la validación de credenciales.
 * @param _req - Objeto de solicitud de Express.
 * @param res - Objeto de respuesta de Express.
 */
const schema = (_req, res) => {
    const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
            name: {
                type: 'string',
            },
            identifier: {
                type: 'string',
                pattern: '^[0-9]{8}[A-Z]$',
            },
        },
        required: ['name', 'identifier'],
    };
    logger_1.default.info('Schema accessed successfully');
    res.status(200).json(schema);
};
exports.schema = schema;
/**
 * Emite una credencial basada en los datos proporcionados, soportando modos OpenID y Directo.
 * @param req - Objeto de solicitud de Express que contiene los datos para emitir la credencial.
 * @param res - Objeto de respuesta de Express que devuelve la URL de emisión o la credencial firmada.
 */
const issue = async (req, res) => {
    var _a;
    try {
        // Cargar el issuerDid desde did.json
        const didFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'dids', 'did.json');
        let issuerDid;
        try {
            const didData = fs_1.default.readFileSync(didFilePath, 'utf8');
            const didDocument = JSON.parse(didData);
            issuerDid = didDocument.id; // El campo 'id' del didDocument es el issuerDid
        }
        catch (error) {
            throw new errors_1.NotFoundError('No se pudo cargar el DID desde did.json. Asegúrate de haber creado el DID correctamente.');
        }
        // Cargar issuerKey
        const issuerKeyPath = path_1.default.join(__dirname, '..', '..', 'data', 'dids', 'issuerKey.json');
        let issuerKey;
        try {
            const issuerKeyData = fs_1.default.readFileSync(issuerKeyPath, 'utf8');
            issuerKey = JSON.parse(issuerKeyData);
        }
        catch (error) {
            throw new errors_1.NotFoundError('Issuer Key no encontrado. Asegúrate de haber creado el DID correctamente.');
        }
        // Determinar el modo de emisión (open o direct)
        const mode = (_a = process.env.MODE) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (!mode || (mode !== 'open' && mode !== 'direct')) {
            throw new Error("MODE no está configurado correctamente en el archivo .env. Debe ser 'open' o 'direct'.");
        }
        // Determinar el tipo de credencial a emitir a partir del body
        const credentialType = req.body.type;
        if (!credentialType) {
            throw new errors_1.MissingParameterError('Missing parameter: type. Debe ser "Identity", "Passport" o "Work"');
        }
        let credentialData;
        let credentialConfigurationId;
        let credentialUuid = (0, uuid_1.v4)();
        let credentialId = `urn:uuid:${credentialUuid}`;
        let mapping;
        switch (credentialType.toLowerCase()) {
            case 'identity':
                credentialData = {
                    "@context": [
                        "https://www.w3.org/ns/credentials/v2",
                        "https://www.w3.org/ns/credentials/examples/v2"
                    ],
                    "id": credentialId,
                    "type": ["VerifiableCredential", "CustomIdentityCredential"],
                    "issuer": {
                        "id": issuerDid,
                        "name": "Ministerio del Interior - Gobierno de España",
                        "description": "Entidad emisora de documentos nacionales de identidad"
                    },
                    "name": "Documento Nacional de Identidad",
                    "description": "Credencial verificable de identidad personal",
                    "validFrom": "2024-12-08T10:19:28Z",
                    "expirationDate": "2025-12-08T10:19:28Z",
                    "category": "Identity",
                    "credentialSubject": {
                        "id": "did:web:localhost:6000",
                        "dni": {
                            "identifier": "12345678A",
                            "givenName": "Mario",
                            "familyName": "Perez",
                            "gender": "M",
                            "nationality": "ES",
                            "birthDate": "1990-01-01",
                            "nss": "123456789012",
                            "photo": "https://example.com/images/12345678A_dni.jpg"
                        }
                    }
                };
                credentialConfigurationId = 'CustomIdentityCredential_jwt_vc_json';
                mapping = {
                    id: credentialData.id,
                    issuer: {
                        id: credentialData.issuer.id
                    },
                    credentialSubject: {
                        id: credentialData.credentialSubject.id
                    },
                    issuanceDate: credentialData.validFrom,
                    expirationDate: credentialData.expirationDate
                };
                break;
            case 'passport':
                credentialData = {
                    "@context": [
                        "https://www.w3.org/ns/credentials/v2",
                        "https://www.w3.org/ns/credentials/examples/v2"
                    ],
                    "id": credentialId,
                    "type": ["VerifiableCredential", "PassportCredential"],
                    "issuer": {
                        "id": issuerDid,
                        "name": "Ministerio de Asuntos Exteriores - España",
                        "description": "Entidad emisora de pasaportes"
                    },
                    "name": "Pasaporte",
                    "description": "Credencial verificable de pasaporte internacional.",
                    "validFrom": "2024-01-01T00:00:00Z",
                    "expirationDate": "2034-01-01T00:00:00Z",
                    "category": "Identity",
                    "credentialSubject": {
                        "id": "did:web:persona.example.com",
                        "givenName": "Mario",
                        "familyName": "Perez",
                        "birthDate": "1990-01-01",
                        "nationality": "ES",
                        "passportNumber": "X12345678",
                        "issueDate": "2024-01-01",
                        "issuingCountry": "España",
                        "gender": "M",
                        "placeOfBirth": "Madrid, España"
                    }
                };
                credentialConfigurationId = 'PassportCredential_jwt_vc_json';
                mapping = {
                    id: credentialData.id,
                    issuer: {
                        id: credentialData.issuer.id
                    },
                    credentialSubject: {
                        id: credentialData.credentialSubject.id
                    },
                    issuanceDate: credentialData.validFrom,
                    expirationDate: credentialData.expirationDate
                };
                break;
            case 'work':
                credentialData = {
                    "@context": [
                        "https://www.w3.org/ns/credentials/v2",
                        "https://www.w3.org/ns/credentials/examples/v2"
                    ],
                    "id": credentialId,
                    "type": ["VerifiableCredential", "EmployerRegistrationCredential"],
                    "issuer": {
                        "id": issuerDid,
                        "name": "Ministerio de Trabajo y Economía Social - España",
                        "description": "Entidad emisora del registro laboral de la empresa"
                    },
                    "name": "Registro del Empleador",
                    "description": "Credencial que acredita el registro del empleador en la Seguridad Social",
                    "validFrom": "2024-12-08T10:19:28Z",
                    "expirationDate": "2026-12-08T10:19:28Z",
                    "category": "EmployerRegistration",
                    "credentialSubject": {
                        "id": "did:web:empresa.example.com",
                        "employerName": "Empresa de Servicios S.A.",
                        "socialSecurityRegime": "Régimen General",
                        "employerContributionAccountCode": "0111-2222-33-4444444444",
                        "collectiveAgreements": [
                            "Convenio Colectivo de Empresas de Servicios Generales",
                            "Convenio Colectivo Sectorial"
                        ]
                    }
                };
                credentialConfigurationId = 'EmployerRegistrationCredential_jwt_vc_json';
                mapping = {
                    id: credentialData.id,
                    issuer: {
                        id: credentialData.issuer.id
                    },
                    credentialSubject: {
                        id: credentialData.credentialSubject.id
                    },
                    issuanceDate: credentialData.validFrom,
                    expirationDate: credentialData.expirationDate
                };
                break;
            default:
                throw new Error('Tipo de credencial no soportado. Use "Identity", "Passport" o "Work".');
        }
        let issuanceUrl;
        let signedCredential;
        const status = mode === 'open' ? 'pending' : 'issued';
        if (mode === 'open') {
            // Modo OpenID: emitir vía OpenID4VC single
            const authenticationMethod = 'PRE_AUTHORIZED';
            const payload = {
                issuerKey: issuerKey,
                issuerDid: issuerDid,
                credentialConfigurationId: credentialConfigurationId,
                credentialData: credentialData,
                mapping: mapping,
                authenticationMethod: authenticationMethod
            };
            const issueUrl_openid = `${process.env.WALTID_URL}/openid4vc/jwt/issue`;
            const issueResponse = await axios_1.default.post(issueUrl_openid, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });
            if (issueResponse.status !== 200 && issueResponse.status !== 201) {
                throw new errors_1.IssuerCoordError(`Failed to issue credential via OpenID. Status code: ${issueResponse.status}`);
            }
            issuanceUrl = issueResponse.data;
            if (!issuanceUrl) {
                throw new Error('issuanceUrl not found in the response from walt.id');
            }
            const credentialToStore = {
                credentialData: credentialData,
                status,
                issuanceUrl,
                issuanceTime: new Date().toISOString()
            };
            const credentialFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'credentials', `credential_${credentialUuid}.json`);
            fs_1.default.writeFileSync(credentialFilePath, JSON.stringify(credentialToStore, null, 2));
            res.status(200).json({ issuanceUrl });
        }
        else if (mode === 'direct') {
            // Modo Directo: firma directa con /raw/jwt/sign
            const directPayload = {
                issuerKey: issuerKey,
                issuerDid: issuerDid,
                subjectDid: issuerDid,
                credentialData: credentialData
            };
            const issueUrl_direct = `${process.env.WALTID_URL}/raw/jwt/sign`;
            const issueResponseDirect = await axios_1.default.post(issueUrl_direct, directPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                }
            });
            if (issueResponseDirect.status !== 200 && issueResponseDirect.status !== 201) {
                throw new errors_1.IssuerCoordError(`Failed to issue credential via Direct Signing. Status code: ${issueResponseDirect.status}`);
            }
            signedCredential = issueResponseDirect.data;
            if (!signedCredential) {
                throw new Error('Signed credential not found in the response from walt.id');
            }
            const credentialToStore = {
                credentialData: credentialData,
                status,
                signedCredential,
                issuanceTime: new Date().toISOString()
            };
            const credentialFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'credentials', `credential_${credentialUuid}.json`);
            fs_1.default.writeFileSync(credentialFilePath, JSON.stringify(credentialToStore, null, 2));
            res.status(200).json({ signedCredential });
        }
    }
    catch (error) {
        logger_1.default.error('Ocurrió un error:', error);
        if (error.response) {
            logger_1.default.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            res.status(error.response.status).json(error.response.data);
        }
        else if (error.request) {
            logger_1.default.error('No se recibió respuesta de la API de walt.id:', error.request);
            res.status(500).json({
                message: 'No response from walt.id API',
                error: error.message
            });
        }
        else if (error instanceof errors_1.MissingParameterError ||
            error instanceof errors_1.IssuerCoordError ||
            error instanceof errors_1.CredentialIDError ||
            error instanceof errors_1.NotFoundError) {
            logger_1.default.error('Validación/Error:', error.message);
            res.status(error.code).json({ message: error.message });
        }
        else {
            logger_1.default.error('Error inesperado:', error);
            res.status(500).json({
                message: 'Internal Server Error',
                error: error.message
            });
        }
    }
};
exports.issue = issue;
/**
 * Maneja las callbacks de estado enviadas por ISSUER_SERV.
 * @param req - Objeto de solicitud de Express que contiene los datos del estado.
 * @param res - Objeto de respuesta de Express.
 */
const statusCallback = async (req, res) => {
    try {
        const statusData = req.body;
        const sessionId = req.params.sessionId;
        logger_1.default.info('Received status callback from ISSUER_SERV');
        logger_1.default.debug('Status Data:', JSON.stringify(statusData, null, 2));
        logger_1.default.debug('Session ID:', sessionId);
        if (!sessionId) {
            throw new Error('sessionId not found in the callback URL');
        }
        // **Buscar la credencial almacenada basada en sessionId**
        const credentialFilesDir = path_1.default.join(__dirname, '..', '..', 'data', 'credentials');
        // Verificar si el directorio existe
        if (!fs_1.default.existsSync(credentialFilesDir)) {
            throw new errors_1.NotFoundError(`Credential directory not found`);
        }
        // Leer todos los archivos de credenciales
        const credentialFiles = fs_1.default.readdirSync(credentialFilesDir);
        let credentialFilePath = '';
        let credentialData;
        // Buscar el archivo que tiene `issuanceUrl` correspondiente al sessionId
        for (const fileName of credentialFiles) {
            const filePath = path_1.default.join(credentialFilesDir, fileName);
            try {
                const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
                const fileData = JSON.parse(fileContent);
                // Comparar el `issuanceUrl` con el `sessionId`
                // Asumiendo que el `sessionId` está incluido en el `issuanceUrl`
                if (fileData.issuanceUrl.includes(sessionId)) {
                    // Encontramos la credencial correspondiente
                    credentialData = fileData;
                    credentialFilePath = filePath;
                    break;
                }
            }
            catch (parseError) {
                logger_1.default.error(`Error parsing credential file ${fileName}:`, parseError);
                continue; // Continuar buscando en otros archivos
            }
        }
        if (!credentialFilePath) {
            throw new errors_1.NotFoundError(`Credential with sessionId ${sessionId} not found`);
        }
        credentialData.status = 'issued';
        // **Guardar los cambios en el archivo**
        fs_1.default.writeFileSync(credentialFilePath, JSON.stringify(credentialData, null, 2));
        logger_1.default.info(`Credential status updated to '${credentialData.status}' for sessionId ${sessionId}`);
        res.status(200).send('Status callback processed successfully');
    }
    catch (error) {
        logger_1.default.error('Error processing status callback in ISSUER_COORD:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.statusCallback = statusCallback;
/**
 * Recupera todas las credenciales almacenadas.
 * @param _req - Objeto de solicitud de Express.
 * @param res - Objeto de respuesta de Express que devuelve una lista de credenciales.
 */
const getcred = (_req, res) => {
    try {
        const directoryPath = path_1.default.join(__dirname, '..', '..', 'data', 'credentials');
        const files = fs_1.default.readdirSync(directoryPath);
        logger_1.default.debug('Stored Files', files);
        const credentials = [];
        for (const file of files) {
            const tempFilePath = path_1.default.join(directoryPath, file);
            const data = checkdoc(tempFilePath);
            const credential = JSON.parse(data);
            credentials.push(credential);
            logger_1.default.info(`Successfully retrieved file ${tempFilePath}`);
        }
        res.status(200).json(credentials);
    }
    catch (error) {
        logger_1.default.error('Error occurred:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getcred = getcred;
/**
 * Recupera una credencial específica por su ID.
 * @param req - Objeto de solicitud de Express que contiene el ID de la credencial.
 * @param res - Objeto de respuesta de Express que devuelve la credencial solicitada.
 */
const getscredx = (req, res) => {
    try {
        const id = req.params.id;
        const tempFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'credentials', 'credential' + id + '.json');
        const data = checkdoc(tempFilePath);
        const credential = JSON.parse(data);
        logger_1.default.info(`Successfully retrieved file ${tempFilePath}`);
        res.status(200).json(credential);
    }
    catch (error) {
        logger_1.default.error('Error occurred:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.getscredx = getscredx;
/**
 * Actualiza el estado de una credencial específica.
 * @param req - Objeto de solicitud de Express que contiene el ID de la credencial y el nuevo estado.
 * @param res - Objeto de respuesta de Express que confirma la actualización del estado.
 */
const upstatus = (req, res) => {
    try {
        checkMissing(req.body.credentialId);
        checkMissing(req.body.credentialStatus);
        const status = new models_1.CredStatus(req.body.credentialStatus.credentialId, req.body.credentialStatus.status);
        const id = getId(req.body.credentialId);
        logger_1.default.info('CredentialID received successfully');
        logger_1.default.debug('CredentialID', req.body.credentialId);
        logger_1.default.info('Credential Status received successfully');
        logger_1.default.debug('Credential Status', status);
        const statusFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'status', 'status' + id + '.json');
        fs_1.default.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
        logger_1.default.info('Status updated successfully');
        res.status(200).json('Status updated successfully');
    }
    catch (error) {
        logger_1.default.error('Error occurred:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.upstatus = upstatus;
/**
 * Elimina una credencial específica por su ID.
 * @param req - Objeto de solicitud de Express que contiene el ID de la credencial.
 * @param res - Objeto de respuesta de Express que confirma la eliminación de la credencial.
 */
const delcred = (req, res) => {
    try {
        const id = req.params.id;
        const tempFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'credentials', 'credential' + id + '.json');
        deletedoc(tempFilePath);
        logger_1.default.info('Credential deleted successfully');
        res.status(200).json('Credential deleted successfully');
    }
    catch (error) {
        logger_1.default.error('Error occurred:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.delcred = delcred;
// Helper functions
/**
 * Verifica si un parámetro está ausente y lanza un error si es así.
 * @param param - El parámetro a verificar.
 * @throws {MissingParameterError} Si el parámetro está ausente.
 */
function checkMissing(param) {
    if (!param) {
        throw new errors_1.MissingParameterError('Missing required parameter');
    }
}
/**
 * Lee y retorna el contenido de un documento.
 * @param document - Ruta al documento a leer.
 * @returns El contenido del documento como una cadena.
 * @throws {NotFoundError} Si el documento no se encuentra.
 */
function checkdoc(document) {
    try {
        return fs_1.default.readFileSync(document, 'utf8');
    }
    catch (_a) {
        throw new errors_1.NotFoundError(`${document} has not been found`);
    }
}
/**
 * Extrae y retorna el ID de una credencial a partir de su URI completa.
 * @param credentialId - URI completa de la credencial.
 * @returns El ID de la credencial.
 * @throws {CredentialIDError} Si no se puede extraer un ID válido.
 */
function getId(credentialId) {
    const parts = credentialId.split('/');
    const id = parts.pop();
    if (id === undefined) {
        throw new errors_1.CredentialIDError('No ID found in the credential ID');
    }
    return id;
}
/**
 * Elimina un documento especificado.
 * @param document - Ruta al documento a eliminar.
 * @throws {NotFoundError} Si el documento no se encuentra.
 */
function deletedoc(document) {
    try {
        fs_1.default.unlinkSync(document);
    }
    catch (err) {
        throw new errors_1.NotFoundError(`${document} has not been found`);
    }
}
/**
 * Carga y retorna el contador de ID desde un archivo.
 * @returns El contador de ID como número.
 */
function loadid() {
    const tempFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'count', 'id.txt');
    // Verificar si el archivo existe
    if (!fs_1.default.existsSync(tempFilePath)) {
        // Crear el directorio si no existe
        fs_1.default.mkdirSync(path_1.default.dirname(tempFilePath), { recursive: true });
        // Inicializar el archivo con el valor '0'
        fs_1.default.writeFileSync(tempFilePath, '0', 'utf-8');
        logger_1.default.info(`Archivo id.txt creado en ${tempFilePath} con valor inicial 0`);
        return 0;
    }
    const data = checkdoc(tempFilePath);
    return parseFloat(data);
}
/**
 * Guarda el contador de ID en un archivo.
 * @param id - El nuevo valor del contador de ID.
 */
function saveid(id) {
    const tempFilePath = path_1.default.join(__dirname, '..', '..', 'data', 'count', 'id.txt');
    fs_1.default.writeFileSync(tempFilePath, id.toString(), 'utf-8');
}
const easterEgg = async (req, res) => {
    try {
        logger_1.default.info('Easter Egg accessed by', { ip: req.ip, userAgent: req.headers['user-agent'] });
        const messages = [
            "¡Felicidades! Has encontrado el Easter Egg de ISSUER_COORD. 🎉",
            "¿Sabías que los desarrolladores también disfrutan programando en pijama? 🛌💻",
            "Easter Egg: ¡Este proyecto fue hecho con amor y café! ☕❤️",
            "¡No te preocupes, este Easter Egg no afecta el rendimiento! 😄",
            "Easter Egg: Si encuentras más, ¡has sido muy observador! 👀"
        ];
        const randomIndex = Math.floor(Math.random() * messages.length);
        const randomMessage = messages[randomIndex];
        res.status(200).json({ message: randomMessage });
    }
    catch (error) {
        logger_1.default.error('Error accessing Easter Egg:', { error, ip: req.ip });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.easterEgg = easterEgg;
