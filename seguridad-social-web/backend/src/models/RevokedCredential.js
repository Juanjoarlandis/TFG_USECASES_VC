/**
 * @file RevokedCredential.js
 * @description Defines the Mongoose schema and model for revoked credentials.
 * A revoked credential is uniquely identified by its credentialId.
 * @module models/RevokedCredential
 */

const mongoose = require('mongoose');

/**
 * Mongoose Schema for a revoked credential.
 * @typedef {Object} RevokedCredential
 * @property {String} credentialId - Unique identifier for the revoked credential.
 */
const RevokedCredentialSchema = new mongoose.Schema({
    credentialId: { type: String, unique: true, required: true }
});

module.exports = mongoose.model('RevokedCredential', RevokedCredentialSchema);
