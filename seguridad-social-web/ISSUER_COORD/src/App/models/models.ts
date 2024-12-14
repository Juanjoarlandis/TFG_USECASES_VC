/**
 * Representa el estado de una credencial.
 * Incluye el ID de la credencial y su estado actual.
 */
export class CredStatus {
  credentialId: string;
  status: string;

/**
 * Crea una instancia de CredStatus.
 * @param credentialId Identificador de la credencial.
 * @param status Estado de la credencial (ej: 'issued', 'pending').
 * @throws Error si credentialId o status no son strings o están vacíos.
 */
  constructor(credentialId: string, status: string) {
    if (typeof credentialId !== 'string' || typeof status !== 'string') {
      throw new Error('Both credentialId and status must be strings');
    }

    if (!credentialId || !status) {
      throw new Error('Both credentialId and status are required');
    }
    this.credentialId = credentialId;
    this.status = status;
  }
}
