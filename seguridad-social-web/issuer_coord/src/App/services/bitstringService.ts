import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const BITSTRING_SIZE = 131072; // 131072 bits => 16KB
const BITSTRING_FILE = path.join(__dirname, '..', '..', 'data', 'bitstring.bin');

/**
 * @class BitstringService
 * @description
 * Manages a fixed-size bitstring for credential revocation status:
 *  1) Loads or initializes a 16KB binary file (bitstring.bin)
 *  2) Allows setting and checking individual bits (0=active, 1=revoked)
 *  3) Generates a compressed Bitstring Status List Credential for OpenID4VC
 */
class BitstringService {
  /** @private @type {Buffer} In-memory buffer of the bitstring file */
  private bitArray: Buffer;

  /**
   * Constructs the service and loads or creates the bitstring file.
   */
  constructor() {
    this.bitArray = this.loadBitstringFile();
  }

  /**
   * Reads the bitstring file from disk, or initializes a zeroed buffer if missing.
   *
   * @private
   * @function loadBitstringFile
   * @returns {Buffer} Buffer of length BITSTRING_SIZE/8 representing the bitstring.
   */
  private loadBitstringFile(): Buffer {
    if (!fs.existsSync(BITSTRING_FILE)) {
      // Create a new zeroed buffer of 16KB
      const newArray = Buffer.alloc(BITSTRING_SIZE / 8, 0);
      fs.writeFileSync(BITSTRING_FILE, newArray);
      return newArray;
    } else {
      // Load existing file
      return fs.readFileSync(BITSTRING_FILE);
    }
  }

  /**
   * Persists the current in-memory bitArray back to the binary file.
   *
   * @private
   * @function saveBitstringFile
   * @returns {void}
   */
  private saveBitstringFile(): void {
    fs.writeFileSync(BITSTRING_FILE, this.bitArray);
  }

  /**
   * Returns a random free index within the bitstring.
   * In production, this could be replaced with a deterministic allocator.
   *
   * @public
   * @function getFreeIndex
   * @returns {number} An integer in [0, BITSTRING_SIZE).
   */
  public getFreeIndex(): number {
    return Math.floor(Math.random() * BITSTRING_SIZE);
  }

  /**
   * Sets the bit at the specified index to the given value (0 or 1),
   * then saves the updated bitArray to disk.
   *
   * @public
   * @function setBit
   * @param {number} index - Bit index to modify (0-based).
   * @param {0|1} value   - New bit value: 0 = active, 1 = revoked.
   * @returns {void}
   */
  public setBit(index: number, value: 0 | 1): void {
    const byteIndex = Math.floor(index / 8);
    const bitPosition = index % 8;
    if (value === 1) {
      this.bitArray[byteIndex] |= (1 << bitPosition);
    } else {
      this.bitArray[byteIndex] &= ~(1 << bitPosition);
    }
    this.saveBitstringFile();
  }

  /**
   * Checks whether the bit at the given index is set to 1 (revoked).
   *
   * @public
   * @function isBitRevoked
   * @param {number} index - Bit index to check.
   * @returns {boolean} True if revoked (bit=1), false if active (bit=0).
   */
  public isBitRevoked(index: number): boolean {
    const byteIndex = Math.floor(index / 8);
    const bitPosition = index % 8;
    return (this.bitArray[byteIndex] & (1 << bitPosition)) !== 0;
  }

  /**
   * Generates a Bitstring Status List Credential suitable for OpenID4VC.
   * Compresses the bitArray with GZIP and encodes it to base64.
   *
   * @public
   * @function getStatusListCredential
   * @param {string} issuerDid - DID of the issuer to include in the VC.
   * @returns {object} A Verifiable Credential object with the compressed bitstring.
   */
  public getStatusListCredential(issuerDid: string): any {
    const compressed = zlib.gzipSync(this.bitArray);
    const encodedList = compressed.toString('base64');

    return {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      "id": "https://issuer-coord.com/bitstring-status-list",
      "type": ["VerifiableCredential", "BitstringStatusListCredential"],
      "issuer": issuerDid,
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
