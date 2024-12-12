import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import logger from '../../logger';
import { CredStatus } from '../../models/models';
import { v4 as uuidv4 } from 'uuid'; 
import axios from 'axios';
import { MissingParameterError, CredentialIDError, NotFoundError, IssuerCoordError } from '../errors/errors';

const issuerUrl: string = process.env.ISS_URL!;
const waltidUrl: string = process.env.WALTID_URL!;
const vaultTransitUrl: string = process.env.VAULT_TRANSIT_URL!;

export const ping = (_req: Request, res: Response) => {
  logger.info('Ping received');
  res.send('pong');
};

// Función auxiliar para crear un DID dado un roleId y secretId
async function createDidForIssuer(roleId: string, secretId: string, issuerLabel: string) {
  const requestBody = {
    key: {
      backend: 'tse',
      keyType: 'Ed25519',
      config: {
        server: vaultTransitUrl,
        auth: {
          roleId: roleId,
          secretId: secretId
        }
      }
    },
    did: {
      method: 'key'
    }
  };

  const onboardUrl = `${waltidUrl}/onboard/issuer`;
  const response = await fetch(onboardUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Error al crear el DID para ${issuerLabel}: ${response.statusText}`);
  }

  const data = await response.json();
  const issuerDid = data.issuerDid;
  const issuerKey = data.issuerKey;

  // Construir DID Document
  const publicKeyJwk = { ...issuerKey.jwk };
  delete publicKeyJwk.d; 

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

  logger.info(`Documento DID para ${issuerLabel} creado exitosamente`);

  // Guardar didDocument
  const didFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'dids',
    `did_${issuerLabel}.json`
  );
  fs.writeFileSync(didFilePath, JSON.stringify(didDocument, null, 2));
  logger.info(`DID Document guardado en did_${issuerLabel}.json`);

  // Guardar issuerKey
  const issuerKeyFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'dids',
    `issuerKey_${issuerLabel}.json`
  );
  fs.writeFileSync(issuerKeyFilePath, JSON.stringify(issuerKey, null, 2));
  logger.info(`Issuer Key guardado en issuerKey_${issuerLabel}.json`);

  return { issuerDid, issuerKey };
}

/**
 * Crea 3 DIDs diferentes, cada uno con sus propias keys, usando las
 * variables ROLE_ID_ISSUER1, SECRET_ID_ISSUER1, etc.
 */
export const cr_did = async (_req: Request, res: Response) => {
  try {
    const roleIdIssuer1 = process.env.ROLE_ID_ISSUER1;
    console.log(roleIdIssuer1)
    const secretIdIssuer1 = process.env.SECRET_ID_ISSUER1;

    const roleIdIssuer2 = process.env.ROLE_ID_ISSUER2;
    console.log(roleIdIssuer2)
    const secretIdIssuer2 = process.env.SECRET_ID_ISSUER2;

    const roleIdIssuer3 = process.env.ROLE_ID_ISSUER3;
    console.log(roleIdIssuer3)
    const secretIdIssuer3 = process.env.SECRET_ID_ISSUER3;

    if (!roleIdIssuer1 || !secretIdIssuer1 || !roleIdIssuer2 || !secretIdIssuer2 || !roleIdIssuer3 || !secretIdIssuer3) {
      throw new Error('Faltan variables de entorno para ROLE_ID y SECRET_ID de los 3 issuers');
    }

    const issuer1Data = await createDidForIssuer(roleIdIssuer1, secretIdIssuer1, 'issuer1');
    const issuer2Data = await createDidForIssuer(roleIdIssuer2, secretIdIssuer2, 'issuer2');
    const issuer3Data = await createDidForIssuer(roleIdIssuer3, secretIdIssuer3, 'issuer3');

    res.status(201).json({
      issuer1Did: issuer1Data.issuerDid,
      issuer2Did: issuer2Data.issuerDid,
      issuer3Did: issuer3Data.issuerDid
    });
  } catch (error: any) {
    logger.error('Ocurrió un error al crear los DIDs:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retorna el DID Document de un issuer específico.
 * Ejemplo: /didweb?issuer=issuer1, issuer2 o issuer3
 */
export const didweb = async (req: Request, res: Response) => {
  try {
    const issuer = req.query.issuer as string || 'issuer1';
    const didFilePath: string = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'dids',
      `did_${issuer}.json`
    );
    const data = checkdoc(didFilePath);
    logger.info(`DID Document para ${issuer} accedido con éxito`);
    res.status(200).json(JSON.parse(data));
  } catch (error: any) {
    logger.error('Error occurred:', error);
    res.status(500).json({ error: error.message });
  }
};

function readDidFromFile(issuerLabel: string): string | null {
  try {
    const didFilePath: string = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'dids',
      `did_${issuerLabel}.json`
    );
    const data = fs.readFileSync(didFilePath, 'utf8');
    const didDocument = JSON.parse(data);
    return didDocument.id;
  } catch (e) {
    logger.error(`Error leyendo DID de ${issuerLabel}:`, e);
    return null;
  }
}


function getIssuersDids(): string[] {
  const issuer1Did = readDidFromFile('issuer1');
  const issuer2Did = readDidFromFile('issuer2');
  const issuer3Did = readDidFromFile('issuer3');

  const dids: string[] = [];
  if (issuer1Did) dids.push(issuer1Did);
  if (issuer2Did) dids.push(issuer2Did);
  if (issuer3Did) dids.push(issuer3Did);

  return dids;
}


export const getIssuersDidsEndpoint = (req: Request, res: Response) => {
  try {
    const dids = getIssuersDids();
    if (dids.length < 3) {
      return res.status(500).json({ error: "No se pudieron obtener los 3 DIDs de los issuers" });
    }
    return res.status(200).json({ issuers: dids });
  } catch (error: any) {
    logger.error('Error al obtener los DIDs de los issuers:', error);
    return res.status(500).json({ error: error.message });
  }
};





export const schema = (_req: Request, res: Response) => {
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
  logger.info('Schema accessed successfully');
  res.status(200).json(schema);
};

/**
 * Emite una credencial. Dependiendo del tipo (Work, Identity, Passport),
 * usa el DID y Keys del issuer correspondiente.
 * 
 * - Identity -> issuer1
 * - Passport -> issuer2
 * - Work -> issuer3
 */
export const issue = async (req: Request, res: Response) => {
  try {
    // Determinar el modo (open o direct)
    const mode = process.env.MODE?.toLowerCase();
    if (!mode || (mode !== 'open' && mode !== 'direct')) {
      throw new Error("MODE no está configurado correctamente en el archivo .env. Debe ser 'open' o 'direct'.");
    }

    const credentialType = req.body.type; 
    if (!credentialType) {
      throw new MissingParameterError('Missing parameter: type. Debe ser "Identity", "Passport" o "Work"');
    }

    // Seleccionamos el issuer según el tipo
    let issuerLabel: string;
    if (credentialType.toLowerCase() === 'identity') {
      issuerLabel = 'issuer1';
    } else if (credentialType.toLowerCase() === 'passport') {
      issuerLabel = 'issuer2';
    } else if (credentialType.toLowerCase() === 'work') {
      issuerLabel = 'issuer3';
    } else {
      throw new Error('Tipo de credencial no soportado. Use "Identity", "Passport" o "Work".');
    }

    // Cargar el DID del issuer seleccionado
    const didFilePath: string = path.join(__dirname, '..', '..', 'data', 'dids', `did_${issuerLabel}.json`);
    let issuerDid: string;
    try {
      const didData = fs.readFileSync(didFilePath, 'utf8');
      const didDocument = JSON.parse(didData);
      issuerDid = didDocument.id; 
    } catch (error) {
      throw new NotFoundError(`No se pudo cargar el DID de ${issuerLabel}. Asegúrate de haber creado el DID correctamente.`);
    }

    // Cargar issuerKey del issuer seleccionado
    const issuerKeyPath = path.join(__dirname, '..', '..', 'data', 'dids', `issuerKey_${issuerLabel}.json`);
    let issuerKey;
    try {
      const issuerKeyData = fs.readFileSync(issuerKeyPath, 'utf8');
      issuerKey = JSON.parse(issuerKeyData);
    } catch (error) {
      throw new NotFoundError(`Issuer Key de ${issuerLabel} no encontrado. Asegúrate de haber creado el DID correctamente.`);
    }

    let credentialData: any;
    let credentialConfigurationId: string;
    let credentialUuid = uuidv4();
    let credentialId = `urn:uuid:${credentialUuid}`;
    let mapping: any;

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
        throw new Error('Tipo de credencial no soportado.');
    }

    let issuanceUrl: string | undefined;
    let signedCredential: string | undefined;
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

      const issueUrl_openid = `${waltidUrl}/openid4vc/jwt/issue`;
      const issueResponse = await axios.post<string>(issueUrl_openid, payload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (issueResponse.status !== 200 && issueResponse.status !== 201) {
        throw new IssuerCoordError(`Failed to issue credential via OpenID. Status code: ${issueResponse.status}`);
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

      const credentialFilePath = path.join(__dirname, '..', '..', 'data', 'credentials', `credential_${credentialUuid}.json`);
      fs.writeFileSync(credentialFilePath, JSON.stringify(credentialToStore, null, 2));

      res.status(200).json({ issuanceUrl });

    } else if (mode === 'direct') {
      // Modo Directo: firma directa con /raw/jwt/sign
      const directPayload = {
        issuerKey: issuerKey,
        issuerDid: issuerDid,
        subjectDid: issuerDid, 
        credentialData: credentialData
      };

      const issueUrl_direct = `${waltidUrl}/raw/jwt/sign`;
      const issueResponseDirect = await axios.post<string>(issueUrl_direct, directPayload, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (issueResponseDirect.status !== 200 && issueResponseDirect.status !== 201) {
        throw new IssuerCoordError(`Failed to issue credential via Direct Signing. Status code: ${issueResponseDirect.status}`);
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

      const credentialFilePath = path.join(__dirname, '..', '..', 'data', 'credentials', `credential_${credentialUuid}.json`);
      fs.writeFileSync(credentialFilePath, JSON.stringify(credentialToStore, null, 2));

      res.status(200).json({ signedCredential });
    }

  } catch (error: any) {
    logger.error('Ocurrió un error:', error);

    if (error.response) {
      logger.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      logger.error('No se recibió respuesta de la API de walt.id:', error.request);
      res.status(500).json({
        message: 'No response from walt.id API',
        error: error.message
      });
    } else if (
      error instanceof MissingParameterError ||
      error instanceof IssuerCoordError ||
      error instanceof CredentialIDError ||
      error instanceof NotFoundError
    ) {
      logger.error('Validación/Error:', error.message);
      res.status(error.code).json({ message: error.message });
    } else {
      logger.error('Error inesperado:', error);
      res.status(500).json({
        message: 'Internal Server Error',
        error: error.message
      });
    }
  }
};

export const statusCallback = async (req: Request, res: Response) => {
  try {
    const statusData = req.body;
    const sessionId = req.params.sessionId;

    logger.info('Received status callback from ISSUER_SERV');
    logger.debug('Status Data:', JSON.stringify(statusData, null, 2));
    logger.debug('Session ID:', sessionId);

    if (!sessionId) {
      throw new Error('sessionId not found in the callback URL');
    }

    const credentialFilesDir = path.join(__dirname, '..', '..', 'data', 'credentials');

    if (!fs.existsSync(credentialFilesDir)) {
      throw new NotFoundError(`Credential directory not found`);
    }

    const credentialFiles = fs.readdirSync(credentialFilesDir);

    let credentialFilePath = '';
    let credentialData: any;

    for (const fileName of credentialFiles) {
      const filePath = path.join(credentialFilesDir, fileName);
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileData = JSON.parse(fileContent);

        if (fileData.issuanceUrl && fileData.issuanceUrl.includes(sessionId)) {
          credentialData = fileData;
          credentialFilePath = filePath;
          break;
        }
      } catch (parseError) {
        logger.error(`Error parsing credential file ${fileName}:`, parseError);
        continue;
      }
    }

    if (!credentialFilePath) {
      throw new NotFoundError(`Credential with sessionId ${sessionId} not found`);
    }

    credentialData.status = 'issued';

    fs.writeFileSync(credentialFilePath, JSON.stringify(credentialData, null, 2));
    logger.info(`Credential status updated to '${credentialData.status}' for sessionId ${sessionId}`);

    res.status(200).send('Status callback processed successfully');
  } catch (error: any) {
    logger.error('Error processing status callback in ISSUER_COORD:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getcred = (_req: Request, res: Response) => {
  try {
    const directoryPath: string = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'credentials'
    );

    const files = fs.readdirSync(directoryPath);
    logger.debug('Stored Files', files);

    const credentials = [];
    for (const file of files) {
      const tempFilePath = path.join(directoryPath, file);
      const data = checkdoc(tempFilePath);
      const credential = JSON.parse(data);
      credentials.push(credential);
      logger.info(`Successfully retrieved file ${tempFilePath}`);
    }
    res.status(200).json(credentials);
  } catch (error: any) {
    logger.error('Error occurred:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getscredx = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const tempFilePath = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'credentials',
      'credential' + id + '.json'
    );
    const data = checkdoc(tempFilePath);
    const credential = JSON.parse(data);
    logger.info(`Successfully retrieved file ${tempFilePath}`);
    res.status(200).json(credential);
  } catch (error: any) {
    logger.error('Error occurred:', error);
    res.status(500).json({ error: error.message });
  }
};

export const upstatus = (req: Request, res: Response) => {
  try {
    checkMissing(req.body.credentialId);
    checkMissing(req.body.credentialStatus);

    const status = new CredStatus(
      req.body.credentialStatus.credentialId,
      req.body.credentialStatus.status
    );
    const id = getId(req.body.credentialId);

    logger.info('CredentialID received successfully');
    logger.debug('CredentialID', req.body.credentialId);
    logger.info('Credential Status received successfully');
    logger.debug('Credential Status', status);

    const statusFilePath = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'status',
      'status' + id + '.json'
    );

    fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));

    logger.info('Status updated successfully');
    res.status(200).json('Status updated successfully');
  } catch (error: any) {
    logger.error('Error occurred:', error);
    res.status(500).json({ error: error.message });
  }
};

export const delcred = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const tempFilePath = path.join(
      __dirname,
      '..',
      '..',
      'data',
      'credentials',
      'credential' + id + '.json'
    );

    deletedoc(tempFilePath);
    logger.info('Credential deleted successfully');
    res.status(200).json('Credential deleted successfully');
  } catch (error: any) {
    logger.error('Error occurred:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helpers
function checkMissing(param: any): void {
  if (!param) {
    throw new MissingParameterError('Missing required parameter');
  }
}

function checkdoc(document: string): string {
  try {
    return fs.readFileSync(document, 'utf8');
  } catch {
    throw new NotFoundError(`${document} has not been found`);
  }
}

function getId(credentialId: string): string {
  const parts = credentialId.split('/');
  const id = parts.pop();
  if (id === undefined) {
    throw new CredentialIDError('No ID found in the credential ID');
  }
  return id;
}

function deletedoc(document: string): void {
  try {
    fs.unlinkSync(document);
  } catch (err) {
    throw new NotFoundError(`${document} has not been found`);
  }
}

export function loadid(): number {
  const tempFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'count',
    'id.txt'
  );

  if (!fs.existsSync(tempFilePath)) {
    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
    fs.writeFileSync(tempFilePath, '0', 'utf-8');
    logger.info(`Archivo id.txt creado en ${tempFilePath} con valor inicial 0`);
    return 0;
  }

  const data = checkdoc(tempFilePath);
  return parseFloat(data);
}

export function saveid(id: number): void {
  const tempFilePath = path.join(
    __dirname,
    '..',
    '..',
    'data',
    'count',
    'id.txt'
  );
  fs.writeFileSync(tempFilePath, id.toString(), 'utf-8');
}

export const easterEgg = async (req: Request, res: Response) => {
  try {
    logger.info('Easter Egg accessed by', { ip: req.ip, userAgent: req.headers['user-agent'] });

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
  } catch (error: any) {
    logger.error('Error accessing Easter Egg:', { error, ip: req.ip });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
