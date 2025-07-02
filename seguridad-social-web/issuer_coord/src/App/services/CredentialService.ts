import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger';
import { FileRepository } from '../repositories/FileRepository';
import {
  MissingParameterError,
  CredentialIDError,
  NotFoundError,
  IssuerCoordError
} from '../errors/errors';
import { bitstringService } from './bitstringService';

/**
 * Flag to enable debug logging for bitstring operations.
 * @constant {boolean}
 */
const DEBUG_BITSTRING: boolean = process.env.DEBUG_BITSTRING === 'true';

/**
 * @class CredentialService
 * @description
 * Manages issuance, status updates, storage, retrieval and revocation of Verifiable Credentials (VCs).
 * Supports both OpenID4VC ("open") and direct JWT signing ("direct") modes via Walt.id endpoints.
 * Persists issued credentials and status files under `data/credentials` and `data/status`.
 */
export class CredentialService {
  private mode: 'open' | 'direct';
  private waltidUrl: string;
  private fileRepository: FileRepository;

  /**
   * Creates an instance of CredentialService.
   *
   * @param {FileRepository} fileRepository - Repository for file I/O operations.
   * @throws {Error} If WALTID_URL environment variable is not defined.
   */
  constructor(fileRepository: FileRepository) {
    this.mode = (process.env.MODE?.toLowerCase() as 'open' | 'direct') || 'open';
    this.waltidUrl = process.env.WALTID_URL!;
    this.fileRepository = fileRepository;
  }

