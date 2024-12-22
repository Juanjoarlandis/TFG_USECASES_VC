// src/controllers/revocationController.js
const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');
const axios = require('axios');
const HolderSessionManager = require('../services/HolderSessionManager');

module.exports = {
    async revokeCredential(req, res, next) {
        try {
            const { dni } = req.body;
            console.log('[revokeCredential] Recibido en req.body:', req.body);

            // 1) Buscar al usuario
            const user = await User.findOne({ documentNumber: dni });
            console.log('[revokeCredential] Usuario encontrado =', user);

            if (!user) {
                console.warn('[revokeCredential] No se encontró usuario con DNI:', dni);
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // 2) Log de todos los campos de user relacionados con credencial
            console.log('[revokeCredential] user.hasAltaCredential:', user.hasAltaCredential);
            console.log('[revokeCredential] user.altaIssueDate:', user.altaIssueDate);
            console.log('[revokeCredential] user.altaCredentialData:', user.altaCredentialData);
            console.log('[revokeCredential] user.altaCredentialJti:', user.altaCredentialJti);

            // 3) Actualizar en BBDD (revocación interna)
            user.hasAltaCredential = false;
            user.altaIssueDate = null;

            // 4) Obtener el ID de la credencial en la wallet
            let walletCredentialId = null;
            if (user.altaCredentialData && user.altaCredentialData.id) {
                walletCredentialId = user.altaCredentialData.id;
            }

            console.log('[revokeCredential] Valor de walletCredentialId:', walletCredentialId);

            // Dejar la credencial en BBDD como null
            user.altaCredentialData = null;
            await user.save();
            console.log('[revokeCredential] user actualizado en BBDD:', user);

            // 5) Marcar como revocada en lista negra
            if (user.altaCredentialJti) {
                try {
                    console.log('[revokeCredential] Insertando credentialId en RevokedCredential:', user.altaCredentialJti);
                    await RevokedCredential.create({ credentialId: user.altaCredentialJti });
                } catch (err) {
                    if (err.code === 11000) {
                        console.warn('[revokeCredential] Ya existía esta credencial en la lista negra:', user.altaCredentialJti);
                    } else {
                        console.error('[revokeCredential] Error añadiendo a la lista negra:', err);
                    }
                }
            } else {
                console.warn('[revokeCredential] No se encontró altaCredentialJti en el usuario.');
            }

            // 6) Eliminar la credencial de la wallet
            if (walletCredentialId) {
                console.log('[revokeCredential] Voy a eliminar la credencial de la wallet:', walletCredentialId);

                try {
                    const token = await HolderSessionManager.getToken();
                    const walletId = HolderSessionManager.getWalletId();
                    const encodedId = walletCredentialId;

                    const deleteUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodedId}?permanent=true`;
                    const config = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: '*/*'
                        }
                    };

                    console.log('[revokeCredential] deleteUrl =', deleteUrl);
                    console.log('[revokeCredential] config =', config);

                    const resp = await axios.delete(deleteUrl, config);
                    console.log('[revokeCredential] DELETE status=', resp.status, ', data=', resp.data);
                } catch (err) {
                    console.error('[revokeCredential] Error eliminando la credencial permanentemente del wallet:', err.message);
                }
            } else {
                console.log('[revokeCredential] No existe walletCredentialId, no se envía DELETE a la wallet.');
            }

            return res.status(200).json({
                message: 'Credencial revocada y eliminada permanentemente del wallet con éxito',
                user
            });
        } catch (err) {
            console.error('[revokeCredential] Error general:', err);
            next(err);
        }
    }
};
