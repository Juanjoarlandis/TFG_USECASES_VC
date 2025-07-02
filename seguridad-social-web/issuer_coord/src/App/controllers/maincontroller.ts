import { Request, Response } from 'express';
import logger from '../../logger';
import { DIDService } from '../services/DIDService';
import { CredentialService } from '../services/CredentialService';
import { FileRepository } from '../repositories/FileRepository';
import { DIDRepository } from '../repositories/DIDRepository';
import { MissingParameterError } from '../errors/errors';

const didRepository = new DIDRepository();
const didService = new DIDService(didRepository);
const fileRepository = new FileRepository();
const credentialService = new CredentialService(fileRepository);

/**
 * @module Controllers
 */

/**
 * Health-check endpoint.
 * @route GET /ping
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response.
 * @returns {void} Sends "pong" on success.
 */
export const ping = (_req: Request, res: Response): void => {
  logger.info('Ping received');
  res.send('pong');
};

/**
 * Creates DIDs for three issuers using environment credentials.
 * @route GET /did
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response.
 * @returns {Promise<void>} JSON object with created DIDs.
 * @throws {Error} If any ROLE_ID or SECRET_ID env var is missing.
 */
export const cr_did = async (_req: Request, res: Response): Promise<void> => {
  try {
    const roleIdIssuer1 = process.env.ROLE_ID_ISSUER1;
    const secretIdIssuer1 = process.env.SECRET_ID_ISSUER1;
    const roleIdIssuer2 = process.env.ROLE_ID_ISSUER2;
    const secretIdIssuer2 = process.env.SECRET_ID_ISSUER2;
    const roleIdIssuer3 = process.env.ROLE_ID_ISSUER3;
    const secretIdIssuer3 = process.env.SECRET_ID_ISSUER3;

    if (!roleIdIssuer1 || !secretIdIssuer1 ||
        !roleIdIssuer2 || !secretIdIssuer2 ||
        !roleIdIssuer3 || !secretIdIssuer3) {
      throw new Error('Faltan variables de entorno para ROLE_ID y SECRET_ID de los 3 issuers');
    }

    const issuer1Data = await didService.createDidForIssuer(roleIdIssuer1, secretIdIssuer1, 'issuer1');
    const issuer2Data = await didService.createDidForIssuer(roleIdIssuer2, secretIdIssuer2, 'issuer2');
    const issuer3Data = await didService.createDidForIssuer(roleIdIssuer3, secretIdIssuer3, 'issuer3');

    res.status(201).json({
      issuer1Did: issuer1Data.issuerDid,
      issuer2Did: issuer2Data.issuerDid,
      issuer3Did: issuer3Data.issuerDid
    });
  } catch (error: any) {
    logger.error('Error al crear los DIDs:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Serves the DID Document for a given issuer.
 * @route GET /.well-known/did.json
 * @param {Request} req - Express request, expects `issuer` query param.
 * @param {Response} res - Express response.
 * @returns {Promise<void>} JSON object of the DID Document.
 */
export const didweb = async (req: Request, res: Response): Promise<void> => {
  try {
    const issuer = (req.query.issuer as string) || 'issuer1';
    const data = await didService.loadDidDocument(issuer);
    logger.info(`DID Document para ${issuer} obtenido con éxito`);
    res.status(200).json(data);
  } catch (error: any) {
    logger.error('Error obteniendo DID Document:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves all stored issuer DIDs.
 * @route GET /did/issuers
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response.
 * @returns {Promise<void>} JSON array of issuer DIDs, with warning if less than 3.
 */
export const getIssuersDidsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    const dids = await didService.getIssuersDids();
    const response: any = { issuers: dids };
    if (dids.length < 3) {
      response.warning = "Menos de 3 issuers disponibles";
    }
    res.status(200).json(response);
  } catch (error: any) {
    logger.error('Error al obtener los DIDs de los issuers:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Returns a JSON schema example for validation.
 * @route GET /schema
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response.
 * @returns {void} JSON object representing the schema.
 */
export const schema = (_req: Request, res: Response): void => {
  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      name: { type: 'string' },
      identifier: { type: 'string', pattern: '^[0-9]{8}[A-Z]$' },
    },
    required: ['name', 'identifier'],
  };
  logger.info('Schema accedido con éxito');
  res.status(200).json(schema);
};

/**
 * Issues a credential of the specified type.
 * @route POST /credentials/issue
 * @param {Request} req - Express request containing `type` in the body.
 * @param {Response} res - Express response.
 * @returns {Promise<void>} JSON payload from CredentialService on success.
 * @throws {MissingParameterError} If `type` is missing.
 */
export const issue = async (req: Request, res: Response): Promise<void> => {
  try {
    const credentialType = req.body.type;
    if (!credentialType) {
      throw new MissingParameterError('Missing parameter: type');
    }

    const issuerLabel = 
      credentialType.toLowerCase() === 'identity'   ? 'issuer1' :
      credentialType.toLowerCase() === 'identity2'  ? 'issuer1' :
      credentialType.toLowerCase() === 'passport'   ? 'issuer2' :
      credentialType.toLowerCase() === 'work'       ? 'issuer3' :
      null;

    if (!issuerLabel) {
      throw new Error('Tipo de credencial no soportado. Use "identity", "identity2", "passport" o "work".');
    }

    const didRecord = await didRepository.getDIDByLabel(issuerLabel);
    if (!didRecord) {
      throw new MissingParameterError(`No se encontró el DID para ${issuerLabel}, por favor primero llame a /did`);
    }

    const responseData = await credentialService.issueCredential(
      credentialType,
      didRecord.issuerDid,
      didRecord.issuerKey
    );
    res.status(200).json(responseData);
  } catch (error: any) {
    logger.error('Error emitiendo credencial:', error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 400) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
};

/**
 * Processes issuance status callbacks, updating credential status.
 * @route POST /statusCallback/:sessionId
 * @param {Request} req - Express request with `sessionId` in params and callback body.
 * @param {Response} res - Express response.
 * @returns {Promise<void>} Sends confirmation string on success.
 */
export const statusCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      throw new Error('sessionId not found in the callback URL');
    }
    await credentialService.updateCredentialStatusFromCallback(sessionId, req.body);
    res.status(200).send('Status callback processed successfully');
  } catch (error: any) {
    logger.error('Error procesando status callback:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves all credentials from local file storage.
 * @route GET /credentials
 * @param {Request} _req - Express request (unused).
 * @param {Response} res - Express response.
 * @returns {void} JSON array of credentials.
 */
export const getcred = (_req: Request, res: Response): void => {
  try {
    const credentials = credentialService.getAllCredentials();
    res.status(200).json(credentials);
  } catch (error: any) {
    logger.error('Error obteniendo credenciales:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves a specific credential by its numeric ID.
 * @route GET /credentials/:id
 * @param {Request} req - Express request with `id` param.
 * @param {Response} res - Express response.
 * @returns {void} JSON object of the requested credential.
 */
export const getscredx = (req: Request, res: Response): void => {
  try {
    const id = req.params.id;
    const credential = credentialService.getCredentialById(id);
    res.status(200).json(credential);
  } catch (error: any) {
    logger.error('Error obteniendo credencial por ID:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Updates the status of a credential.
 * @route POST /credentials/status
 * @param {Request} req - Express request with `credentialId` and `credentialStatus` in body.
 * @param {Response} res - Express response.
 * @returns {void} JSON confirmation string on success.
 */
export const upstatus = (req: Request, res: Response): void => {
  try {
    const { credentialId, credentialStatus } = req.body;
    credentialService.updateCredentialStatus(credentialId, credentialStatus);
    logger.info('Status de credencial actualizado con éxito');
    res.status(200).json('Status updated successfully');
  } catch (error: any) {
    logger.error('Error actualizando status de credencial:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Deletes a credential from local file storage.
 * @route DELETE /credentials/:id
 * @param {Request} req - Express request with `id` param.
 * @param {Response} res - Express response.
 * @returns {void} JSON confirmation string on success.
 */
export const delcred = (req: Request, res: Response): void => {
  try {
    const id = req.params.id;
    credentialService.deleteCredential(id);
    logger.info('Credencial eliminada con éxito');
    res.status(200).json('Credential deleted successfully');
  } catch (error: any) {
    logger.error('Error eliminando credencial:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Easter Egg endpoint returning a random fun message.
 * @route GET /.hidden-easter-egg
 * @param {Request} req - Express request.
 * @param {Response} res - Express response.
 * @returns {Promise<void>} JSON object with `message` property.
 */
export const easterEgg = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Easter Egg accedido por', { ip: req.ip, userAgent: req.headers['user-agent'] });
    const messages = [
      "¡Felicidades! Has encontrado el Easter Egg de ISSUER_COORD. 🎉",
      "¿Sabías que los desarrolladores también disfrutan programando en pijama? 🛌💻",
      "Easter Egg: ¡Este proyecto fue hecho con amor y café! ☕❤️",
      "¡No te preocupes, este Easter Egg no afecta el rendimiento! 😄",
      "Easter Egg: Si encuentras más, ¡has sido muy observador! 👀"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    res.status(200).json({ message: randomMessage });
  } catch (error: any) {
    logger.error('Error accediendo a Easter Egg:', { error, ip: req.ip });
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
