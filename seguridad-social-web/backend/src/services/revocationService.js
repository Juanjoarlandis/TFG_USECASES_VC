// src/services/revocationService.js
const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');
const axios = require('axios');
const HolderSessionManager = require('./HolderSessionManager'); // Asumiendo uso del Singleton
const logger = require('../../logger');

/**
 * Lógica principal para revocar una credencial.
 * @param {string} dni - documento del usuario a revocar
 * @returns {object} - Devuelve un objeto con { message, user } 
 *                     o lanza errores en caso de problemas.
 */
async function revokeCredential(dni) {
    logger.debug(`[revocationService] revokeCredential start - dni=${dni}`);

    // 1) Buscar al usuario
    const user = await User.findOne({ documentNumber: dni });
    if (!user) {
        const err = new Error(`No se encontró usuario con DNI: ${dni}`);
        err.status = 404;
        throw err;
    }

    logger.debug('[revocationService] user.hasAltaCredential:', user.hasAltaCredential);
    logger.debug('[revocationService] user.altaIssueDate:', user.altaIssueDate);
    logger.debug('[revocationService] user.altaCredentialData:', user.altaCredentialData);
    logger.debug('[revocationService] user.altaCredentialJti:', user.altaCredentialJti);

    // 2) Marcar en BBDD como revocado
    user.hasAltaCredential = false;
    user.altaIssueDate = null;

    // 3) Obtenemos la credencial en la wallet
    let walletCredentialId = null;
    if (user.altaCredentialData && user.altaCredentialData.id) {
        walletCredentialId = user.altaCredentialData.id;
    }

    user.altaCredentialData = null;
    await user.save();

    // 4) Añadir a lista negra (RevokedCredential)
    if (user.altaCredentialJti) {
        try {
            await RevokedCredential.create({ credentialId: user.altaCredentialJti });
        } catch (err) {
            if (err.code === 11000) {
                logger.warn('[revocationService] Credencial ya existía en la lista negra:', user.altaCredentialJti);
            } else {
                logger.error('[revocationService] Error añadiendo a la lista negra:', err);
            }
        }
    } else {
        logger.warn('[revocationService] No se encontró altaCredentialJti en el usuario.');
    }

    // 5) Eliminar credencial de la wallet (opcional si `walletCredentialId` existe)
    if (walletCredentialId) {
        logger.debug('[revocationService] Eliminando credencial de la wallet:', walletCredentialId);
        try {
            const token = await HolderSessionManager.getToken();
            const walletId = HolderSessionManager.getWalletId();
            const deleteUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${walletCredentialId}?permanent=true`;

            await axios.delete(deleteUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: '*/*'
                }
            });
            logger.debug('[revocationService] Credencial eliminada permanentemente de la wallet');
        } catch (err) {
            logger.error('[revocationService] Error eliminando la credencial de la wallet:', err.message);
            // Se podría decidir si lanzar error o no. 
            // Por ahora solo se registra, sin abortar.
        }
    } else {
        logger.debug('[revocationService] No existe walletCredentialId, no se envía DELETE a la wallet.');
    }

    return {
        message: 'Credencial revocada y eliminada permanentemente del wallet con éxito',
        user
    };
}

module.exports = {
    revokeCredential
};
