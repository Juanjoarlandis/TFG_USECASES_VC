/**
 * @module src/services/credentialsService
 * @description Servicio que encapsula la lógica de interacción con la Wallet API
 *              para gestionar credenciales: listado, obtención por ID, eliminación,
 *              aceptación, rechazo y consulta de estado.
 *
 * @requires axios
 * @requires ./HolderSessionManager
 * @requires ../../logger
 */

const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * Lista todas las credenciales disponibles en la wallet del Holder.
 *
 * @async
 * @function listCredentials
 * @returns {Promise<any[]>} Array de objetos de credenciales tal como los devuelve la Wallet API.
 * @throws {Error} Propaga cualquier error de red o autenticación.
 */
async function listCredentials() {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const credsUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials`;
    const response = await axios.get(credsUrl, config);
    logger.info("[credentialsService] Credentials listed successfully");
    return response.data;
  } catch (error) {
    logger.error("[credentialsService] Error listing credentials:", error.message);
    throw error;
  }
}

/**
 * Obtiene una credencial concreta por su identificador.
 *
 * @async
 * @function getCredentialById
 * @param {string} credentialId - Identificador de la credencial a recuperar.
 * @returns {Promise<any>} Objeto de la credencial según la respuesta de la Wallet API.
 * @throws {Error} Propaga cualquier error de red, autenticación o parámetro incorrecto.
 */
async function getCredentialById(credentialId) {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
      credentialId
    )}`;
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error getting credential by ID:",
      error.message
    );
    throw error;
  }
}

/**
 * Elimina una credencial de la wallet.
 *
 * @async
 * @function deleteCredential
 * @param {string} credentialId - Identificador de la credencial a eliminar.
 * @returns {Promise<void>} Se resuelve cuando la eliminación ha sido exitosa.
 * @throws {Error} Propaga cualquier error de red, autenticación o parámetro incorrecto.
 */
async function deleteCredential(credentialId) {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
      credentialId
    )}`;
    await axios.delete(url, config);
    logger.info(
      `[credentialsService] Credential ${credentialId} deleted successfully`
    );
  } catch (error) {
    logger.error(
      "[credentialsService] Error deleting credential:",
      error.message
    );
    throw error;
  }
}

/**
 * Acepta (aprueba) una credencial pendiente en la wallet.
 *
 * @async
 * @function acceptCredential
 * @param {string} credentialId - Identificador de la credencial a aceptar.
 * @returns {Promise<any>} Datos devueltos por la Wallet API tras aceptar la credencial.
 * @throws {Error} Propaga cualquier error de red, autenticación o parámetro incorrecto.
 */
async function acceptCredential(credentialId) {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const acceptUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
      credentialId
    )}/accept`;
    const response = await axios.post(acceptUrl, {}, config);
    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error accepting credential:",
      error.message
    );
    throw error;
  }
}

/**
 * Rechaza (niega) una credencial pendiente en la wallet.
 *
 * @async
 * @function rejectCredential
 * @param {string} credentialId - Identificador de la credencial a rechazar.
 * @returns {Promise<any>} Datos devueltos por la Wallet API tras rechazar la credencial.
 * @throws {Error} Propaga cualquier error de red, autenticación o parámetro incorrecto.
 */
async function rejectCredential(credentialId) {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
      credentialId
    )}/reject`;
    const response = await axios.post(url, {}, config);
    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error rejecting credential:",
      error.message
    );
    throw error;
  }
}

/**
 * Consulta el estado de una credencial (pendiente o emitida).
 *
 * @async
 * @function getCredentialStatus
 * @param {string} credentialId - Identificador de la credencial a consultar.
 * @returns {Promise<{status: "pending"|"issued"}>} Objeto con la propiedad `status`.
 * @throws {Error} Propaga cualquier error de red, autenticación o parámetro incorrecto.
 */
async function getCredentialStatus(credentialId) {
  try {
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(
      credentialId
    )}`;
    const response = await axios.get(url, config);
    return { status: response.data.pending ? "pending" : "issued" };
  } catch (error) {
    logger.error(
      "[credentialsService] Error getting credential status:",
      error.message
    );
    throw error;
  }
}

module.exports = {
  listCredentials,
  getCredentialById,
  deleteCredential,
  acceptCredential,
  rejectCredential,
  getCredentialStatus,
};
