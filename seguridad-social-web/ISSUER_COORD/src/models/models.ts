export class CredStatus {
  credentialId: string;
  status: string;

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
