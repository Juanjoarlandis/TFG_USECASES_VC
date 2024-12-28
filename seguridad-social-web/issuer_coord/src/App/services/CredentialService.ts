import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { FileRepository } from '../repositories/FileRepository';
import { MissingParameterError, CredentialIDError, NotFoundError, IssuerCoordError } from '../errors/errors';

/**
 * Importamos bitstringService para asignar 'statusListIndex' en cada credencial.
 */
import { bitstringService } from './bitstringService';

/**
 * Obtenemos la variable de entorno DEBUG_BITSTRING (true o false).
 * Si no está definida, por defecto false.
 */
const DEBUG_BITSTRING = (process.env.DEBUG_BITSTRING === 'true');

/**
 * Servicio que gestiona la emisión, actualización de estado, borrado y consulta de credenciales.
 * Emite credenciales usando walt.id ya sea en modo OpenID4VC o firma directa.
 * Almacena las credenciales emitidas en ficheros locales.
 */
export class CredentialService {
  private mode: string;
  private waltidUrl: string;
  private fileRepository: FileRepository;

  constructor(fileRepository: FileRepository) {
    this.mode = process.env.MODE?.toLowerCase() || 'open';
    this.waltidUrl = process.env.WALTID_URL!;
    this.fileRepository = fileRepository;
  }

