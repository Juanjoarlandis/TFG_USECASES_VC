/**
 * @module src/models/DIDModel
 * @description
 * Mongoose model for storing issuer-specific Decentralized Identifiers (DIDs)
 * and their corresponding DID Documents.
 */

import { Schema, model, Document } from 'mongoose';

/**
 * @interface DIDDocument
 * @description
 * Represents the data structure stored for each issuer's DID entry.
 *
 * @property {string} issuerLabel   - Unique label identifying the issuer (e.g. 'issuer1').
 * @property {string} issuerDid     - The Decentralized Identifier (DID) string for the issuer.
 * @property {any}    issuerKey     - Cryptographic key material associated with the issuer DID.
 * @property {any}    didDocument   - The full DID Document object (public keys, services, etc.).
 */
export interface DIDDocument {
  issuerLabel: string;
  issuerDid: string;
  issuerKey: any;
  didDocument: any;
}

/**
 * @interface DIDDocumentModel
 * @extends DIDDocument
 * @extends Document
 * @description
 * Mongoose Document interface that combines the DIDDocument properties
 * with Mongoose's built-in Document methods and properties.
 */
export interface DIDDocumentModel extends DIDDocument, Document {}

/**
 * @constant {Schema<DIDDocumentModel>} DIDSchema
 * @description
 * Mongoose schema defining the structure and validation for DIDDocumentModel.
 */
const DIDSchema = new Schema<DIDDocumentModel>({
  /**
   * Unique label for the issuer (e.g. 'issuer1').
   */
  issuerLabel: {
    type: String,
    required: true,
    unique: true
  },
  /**
   * The Decentralized Identifier (DID) string for the issuer.
   */
  issuerDid: {
    type: String,
    required: true
  },
  /**
   * Cryptographic key or key material associated with the issuer DID.
   */
  issuerKey: {
    type: Object,
    required: true
  },
  /**
   * The full DID Document object for the issuer, containing public keys, service endpoints, etc.
   */
  didDocument: {
    type: Object,
    required: true
  }
});

/**
 * @constant {import('mongoose').Model<DIDDocumentModel>} DIDModel
 * @description
 * The Mongoose model for CRUD operations on the DID documents collection.
 */
export const DIDModel = model<DIDDocumentModel>('DID', DIDSchema);
