/**
 * @module src/services/offerService
 * @description Servicio que gestiona el intercambio de una oferta de credencial
 *              en la wallet del Holder, llamando al endpoint `useOfferRequest`.
 *
 * @requires axios
 * @requires ./HolderSessionManager
 * @requires ../../logger
 */

const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * Envía una oferta de credencial (`offerUrl`) a la Wallet API para
 * intercambiarla por la credencial correspondiente en la wallet del Holder.
 *
 * @async
 * @function useCredentialOffer
 * @param {string} offerUrl - URL o payload de la oferta de credencial recibida.
 * @param {string} did      - Identificador descentralizado (DID) del Holder.
 * @throws {Error}          - Lanzado con `status = 400` si falta `offerUrl` o `did`.
 * @throws {Error}          - Propaga errores de red o autenticación de la Wallet API.
 *
 * @returns {Promise<Object>}  - Respuesta JSON de la Wallet API tras usar la oferta.
 */
async function useCredentialOffer(offerUrl, did) {
  logger.debug("[offerService] useCredentialOffer - start");

  // Validar parámetros obligatorios
  if (!offerUrl || !did) {
    const err = new Error("Missing offerUrl or did");
    err.status = 400;
    throw err;
  }

  // 1) Obtener token JWT y walletId del Holder
  const token = await HolderSessionManager.getToken();
  const walletId = HolderSessionManager.getWalletId();

  // 2) Construir URL y cabeceras para la solicitud
  const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(
    did
  )}`;
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
  };

  logger.debug(`[offerService] Calling useOfferRequest URL: ${url}`);

  // 3) Enviar la oferta a la Wallet API
  const response = await axios.post(url, offerUrl, config);

  // 4) Devolver el cuerpo de la respuesta al controlador
  return response.data;
}

module.exports = {
  useCredentialOffer,
};
