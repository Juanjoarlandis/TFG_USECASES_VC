"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredStatus = void 0;
class CredStatus {
    constructor(credentialId, status) {
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
exports.CredStatus = CredStatus;
