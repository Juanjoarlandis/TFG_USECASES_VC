import { Request, Response } from 'express';
import { bitstringService } from '../services/bitstringService';

/**
 * Controller for managing the compressed bitstring status list.
 * 
 * Provides endpoints to retrieve the status list credential, revoke an index,
 * and reactivate (unrevoke) an index.
 */
export class BitstringController {
  /**
   * GET /bitstring-status-list
   * 
   * Retrieves the BitstringStatusListCredential for a given issuer DID.
   * 
   * Query Parameters:
   * @param {string} issuerDid - (optional) DID of the issuer. Defaults to 'did:example:issuerCoord'.
   * 
   * Response:
   * @returns {200} JSON object representing the current status list VC.
   * 
   * Errors:
   * @returns {500} JSON error if retrieval fails.
   */
  public static getBitstringStatusList(req: Request, res: Response): Response {
    try {
      const issuerDid = (req.query.issuerDid as string) || 'did:example:issuerCoord';
      const statusListVC = bitstringService.getStatusListCredential(issuerDid);
      return res.status(200).json(statusListVC);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /bitstring-status-list/revoke
   * 
   * Marks the bit at the specified index as revoked (1).
   * 
   * Request Body:
   * @param {number} index - Index of the credential to revoke.
   * 
   * Response:
   * @returns {200} JSON message confirming revocation.
   * 
   * Errors:
   * @returns {400} JSON error if `index` is missing or invalid.
   * @returns {500} JSON error if the service call fails.
   */
  public static revokeIndex(req: Request, res: Response): Response {
    try {
      const { index } = req.body;
      if (index === undefined) {
        return res.status(400).json({ error: 'Missing index in body' });
      }
      bitstringService.setBit(Number(index), 1);
      return res.status(200).json({ message: `Index ${index} revoked (bit=1)` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /bitstring-status-list/activate
   * 
   * Marks the bit at the specified index as active (0), i.e., unrevoke.
   * 
   * Request Body:
   * @param {number} index - Index of the credential to reactivate.
   * 
   * Response:
   * @returns {200} JSON message confirming reactivation.
   * 
   * Errors:
   * @returns {400} JSON error if `index` is missing or invalid.
   * @returns {500} JSON error if the service call fails.
   */
  public static activateIndex(req: Request, res: Response): Response {
    try {
      const { index } = req.body;
      if (index === undefined) {
        return res.status(400).json({ error: 'Missing index in body' });
      }
      bitstringService.setBit(Number(index), 0);
      return res.status(200).json({ message: `Index ${index} activated (bit=0)` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
