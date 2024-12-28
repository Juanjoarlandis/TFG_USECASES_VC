// issuer_coord/src/App/services/bitstringService.ts
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const BITSTRING_SIZE = 131072; // 131072 bits => 16KB
const BITSTRING_FILE = path.join(__dirname, '..', '..', 'data', 'bitstring.bin');

/**
 * Este servicio maneja:
 * 1) Cargar/crear el fichero bitstring.bin (16KB).
 * 2) setBit, isBitRevoked, getFreeIndex, etc.
 * 3) Generar un Bitstring Status List Credential comprimido (encodedList).
 */
class BitstringService {
  private bitArray: Buffer;

  constructor() {
    // 1) Cargar o crear el fichero bitstring.bin
    this.bitArray = this.loadBitstringFile();
  }

  /**
   * Lee el fichero bitstring.bin si existe.
   * Si no existe, crea un buffer de 16KB llenos de 0 y lo escribe.
   */
  private loadBitstringFile(): Buffer {
    if (!fs.existsSync(BITSTRING_FILE)) {
      // No existe => creamos un buffer de 16KB con ceros
      const newArray = Buffer.alloc(BITSTRING_SIZE / 8, 0);
      fs.writeFileSync(BITSTRING_FILE, newArray);
      return newArray;
    } else {
      // Existe => lo cargamos
      return fs.readFileSync(BITSTRING_FILE);
    }
  }

  /**
   * Guarda la bitArray actualizada en el fichero binario.
   */
  private saveBitstringFile() {
    fs.writeFileSync(BITSTRING_FILE, this.bitArray);
  }

  /**
   * Obtiene un índice "libre" de forma aleatoria.
   * En una implementación real, podrías llevar un contador global
   * o un registro de cuáles bits están ocupados.
   */
  public getFreeIndex(): number {
    return Math.floor(Math.random() * BITSTRING_SIZE);
  }

  /**
   * Marca el bit `index` como `value` (0=activo, 1=revocado).
   * Luego reescribe el fichero para persistir el cambio.
   */
  public setBit(index: number, value: 0 | 1) {
    const byteIndex = Math.floor(index / 8);
    const bitPosition = index % 8;
    if (value === 1) {
      this.bitArray[byteIndex] |= (1 << bitPosition);
    } else {
      this.bitArray[byteIndex] &= ~(1 << bitPosition);
    }
    // Guardar en disco
    this.saveBitstringFile();
  }

  /**
   * Chequea si un bit está en 1 (revocado).
   */
  public isBitRevoked(index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitPosition = index % 8;
    return (this.bitArray[byteIndex] & (1 << bitPosition)) !== 0;
  }

  /**
   * Devuelve el "Bitstring Status List Credential" comprimido,
   * recibiendo un issuerDid para completar el campo "issuer".
   */
  public getStatusListCredential(issuerDid: string): any {
    // Comprimimos la bitArray con GZIP
    const compressed = zlib.gzipSync(this.bitArray);
    // Luego base64 (o base64url)
    const encodedList = compressed.toString('base64');

    return {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      "id": "https://issuer-coord.com/bitstring-status-list",
      "type": ["VerifiableCredential", "BitstringStatusListCredential"],
      "issuer": issuerDid, // DID dinámico
      "credentialSubject": {
        "id": "https://issuer-coord.com/bitstring-status-list#list",
        "type": "BitstringStatusList",
        "statusPurpose": "revocation",
        "encodedList": encodedList
      }
    };
  }
}

export const bitstringService = new BitstringService();