  /**
   * Issues a new credential of the given type.
   * 
   * In "open" mode, returns a pre-authorized issuance URL (pending state).
   * In "direct" mode, returns the signed JWT credential immediately (issued state).
   *
   * @async
   * @param {string} credentialType - Type of credential (e.g., "identity", "passport", "work").
   * @param {string} issuerDid - DID of the issuer.
   * @param {any} issuerKey - Cryptographic key material for signing.
   * @returns {Promise<{ issuanceUrl?: string, signedCredential?: string }>}
   *   Object containing either `issuanceUrl` (open mode) or `signedCredential` (direct mode).
   * @throws {MissingParameterError} If `credentialType` is not provided.
   * @throws {IssuerCoordError} If Walt.id returns a non-200 status.
   * @throws {Error} If response payload is missing expected data.
   *
   * @example
   * ```ts
   * const result = await credentialService.issueCredential(
   *   'identity',
   *   'did:web:issuer.example',
   *   issuerKeyJwk
   * );
   *
   * if (result.issuanceUrl) {
   *   // OpenID flow
   * } else if (result.signedCredential) {
   *   // Direct JWT flow
   * }
   * ```
   */
  public async issueCredential(
    credentialType: string,
    issuerDid: string,
    issuerKey: any
  ): Promise<{ issuanceUrl?: string; signedCredential?: string }> {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] issueCredential type=${credentialType}, issuerDid=${issuerDid}`);
    }
    if (!credentialType) {
      throw new MissingParameterError('Missing parameter: type');
    }

    // Generate unique credential ID
    const credentialUuid = uuidv4();
    const credentialId = `urn:uuid:${credentialUuid}`;

    // Allocate a free bitstring index for revocation tracking
    const statusListIndex = bitstringService.getFreeIndex();
    const statusListIndexStr = statusListIndex.toString();

    // Build base credential data depending on type
    let credentialConfigurationId: string;
    let credentialData: any;

    switch (credentialType.toLowerCase()) {
      case 'identity':
      case 'identity2':
        credentialConfigurationId = 'CustomIdentityCredential_jwt_vc_json';
        credentialData = {/* ... identity credential payload ... */};
        break;
      case 'passport':
        credentialConfigurationId = 'PassportCredential_jwt_vc_json';
        credentialData = {/* ... passport credential payload ... */};
        break;
      case 'work':
        credentialConfigurationId = 'EmployerRegistrationCredential_jwt_vc_json';
        credentialData = {/* ... employer registration payload ... */};
        break;
      default:
        throw new Error(
          'Unsupported credential type. Use "identity", "identity2", "passport" or "work".'
        );
    }

    // Attach revocation status entry
    credentialData.credentialStatus = {
      id: `https://issuer-coord.com/bitstring-status-list#${statusListIndexStr}`,
      type: 'BitstringStatusListEntry',
      statusPurpose: 'revocation',
      statusListIndex: statusListIndexStr,
      statusListCredential: 'https://issuer-coord.com/bitstring-status-list'
    };

    // Determine issuance state
    const status = this.mode === 'open' ? 'pending' : 'issued';

    // Ensure credentials directory exists
    const credentialsDir = path.join(__dirname, '..', '..', 'data', 'credentials');
    this.fileRepository.ensureDirectoryExists(credentialsDir);

    if (this.mode === 'open') {
      // OpenID4VC issuance flow
      const issueUrl = `${this.waltidUrl}/openid4vc/jwt/issue`;
      const payload = {
        issuerKey,
        issuerDid,
        credentialConfigurationId,
        credentialData,
        mapping: {/* ... mapping fields ... */},
        authenticationMethod: 'PRE_AUTHORIZED'
      };

      const resp = await axios.post<string>(issueUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!(resp.status === 200 || resp.status === 201)) {
        throw new IssuerCoordError(`OpenID issue failed (${resp.status})`);
      }
      const issuanceUrl = resp.data;
      if (!issuanceUrl) {
        throw new Error('Missing issuanceUrl in OpenID response');
      }

      // Persist credential record
      const record = { credentialData, status, issuanceUrl, issuanceTime: new Date().toISOString() };
      const filePath = path.join(credentialsDir, `credential_${credentialUuid}.json`);
      this.fileRepository.writeJSON(filePath, record);

      return { issuanceUrl };
    } else {
      // Direct JWT signing flow
      const issueUrl = `${this.waltidUrl}/raw/jwt/sign`;
      const resp = await axios.post<string>(
        issueUrl,
        { issuerKey, issuerDid, subjectDid: issuerDid, credentialData },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!(resp.status === 200 || resp.status === 201)) {
        throw new IssuerCoordError(`Direct sign failed (${resp.status})`);
      }
      const signedCredential = resp.data;
      if (!signedCredential) {
        throw new Error('Missing signedCredential in direct response');
      }

      // Persist credential record
      const record = { credentialData, status, signedCredential, issuanceTime: new Date().toISOString() };
      const filePath = path.join(credentialsDir, `credential_${credentialUuid}.json`);
      this.fileRepository.writeJSON(filePath, record);

      return { signedCredential };
    }
  }

  /**
   * Updates a credential’s status to 'issued' based on a callback session ID.
   *
   * @param {string} sessionId - Identifier used in issuance URL.
   * @param {any} statusData - Callback payload from issuer service.
   * @throws {NotFoundError} If no matching credential file is found.
   */
  public updateCredentialStatusFromCallback(sessionId: string, statusData: any): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] updateCredentialStatusFromCallback sessionId=${sessionId}`);
    }
    const dir = path.join(__dirname, '..', '..', 'data', 'credentials');
    const files = this.fileRepository.listFiles(dir);
    let targetPath: string | null = null;
    for (const f of files) {
      const filePath = path.join(dir, f);
      const content = this.fileRepository.readJSON(filePath);
      if (content.issuanceUrl?.includes(sessionId)) {
        targetPath = filePath;
        content.status = 'issued';
        this.fileRepository.writeJSON(filePath, content);
        logger.info(`Credential status updated to 'issued' for sessionId=${sessionId}`);
        return;
      }
    }
    throw new NotFoundError(`Credential for sessionId ${sessionId} not found`);
  }

  /**
   * Retrieves all persisted credentials.
   *
   * @returns {any[]} Array of credential records.
   */
  public getAllCredentials(): any[] {
    if (DEBUG_BITSTRING) {
      logger.debug('[CredentialService] getAllCredentials');
    }
    const dir = path.join(__dirname, '..', '..', 'data', 'credentials');
    return this.fileRepository
      .listFiles(dir)
      .map(f => this.fileRepository.readJSON(path.join(dir, f)));
  }

  /**
   * Retrieves a specific credential by its numeric ID.
   *
   * @param {string} id - Numeric portion of the credential filename.
   * @returns {any} The credential record.
   */
  public getCredentialById(id: string): any {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] getCredentialById id=${id}`);
    }
    const filePath = path.join(__dirname, '..', '..', 'data', 'credentials', `credential_${id}.json`);
    return this.fileRepository.readJSON(filePath);
  }

  /**
   * Updates the status of a credential and writes it to a status file.
   *
   * @param {string} credentialId - Full URN or URL of the credential.
   * @param {{ credentialId: string; status: string }} statusObj - New status object.
   * @throws {MissingParameterError} If parameters are missing.
   */
  public updateCredentialStatus(
    credentialId: string,
    statusObj: { credentialId: string; status: string }
  ): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] updateCredentialStatus credentialId=${credentialId}`);
    }
    if (!credentialId || !statusObj) {
      throw new MissingParameterError('Missing required parameter');
    }
    const id = this.extractIdFromCredentialId(credentialId);
    const statusDir = path.join(__dirname, '..', '..', 'data', 'status');
    this.fileRepository.ensureDirectoryExists(statusDir);
    const filePath = path.join(statusDir, `status${id}.json`);
    this.fileRepository.writeJSON(filePath, statusObj);
  }

  /**
   * Deletes a credential record from local storage.
   *
   * @param {string} id - Numeric portion of the credential filename.
   */
  public deleteCredential(id: string): void {
    if (DEBUG_BITSTRING) {
      logger.debug(`[CredentialService] deleteCredential id=${id}`);
    }
    const filePath = path.join(__dirname, '..', '..', 'data', 'credentials', `credential_${id}.json`);
    this.fileRepository.deleteFile(filePath);
  }

  /**
   * Extracts the numeric ID from a full credential identifier.
   *
   * @private
   * @param {string} credentialId - Full URN or URL containing the UUID.
   * @returns {string} The extracted UUID portion.
   * @throws {CredentialIDError} If no valid ID is found.
   */
  private extractIdFromCredentialId(credentialId: string): string {
    const parts = credentialId.split('/');
    const id = parts.pop();
    if (!id) {
      throw new CredentialIDError('No ID found in the credential ID');
    }
    return id;
  }
}
