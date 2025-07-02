/**
 * @class CredStatus
 * @description
 *   Represents the state of a verifiable credential, encapsulating its unique
 *   identifier and current status.
 */
export class CredStatus {
  /**
   * Unique identifier of the credential.
   * @type {string}
   */
  public credentialId: string;

  /**
   * Current status of the credential (e.g., `'issued'`, `'pending'`, `'revoked'`).
   * @type {string}
   */
  public status: string;

  /**
   * Constructs a new {@link CredStatus} instance.
   *
   * @param {string} credentialId - The credential’s identifier; must be a non-empty string.
   * @param {string} status       - The credential’s status; must be a non-empty string.
   *
   * @throws {Error} If `credentialId` or `status` is not of type `string`.
   * @throws {Error} If `credentialId` or `status` is an empty string.
   *
   * @example
   * ```ts
   * const cs = new CredStatus('urn:uuid:abcd-1234', 'issued');
   * console.log(cs.credentialId); // 'urn:uuid:abcd-1234'
   * console.log(cs.status);       // 'issued'
   * ```
   */
  constructor(credentialId: string, status: string) {
    if (typeof credentialId !== 'string' || typeof status !== 'string') {
      throw new Error('Both credentialId and status must be strings');
    }
    if (!credentialId.trim() || !status.trim()) {
      throw new Error('Both credentialId and status are required and cannot be empty');
    }

    this.credentialId = credentialId;
    this.status = status;
  }
}
