import { Schema, model, Document } from 'mongoose';

export interface DIDDocument {
  issuerLabel: string;
  issuerDid: string;
  issuerKey: any;
  didDocument: any;
}

export interface DIDDocumentModel extends DIDDocument, Document {}

const DIDSchema = new Schema<DIDDocumentModel>({
  issuerLabel: { type: String, required: true, unique: true },
  issuerDid: { type: String, required: true },
  issuerKey: { type: Object, required: true },
  didDocument: { type: Object, required: true }
});

export const DIDModel = model<DIDDocumentModel>('DID', DIDSchema);
