import { DIDModel, DIDDocument } from '../models/DIDModel';

/**
 * Repositorio para acceder y modificar DIDs en MongoDB.
 * Proporciona métodos para crear y obtener DIDs.
 */
export class DIDRepository {

/**
 * Crea y almacena un nuevo DID en la base de datos.
 * @param didData Datos del DID a almacenar.
 * @returns El documento DID creado.
 */
  async createDID(didData: DIDDocument): Promise<DIDDocument> {
    const did = new DIDModel(didData);
    return did.save();
  }

/**
 * Obtiene todos los DIDs almacenados en la base de datos.
 * @returns Array de documentos DID.
 */
  async getAllDIDs(): Promise<DIDDocument[]> {
    return DIDModel.find({});
  }

/**
 * Obtiene un DID específico buscando por su issuerLabel.
 * @param issuerLabel Etiqueta del issuer (ej: 'issuer1').
 * @returns Documento DID o null si no existe.
 */
  async getDIDByLabel(issuerLabel: string): Promise<DIDDocument | null> {
    return DIDModel.findOne({ issuerLabel });
  }
}
