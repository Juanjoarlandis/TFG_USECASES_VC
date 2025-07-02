/**
 * @module src/models/RevokedCredential
 * @description Modelo de Mongoose para almacenar credenciales revocadas.
 *
 * @requires mongoose
 */

const mongoose = require("mongoose");

/**
 * Representa un documento de credencial revocada en MongoDB.
 *
 * @typedef {import('mongoose').Document & {
 *   credentialId: string
 * }} RevokedCredentialDocument
 */

/**
 * Esquema de Mongoose para la colección de credenciales revocadas.
 *
 * @type {import('mongoose').Schema<RevokedCredentialDocument>}
 */
const RevokedCredentialSchema = new mongoose.Schema({
  /**
   * Identificador único de la credencial revocada.
   * @type {{ type: StringConstructor, unique: boolean, required: boolean }}
   */
  credentialId: { type: String, unique: true, required: true },
});

/**
 * Modelo de Mongoose para credenciales revocadas.
 *
 * @name RevokedCredential
 * @type {import('mongoose').Model<RevokedCredentialDocument>}
 */
module.exports = mongoose.model("RevokedCredential", RevokedCredentialSchema);
