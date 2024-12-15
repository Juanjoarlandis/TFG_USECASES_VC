import fetch from 'node-fetch';
import logger from '../../logger';
import { DIDRepository } from '../repositories/DIDRepository';
import { NotFoundError } from '../errors/errors';

export class DIDService {
  private vaultTransitUrl: string;
  private waltidUrl: string;
  private didRepository: DIDRepository;

  constructor(didRepository: DIDRepository) {
    this.vaultTransitUrl = process.env.VAULT_TRANSIT_URL!;
    this.waltidUrl = process.env.WALTID_URL!;
    this.didRepository = didRepository;
  }

  /**
 * Crea un DID para un issuer dado, solicitando a walt.id y guardando en la BBDD.
 * @param roleId Identificador de rol del issuer.
 * @param secretId Secreto asociado al rol.
 * @param issuerLabel Etiqueta interna para identificar al issuer.
 * @returns Objeto con `issuerDid` y `issuerKey`.
 */
  public async createDidForIssuer(roleId: string, secretId: string, issuerLabel: string) {
    const requestBody = {
      key: {
        backend: 'tse',
        keyType: 'Ed25519',
        config: {
          server: this.vaultTransitUrl,
          auth: {
            roleId,
            secretId
          }
        }
      },
      did: {
        method: 'key'
      }
    };

    const onboardUrl = `${this.waltidUrl}/onboard/issuer`;
    const response = await fetch(onboardUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Error al crear el DID para ${issuerLabel}: ${response.statusText}`);
    }

    const data = await response.json();
    const issuerDid = data.issuerDid;
    const issuerKey = data.issuerKey;

    const publicKeyJwk = { ...issuerKey.jwk };
    delete publicKeyJwk.d;

    const verificationMethod = {
      id: `${issuerDid}#key-1`,
      type: 'JsonWebKey2020',
      controller: issuerDid,
      publicKeyJwk
    };

    const didDocument = {
      '@context': 'https://www.w3.org/ns/did/v1',
      id: issuerDid,
      verificationMethod: [verificationMethod],
      authentication: [verificationMethod.id],
      assertionMethod: [verificationMethod.id],
    };

    logger.info(`Documento DID para ${issuerLabel} creado exitosamente`);

    await this.didRepository.createDID({
      issuerLabel,
      issuerDid,
      issuerKey,
      didDocument
    });

    return { issuerDid, issuerKey };
  }

  /**
 * Obtiene todos los DIDs de los issuers almacenados en la BBDD.
 * @returns Lista de strings con los issuerDids.
 */
  public async getIssuersDids(): Promise<string[]> {
    const allDids = await this.didRepository.getAllDIDs();
    return allDids.map(d => d.issuerDid);
  }

  /**
 * Carga el DID Document completo de un issuer en base a su etiqueta (issuerLabel).
 * @param issuer Nombre del issuer (ej: 'issuer1', 'issuer2', 'issuer3').
 * @returns Objeto JSON con el DID Document.
 */
  public async loadDidDocument(issuer: string): Promise<any> {
    const didRecord = await this.didRepository.getDIDByLabel(issuer);
    if (!didRecord) {
      throw new NotFoundError(`DID document for ${issuer} not found`);
    }
    return didRecord.didDocument;
  }
}
