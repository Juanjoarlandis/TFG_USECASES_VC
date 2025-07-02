/**
 * @module src/services/walletService
 * @description Servicio que encapsula la lógica de interacción con la Wallet API para:
 *              - Obtener información del usuario holder
 *              - Listar DIDs asociados a una wallet
 *              - Listar credenciales en una wallet
 *
 * @requires axios
 * @requires ../../logger
 */

const axios = require("axios");
const logger = require("../../logger");

/**
 * Obtiene la información del usuario Holder desde la Wallet API.
 *
 * @async
 * @function getUserInfo
 * @param {string} token - Token JWT de acceso para la Wallet API.
 * @throws {Error} Propaga errores de red o de autenticación de la Wallet API.
 * @returns {Promise<Object>} Objeto con la información del usuario Holder, tal como lo devuelve la API.
 */
async function getUserInfo(token) {
  logger.debug("walletService.getUserInfo - solicitando info del holder");
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
  const response = await axios.get(
    `${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`,
    config
  );
  logger.debug("walletService.getUserInfo - info recibida");
  return response.data;
}

/**
 * Lista los DIDs asociados a una wallet específica.
 *
 * @async
 * @function listDIDs
 * @param {string} token    - Token JWT de acceso para la Wallet API.
 * @param {string} walletId - Identificador de la wallet cuyos DIDs se desean listar.
 * @throws {Error} Propaga errores de red o de autenticación de la Wallet API.
 * @returns {Promise<Array<Object>>} Array de objetos DID tal como lo devuelve la API.
 */
async function listDIDs(token, walletId) {
  logger.debug(`walletService.listDIDs - Listando DIDs del wallet: ${walletId}`);
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
  const response = await axios.get(
    `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/dids`,
    config
  );
  logger.debug("walletService.listDIDs - DIDs recibidos:", response.data);
  return response.data;
}

/**
 * Lista las credenciales almacenadas en una wallet, ordenadas por fecha de adición.
 *
 * @async
 * @function listCredentials
 * @param {string} token    - Token JWT de acceso para la Wallet API.
 * @param {string} walletId - Identificador de la wallet cuyas credenciales se desean listar.
 * @throws {Error} Propaga errores de red o de autenticación de la Wallet API.
 * @returns {Promise<Array<Object>>} Array de objetos de credenciales tal como lo devuelve la API.
 */
async function listCredentials(token, walletId) {
  logger.debug(
    `walletService.listCredentials - Listando credenciales del wallet: ${walletId}`
  );
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };
  const response = await axios.get(
    `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials?sortBy=addedOn`,
    config
  );
  logger.debug(
    "walletService.listCredentials - credenciales recibidas:",
    response.data.map((c) => c.id)
  );
  return response.data;
}

module.exports = {
  getUserInfo,
  listDIDs,
  listCredentials,
};
