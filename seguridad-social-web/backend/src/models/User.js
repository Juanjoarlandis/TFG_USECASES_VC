/**
 * @file User.js
 * @description Defines the Mongoose schema and model for a User.
 * The schema includes personal information, credential status, and settings.
 * The `nss` field is encrypted using mongoose-encryption.
 * @module models/User
 */

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

/**
 * User schema definition.
 * @typedef {Object} User
 * @property {String} firstName - The user's first name.
 * @property {String} familyName - The user's family name.
 * @property {String} documentNumber - Unique document number (e.g., DNI). Must be unique.
 * @property {String} gender - The user's gender.
 * @property {String} nationality - The user's nationality.
 * @property {Date} birthDate - The user's birth date.
 * @property {String} nss - Social Security Number (encrypted).
 * @property {String} photo - URL or reference to the user's photo.
 * @property {Boolean} hasAltaCredential - Indicates if the user has a pending credential issuance.
 * @property {Date} altaIssueDate - The date when the credential was issued.
 * @property {String} altaCredentialJti - Identifier for the issued credential.
 * @property {Object} altaCredentialData - Data of the issued credential.
 * @property {String[]} refreshTokens - Array of refresh tokens associated with the user.
 * @property {String} flow - The current flow type (default is 'manual').
 * @property {Date} createdAt - Timestamp when the user document was created.
 * @property {Date} updatedAt - Timestamp when the user document was last updated.
 */
const UserSchema = new mongoose.Schema({
    firstName: String,
    familyName: String,
    documentNumber: { type: String, unique: true },
    gender: String,
    nationality: String,
    birthDate: Date,
    nss: String,
    photo: String,
    hasAltaCredential: { type: Boolean, default: false },
    altaIssueDate: { type: Date, default: null },
    altaCredentialJti: { type: String, default: null },
    altaCredentialData: { type: Object, default: null },
    refreshTokens: [String],
    flow: { type: String, default: 'manual' }
}, { timestamps: true });

// Encryption keys are loaded from environment variables.
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.SIGNING_KEY;

// Convert the base64-encoded keys to buffers.
const encKeyBuf = Buffer.from(encKey, 'base64');
const sigKeyBuf = Buffer.from(sigKey, 'base64');

// Apply the encryption plugin to encrypt sensitive fields (in this case, "nss").
UserSchema.plugin(encrypt, {
    encryptionKey: encKeyBuf,
    signingKey: sigKeyBuf,
    encryptedFields: ['nss']
});

module.exports = mongoose.model('User', UserSchema);
