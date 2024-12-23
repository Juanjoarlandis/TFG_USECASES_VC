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
 * Responde con 'pong' para verificar que el servicio está vivo.
 * @route GET /ping
 */
export const ping = (_req: Request, res: Response) => {
  logger.info('Ping received');
  res.send('pong');
};

/**
 * Crea DIDs para tres issuers diferentes usando las credenciales (ROLE_ID, SECRET_ID)
 * obtenidas de entorno. Los guarda en la BBDD.
 * @route GET /did
 * @returns Objeto JSON con los DIDs creados.
 */
export const cr_did = async (_req: Request, res: Response) => {
  try {
    const roleIdIssuer1 = process.env.ROLE_ID_ISSUER1;
    const secretIdIssuer1 = process.env.SECRET_ID_ISSUER1;

    const roleIdIssuer2 = process.env.ROLE_ID_ISSUER2;
    const secretIdIssuer2 = process.env.SECRET_ID_ISSUER2;

    const roleIdIssuer3 = process.env.ROLE_ID_ISSUER3;
    const secretIdIssuer3 = process.env.SECRET_ID_ISSUER3;

    if (!roleIdIssuer1 || !secretIdIssuer1 || !roleIdIssuer2 || !secretIdIssuer2 || !roleIdIssuer3 || !secretIdIssuer3) {
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
 * Obtiene el DID Document de un issuer específico.
 * @route GET /.well-known/did.json?issuer=issuer1|issuer2|issuer3
 * @param req query.issuer Identificador del issuer (opcional, por defecto issuer1).
 * @returns Objeto JSON con el DID Document.
 */
export const didweb = async (req: Request, res: Response) => {
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
 * Obtiene la lista de todos los issuerDids almacenados en la BBDD.
 * @route GET /did/issuers
 * @returns Lista de DIDs y, opcionalmente, una advertencia si hay menos de 3.
 */
export const getIssuersDidsEndpoint = async (_req: Request, res: Response) => {
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
 * Devuelve un esquema JSON de ejemplo para validación.
 * @route GET /schema
 * @returns Objeto JSON con el esquema.
 */
export const schema = (_req: Request, res: Response) => {
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
 * Emite una credencial del tipo especificado (Identity, Passport o Work).
 * Hace uso del DID y la llave del issuer correspondiente, previamente almacenados en la BBDD.
 * @route POST /credentials/issue
 * @param req.body.type Tipo de credencial a emitir.
 * @returns URL de emisión o credencial firmada dependiendo del modo (open o direct).
 */
export const issue = async (req: Request, res: Response) => {
  try {
    const credentialType = req.body.type;
    if (!credentialType) {
      throw new MissingParameterError('Missing parameter: type');
    }

    // 1) Vinculamos cada 'type' con un issuerLabel
    //    'identity2' será tratado de forma parecida a 'identity', pero con cambios en la imagen.
    const issuerLabel =
      credentialType.toLowerCase() === 'identity'
        ? 'issuer1'
        : credentialType.toLowerCase() === 'identity2'
        ? 'issuer1'  // Usamos también 'issuer1', pero luego en la construcción de credData cambiaremos la imagen
        : credentialType.toLowerCase() === 'passport'
        ? 'issuer2'
        : credentialType.toLowerCase() === 'work'
        ? 'issuer3'
        : null;

    if (!issuerLabel) {
      throw new Error('Tipo de credencial no soportado. Use "identity", "identity2", "passport" o "work".');
    }

    const didRecord = await didRepository.getDIDByLabel(issuerLabel);
    if (!didRecord) {
      throw new MissingParameterError(`No se encontró el DID para ${issuerLabel}, por favor primero llame a /did`);
    }

    const issuerDid = didRecord.issuerDid;
    const issuerKey = didRecord.issuerKey;

    // 2) Llamamos al servicio que emite la credencial (CredentialService), 
    //    pasándole 'identity2' como credentialType si aplica.
    const responseData = await credentialService.issueCredential(credentialType, issuerDid, issuerKey);
    res.status(200).json(responseData);
  } catch (error: any) {
    logger.error('Error emitiendo credencial:', error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code && error.code === 400) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
};
/**
 * Procesa una devolución de estado (callback) desde el servicio de emisión,
 * actualizando el estado de la credencial a 'issued'.
 * @route POST /statusCallback/:sessionId
 * @param req.params.sessionId Identificador de sesión de emisión.
 */
export const statusCallback = async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      throw new Error('sessionId not found in the callback URL');
    }

    credentialService.updateCredentialStatusFromCallback(sessionId, req.body);
    res.status(200).send('Status callback processed successfully');
  } catch (error: any) {
    logger.error('Error procesando status callback:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene todas las credenciales almacenadas localmente en el sistema de ficheros.
 * @route GET /credentials
 * @returns Lista de credenciales emitidas.
 */
export const getcred = (_req: Request, res: Response) => {
  try {
    const credentials = credentialService.getAllCredentials();
    res.status(200).json(credentials);
  } catch (error: any) {
    logger.error('Error obteniendo credenciales:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Obtiene una credencial específica por su ID numérico.
 * @route GET /credentials/:id
 * @param req.params.id ID numérico de la credencial (formato integer).
 * @returns La credencial solicitada.
 */
export const getscredx = (req: Request, res: Response) => {
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
 * Actualiza el estado de una credencial, almacenándolo en un fichero de estado.
 * @route POST /credentials/status
 * @param req.body.credentialId Identificador completo de la credencial.
 * @param req.body.credentialStatus Nuevo estado de la credencial.
 */
export const upstatus = (req: Request, res: Response) => {
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
 * Elimina una credencial del almacenamiento local de ficheros.
 * @route DELETE /credentials/:id
 * @param req.params.id ID numérico de la credencial.
 */
export const delcred = (req: Request, res: Response) => {
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
 * Devuelve un mensaje aleatorio (Easter Egg).
 * @route GET /.hidden-easter-egg
 * @returns Mensaje aleatorio con un easter egg.
 */
export const easterEgg = async (req: Request, res: Response) => {
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
