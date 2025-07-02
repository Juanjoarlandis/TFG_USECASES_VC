import { DIDModel, DIDDocument } from '../models/DIDModel';

/**
 * @class DIDRepository
 * @description
 * Repository for managing Decentralized Identifiers (DIDs) in MongoDB.
 * Provides methods to create, retrieve all, and retrieve by label.
 */
export class DIDRepository {
  /**
   * Creates and persists a new DID document in the database.
   *
   * @async
   * @function createDID
   * @param {DIDDocument} didData - The DID data to store.
   * @returns {Promise<DIDDocument>} The newly created DID document.
   *
   * @example
   * ```ts
   * const didRepo = new DIDRepository();
   * const newDid = await didRepo.createDID({
   *   issuerLabel: 'issuer1',
   *   issuerDid: 'did:web:example.com',
   *   issuerKey: { /* JWK or other key material *\/ },
   *   didDocument: { /* full DID Document *\/ }
   * });
   * console.log(newDid._id);
   * ```
   */
  async createDID(didData: DIDDocument): Promise<DIDDocument> {
    const did = new DIDModel(didData);
    return did.save();
  }

  /**
   * Retrieves all DID documents stored in the database.
   *
   * @async
   * @function getAllDIDs
   * @returns {Promise<DIDDocument[]>} Array of all DID documents.
   *
   * @example
   * ```ts
   * const dids = await didRepo.getAllDIDs();
   * console.log(dids.length);
   * ```
   */
  async getAllDIDs(): Promise<DIDDocument[]> {
    return DIDModel.find({});
  }

  /**
   * Finds a single DID document by its issuer label.
   *
   * @async
   * @function getDIDByLabel
   * @param {string} issuerLabel - The label of the issuer (e.g., 'issuer1').
   * @returns {Promise<DIDDocument|null>} The DID document if found, otherwise `null`.
   *
   * @example
   * ```ts
   * const did = await didRepo.getDIDByLabel('issuer2');
   * if (did) {
   *   console.log(did.issuerDid);
   * }
   * ```
   */
  async getDIDByLabel(issuerLabel: string): Promise<DIDDocument | null> {
    return DIDModel.findOne({ issuerLabel });
  }
}