  /**
   * Emite una credencial del tipo indicado, firmándola con las llaves del issuer.
   * @param credentialType Tipo de credencial (Identity, Passport, Work, etc.).
   * @param issuerDid DID del issuer emisor.
   * @param issuerKey Llave del issuer para firmar la credencial.
   * @returns Objeto con `issuanceUrl` (en modo open) o `signedCredential` (en modo direct).
   */
  public async issueCredential(
    credentialType: string,
    issuerDid: string,
    issuerKey: any
  ): Promise<any> {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> issueCredential(${credentialType}, ${issuerDid})`);
    }

    if (!credentialType) {
      throw new MissingParameterError('Missing parameter: type');
    }

    // Generamos un UUID para la credencial
    const credentialUuid = uuidv4();
    const credentialId = `urn:uuid:${credentialUuid}`;
    
    // Pedimos un índice libre en el bitstring:
    const statusListIndex = bitstringService.getFreeIndex();
    const statusListIndexStr = statusListIndex.toString();

    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> Obtenido statusListIndex=${statusListIndexStr}`);
    }

    // Variables para construir la credencial base
    let credentialConfigurationId: string;
    let credentialData: any;

    // Dependiendo del tipo, construimos un JSON distinto
    switch (credentialType.toLowerCase()) {
      case 'identity':
        credentialConfigurationId = 'CustomIdentityCredential_jwt_vc_json';
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
              "identifier": "12345678ABB",
              "givenName": "Julio",
              "familyName": "Perez",
              "gender": "M",
              "nationality": "ES",
              "birthDate": "1990-01-01",
              "nss": "123456789012",
              "photo": "/dni.webp"
            }
          }
        };
        break;

      case 'identity2':
        credentialConfigurationId = 'CustomIdentityCredential_jwt_vc_json';
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
          "name": "Documento Nacional de Identidad (versión 2)",
          "description": "Credencial verificable de identidad personal con imagen renovada",
          "validFrom": "2024-12-08T10:19:28Z",
          "expirationDate": "2025-12-08T10:19:28Z",
          "category": "Identity",
          "credentialSubject": {
            "id": "did:web:localhost:6000",
            "dni": {
              "identifier": "12345678CCC",
              "givenName": "María",
              "familyName": "Perez",
              "gender": "F",
              "nationality": "ES",
              "birthDate": "1990-01-01",
              "nss": "12345678901333",
              "photo": "/dni2.webp"
            }
          }
        };
        break;

      case 'passport':
        credentialConfigurationId = 'PassportCredential_jwt_vc_json';
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
        break;

      case 'work':
        credentialConfigurationId = 'EmployerRegistrationCredential_jwt_vc_json';
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
        break;

      default:
        throw new Error('Tipo de credencial no soportado. Use "Identity", "identity2", "Passport" o "Work".');
    }

    // Insertar credentialStatus para Bitstring
    credentialData.credentialStatus = {
      id: `https://issuer-coord.com/bitstring-status-list#${statusListIndexStr}`,
      type: "BitstringStatusListEntry",
      statusPurpose: "revocation",
      statusListIndex: statusListIndexStr,
      statusListCredential: "https://issuer-coord.com/bitstring-status-list"
    };

    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> credentialData con credentialStatus:\n${JSON.stringify(credentialData.credentialStatus, null, 2)}`);
    }

    // Determinamos status según modo (open => 'pending', direct => 'issued')
    const status = this.mode === 'open' ? 'pending' : 'issued';

    // Directorio de credenciales
    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    this.fileRepository.ensureDirectoryExists(credentialsDir);

    if (this.mode === 'open') {
      // === MODO OpenID4VC ===
      const authenticationMethod = 'PRE_AUTHORIZED';
      const payload = {
        issuerKey,
        issuerDid,
        credentialConfigurationId,
        credentialData,
        mapping: {
          id: credentialData.id,
          issuer: { id: credentialData.issuer.id },
          credentialSubject: { id: credentialData.credentialSubject.id },
          issuanceDate: credentialData.validFrom,
          expirationDate: credentialData.expirationDate
        },
        authenticationMethod
      };

      if (DEBUG_BITSTRING) {
        logger.debug('[CredentialService] -> Enviando a walt.id (modo=open) con payload:', payload);
      }

      const issueUrl_openid = `${this.waltidUrl}/openid4vc/jwt/issue`;
      const issueResponse = await axios.post<string>(issueUrl_openid, payload, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      });

      if (issueResponse.status !== 200 && issueResponse.status !== 201) {
        logger.error(`OpenID Issue -> status ${issueResponse.status}`, issueResponse.data);
        throw new IssuerCoordError(`Failed to issue credential via OpenID. Status code: ${issueResponse.status}`);
      }

      const issuanceUrl = issueResponse.data;
      if (!issuanceUrl) {
        logger.error('[CredentialService] -> issuanceUrl vacío en la respuesta walt.id');
        throw new Error('issuanceUrl not found in the response from walt.id');
      }

      const credentialToStore = {
        credentialData,
        status,
        issuanceUrl,
        issuanceTime: new Date().toISOString()
      };

      const credentialFilePath = path.join(credentialsDir, `credential_${credentialUuid}.json`);
      this.fileRepository.writeJSON(credentialFilePath, credentialToStore);

      if (DEBUG_BITSTRING) {
        logger.debug(`[CredentialService] -> Credencial (open) guardada en ${credentialFilePath}`);
      }

      return { issuanceUrl };
    } else {
      // === MODO Direct ===
      const directPayload = {
        issuerKey,
        issuerDid,
        subjectDid: issuerDid,
        credentialData
      };

      if (DEBUG_BITSTRING) {
        logger.debug('[CredentialService] -> Enviando a walt.id (modo=direct) con payload:', directPayload);
      }

      const issueUrl_direct = `${this.waltidUrl}/raw/jwt/sign`;
      const issueResponseDirect = await axios.post<string>(issueUrl_direct, directPayload, {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
      });

      if (issueResponseDirect.status !== 200 && issueResponseDirect.status !== 201) {
        logger.error(`Direct Sign -> status ${issueResponseDirect.status}`, issueResponseDirect.data);
        throw new IssuerCoordError(`Failed to issue credential via Direct Signing. Status code: ${issueResponseDirect.status}`);
      }

      const signedCredential = issueResponseDirect.data;
      if (!signedCredential) {
        logger.error('[CredentialService] -> signedCredential vacío en la respuesta walt.id');
        throw new Error('Signed credential not found in the response from walt.id');
      }

      const credentialToStore = {
        credentialData,
        status,
        signedCredential,
        issuanceTime: new Date().toISOString()
      };

      const credentialFilePath = path.join(credentialsDir, `credential_${credentialUuid}.json`);
      this.fileRepository.writeJSON(credentialFilePath, credentialToStore);

      if (DEBUG_BITSTRING) {
        logger.debug(`[CredentialService] -> Credencial (direct) guardada en ${credentialFilePath}`);
      }

      return { signedCredential };
    }
  }

  /**
   * Actualiza el estado de una credencial a 'issued' tras recibir un callback de estado.
   * Busca la credencial por sessionId en las issuanceUrl locales.
   * @param sessionId Identificador de sesión.
   * @param statusData Datos de estado recibidos del callback.
   */
  public updateCredentialStatusFromCallback(sessionId: string, statusData: any): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> updateCredentialStatusFromCallback(${sessionId}) with data:`, statusData);
    }

    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    const files = this.fileRepository.listFiles(credentialsDir);

    let targetFilePath = '';
    let credentialData: any;

    for (const fileName of files) {
      const filePath = path.join(credentialsDir, fileName);
      const fileContent = this.fileRepository.readJSON(filePath);

      if (fileContent.issuanceUrl && fileContent.issuanceUrl.includes(sessionId)) {
        credentialData = fileContent;
        targetFilePath = filePath;
        break;
      }
    }

    if (!targetFilePath) {
      throw new NotFoundError(`Credential with sessionId ${sessionId} not found`);
    }

    credentialData.status = 'issued';
    this.fileRepository.writeJSON(targetFilePath, credentialData);
    logger.info(`[CredentialService] -> Credencial actualizada a 'issued' para sessionId=${sessionId}`);
  }

  /**
   * Retorna todas las credenciales almacenadas en el sistema de ficheros.
   * @returns Lista de credenciales.
   */
  public getAllCredentials(): any[] {
    if (DEBUG_BITSTRING) {
      logger.debug('[CredentialService] -> getAllCredentials()');
    }

    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    const files = this.fileRepository.listFiles(credentialsDir);
    const credentials = [];
    for (const file of files) {
      const filePath = path.join(credentialsDir, file);
      const credential = this.fileRepository.readJSON(filePath);
      credentials.push(credential);
    }
    return credentials;
  }

  /**
   * Retorna una credencial específica por su ID numérico.
   * @param id ID numérico de la credencial.
   * @returns La credencial correspondiente.
   */
  public getCredentialById(id: string): any {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> getCredentialById(${id})`);
    }

    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    const filePath = path.join(credentialsDir, `credential_${id}.json`);
    return this.fileRepository.readJSON(filePath);
  }

  /**
   * Actualiza el estado de una credencial, almacenándolo en un fichero de estado separado.
   * @param credentialId Identificador completo de la credencial.
   * @param statusObj Objeto con `credentialId` y `status` representando el nuevo estado.
   */
  public updateCredentialStatus(
    credentialId: string,
    statusObj: { credentialId: string; status: string }
  ): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> updateCredentialStatus(${credentialId}) =`, statusObj);
    }

    if (!credentialId || !statusObj) {
      throw new MissingParameterError('Missing required parameter');
    }

    const id = this.extractIdFromCredentialId(credentialId);

    const statusDir = path.join(__dirname, '..', '..', 'data', 'status');
    this.fileRepository.ensureDirectoryExists(statusDir);

    const statusFilePath = path.join(statusDir, `status${id}.json`);
    this.fileRepository.writeJSON(statusFilePath, statusObj);
  }

  /**
   * Elimina una credencial del almacenamiento local.
   * @param id ID numérico de la credencial.
   */
  public deleteCredential(id: string): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] -> deleteCredential(${id})`);
    }

    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    const filePath = path.join(credentialsDir, `credential_${id}.json`);
    this.fileRepository.deleteFile(filePath);
  }

  /**
   * Extrae el ID final a partir de un identificador de credencial completo,
   * asumiendo que el ID está al final del string separado por '/'. 
   * Lanza un error si no se encuentra.
   * @param credentialId Identificador completo de la credencial.
   * @returns ID extraído (string).
   */
  private extractIdFromCredentialId(credentialId: string): string {
    const parts = credentialId.split('/');
    const _id = parts.pop();
    if (!_id) {
      throw new CredentialIDError('No ID found in the credential ID');
    }
    return _id;
  }
}
