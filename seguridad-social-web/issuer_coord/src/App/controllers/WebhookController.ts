import { Request, Response } from 'express';
import { bitstringService } from '../services/bitstringService';

/**
 * Controller for processing incoming webhook callbacks related to credential revocation.
 *
 * Handles the "webhook" policy for OpenID4VC flows by inspecting
 * the provided Verifiable Credential (VC) for a statusListIndex and
 * checking the corresponding bit in the bitstring revocation list.
 */
export class WebhookController {
  /**
   * POST /webhook/verify-credential
   *
   * Verifies whether a credential (provided in the webhook request body)
   * is revoked or active by checking its statusListIndex against the
   * bitstring revocation list.
   *
   * @param {Request} req  
   *   - Headers: arbitrary webhook headers  
   *   - Body: JSON object containing `{ vc }`, where `vc` is the Verifiable Credential  
   *
   *   The VC must include:
   *   - `vc.credentialStatus.statusListIndex`: string or number index into the bitstring
   *
   * @param {Response} res  
   *   Express response object used to return:
   *   - `200 OK` with `{ message: 'OK...' }` if credential is active or has no statusListIndex  
   *   - `400 Bad Request` with `{ error: '...' }` if input is malformed or credential is revoked  
   */
  public static verifyCredential(req: Request, res: Response): Response {
    console.log('[Webhook] => Se recibió una petición:');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // 1) Extraer la credencial (vc)
    const { vc } = req.body;
    if (!vc) {
      console.warn('[Webhook] No se encontró "vc" en el body');
      return res.status(400).json({ error: 'No VC found in webhook request' });
    }

    // 2) Extraer statusListIndex
    const statusListIndexStr = vc.credentialStatus?.statusListIndex;
    if (statusListIndexStr === undefined) {
      console.log('[Webhook] No credentialStatus.statusListIndex → se asume activa');
      return res.status(200).json({
        message: 'OK (no credentialStatus => no revocation check)'
      });
    }

    const index = parseInt(String(statusListIndexStr), 10);
    if (isNaN(index)) {
      console.warn('[Webhook] statusListIndex no es un número válido:', statusListIndexStr);
      return res.status(400).json({ error: 'Invalid statusListIndex' });
    }

    // 3) Comprobar revocación
    const revoked = bitstringService.isBitRevoked(index);
    if (revoked) {
      console.log(`[Webhook] Índice ${index} está en 1 → Revocado`);
      return res.status(400).json({ error: 'Credential is revoked (bit=1)' });
    } else {
      console.log(`[Webhook] Índice ${index} está en 0 → Activa`);
      return res.status(200).json({ message: 'OK, credential active (bit=0)' });
    }
  }
}
