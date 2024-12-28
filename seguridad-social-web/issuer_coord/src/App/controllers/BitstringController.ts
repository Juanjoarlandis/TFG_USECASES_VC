// issuer_coord/src/App/controllers/BitstringController.ts
import { Request, Response } from 'express';
import { bitstringService } from '../services/bitstringService';

export class BitstringController {
  /**
   * GET /bitstring-status-list?issuerDid=...
   * Devuelve un objeto "BitstringStatusListCredential" con la lista comprimida.
   */
  public static getBitstringStatusList(req: Request, res: Response) {
    try {
      // Podrías pasar el DID en query param, e.g. ?issuerDid=did:example:issuer1
      const issuerDid = req.query.issuerDid as string || 'did:example:issuerCoord';
      const statusListVC = bitstringService.getStatusListCredential(issuerDid);
      return res.status(200).json(statusListVC);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /bitstring-status-list/revoke
   * Body => { "index": 12345 }
   * Marca el bit en 1 => revocado
   */
  public static revokeIndex(req: Request, res: Response) {
    try {
      const { index } = req.body;
      if (index === undefined) {
        return res.status(400).json({ error: 'Missing index in body' });
      }
      bitstringService.setBit(Number(index), 1);
      return res.json({ message: `Index ${index} revocado (bit=1)` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
    /**
   * POST /bitstring-status-list/activate
   * Body => { "index": 12345 }
   * Marca el bit en 0 => reactivar (desrevocar)
   */
    public static activateIndex(req: Request, res: Response) {
        try {
          const { index } = req.body;
          if (index === undefined) {
            return res.status(400).json({ error: 'Missing index in body' });
          }
          bitstringService.setBit(Number(index), 0); // bit=0 => activo/no revocado
          return res.json({ message: `Index ${index} reactivado (bit=0)` });
        } catch (error: any) {
          return res.status(500).json({ error: error.message });
        }
      }
    }



