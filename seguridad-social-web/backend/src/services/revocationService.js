/**
 * @module src/services/revocationService
 * @description Servicio que gestiona la revocación de credenciales de alta en la Seguridad Social:
 *              - Marca al usuario como no dado de alta.
 *              - Añade el JTI de la credencial a una lista negra (MongoDB).
 *              - Elimina permanentemente la credencial de la wallet del Holder.
 *              - Devuelve un objeto con mensaje de éxito y el usuario actualizado.
 *
 * @requires ../models/User
 * @requires ../models/RevokedCredential
 * @requires axios
 * @requires ./HolderSessionManager
 * @requires ../../logger
 */

const User = require("../models/User");
const RevokedCredential = require("../models/RevokedCredential");
const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * Revoca la credencial de alta para el usuario identificado por DNI.
 *
 * @async
 * @function revokeCredential
 * @param {string} dni - Número de documento del usuario cuya credencial se revoca.
 * @throws {Error} Si no se encuentra el usuario (status 404).
 * @returns {Promise<{message: string, user: import('../models/User')}>}
 *   - message: Mensaje indicando que la revocación y eliminación fueron exitosas.
 *   - user:    Documento de usuario tras actualizar su estado.
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

  logger.debug(
    "[revocationService] user.hasAltaCredential:",
    user.hasAltaCredential
  );
  logger.debug("[revocationService] user.altaIssueDate:", user.altaIssueDate);
  logger.debug(
    "[revocationService] user.altaCredentialData:",
    user.altaCredentialData
  );
  logger.debug(
    "[revocationService] user.altaCredentialJti:",
    user.altaCredentialJti
  );

  // 2) Marcar en BBDD como no dado de alta
  user.hasAltaCredential = false;
  user.altaIssueDate = null;

  // 3) Extraer el ID de la credencial en la wallet
  let walletCredentialId = null;
  if (user.altaCredentialData?.id) {
    walletCredentialId = user.altaCredentialData.id;
  }
  user.altaCredentialData = null;
  await user.save();

  // 4) Añadir a lista negra de JTI
  if (user.altaCredentialJti) {
    try {
      await RevokedCredential.create({ credentialId: user.altaCredentialJti });
    } catch (err) {
      if (err.code === 11000) {
        logger.warn(
          "[revocationService] Credencial ya existía en la lista negra:",
          user.altaCredentialJti
        );
      } else {
        logger.error(
          "[revocationService] Error añadiendo a la lista negra:",
          err
        );
      }
    }
  } else {
    logger.warn(
      "[revocationService] No se encontró altaCredentialJti en el usuario."
    );
  }

  // 5) Eliminar credencial de la wallet si existe
  if (walletCredentialId) {
    logger.debug(
      "[revocationService] Eliminando credencial de la wallet:",
      walletCredentialId
    );
    try {
      const token = await HolderSessionManager.getToken();
      const walletId = HolderSessionManager.getWalletId();
      const deleteUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
        walletCredentialId
      )}?permanent=true`;

      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
      });
      logger.debug(
        "[revocationService] Credencial eliminada permanentemente de la wallet"
      );
    } catch (err) {
      logger.error(
        "[revocationService] Error eliminando la credencial de la wallet:",
        err.message
      );
      // No abortamos el proceso de revocación por fallo en la wallet
    }
  } else {
    logger.debug(
      "[revocationService] No existe walletCredentialId, no se envía DELETE a la wallet."
    );
  }

  return {
    message:
      "Credencial revocada y eliminada permanentemente del wallet con éxito",
    user,
  };
}

module.exports = {
  revokeCredential,
};
