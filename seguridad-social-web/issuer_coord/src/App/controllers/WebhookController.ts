// issuer_coord/src/App/controllers/WebhookController.ts

import { Request, Response } from 'express';
import { bitstringService } from '../services/bitstringService';

export class WebhookController {
  public static verifyCredential(req: Request, res: Response) {
    console.log('[Webhook] => Se recibió una petición:');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // 1) Extraer la credencial (vc)
    const { vc } = req.body;
    if (!vc) {
      console.warn('[Webhook] No se encontró "vc" en el body');
      // Podemos devolver 400 para indicar que no hay credencial
      return res.status(400).json({ error: 'No VC found in webhook request' });
    }

    // 2) Extraer credentialStatus y su statusListIndex
    if (!vc.credentialStatus || !vc.credentialStatus.statusListIndex) {
      console.log('[Webhook] La credencial no tiene credentialStatus o statusListIndex');
      // Podemos asumir que si no tiene statusListIndex, no está revocada
      return res.status(200).json({ message: 'OK (no credentialStatus => no revocation check)' });
    }

    const statusListIndexStr = vc.credentialStatus.statusListIndex;
    const index = parseInt(statusListIndexStr, 10);

    if (isNaN(index)) {
      console.warn('[Webhook] statusListIndex no es un número válido:', statusListIndexStr);
      // Respondemos 400 => fallo en policy
      return res.status(400).json({ error: 'Invalid statusListIndex' });
    }

    // 3) Comprobar si el bit en esa posición está revocado en el bitstring
    const revoked = bitstringService.isBitRevoked(index);

    if (revoked) {
      console.log(`[Webhook] Bitstring => El índice ${index} está en 1 => Revocado!`);
      // Devolvemos 400 => la policy "webhook" fallará
      return res.status(400).json({ error: 'Credential is revoked (bit=1)' });
    } else {
      console.log(`[Webhook] Bitstring => El índice ${index} está en 0 => Credencial activa!`);
      // Devolvemos 200 => la policy "webhook" pasa
      return res.status(200).json({ message: 'OK, credencial activa (bit=0)' });
    }
  }
}
