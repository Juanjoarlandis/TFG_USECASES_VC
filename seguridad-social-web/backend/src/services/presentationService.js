/**
 * @module src/services/presentationService
 * @description Servicio que gestiona el flujo de presentación de credenciales en la Wallet API:
 *              - Resolución de una Presentation Request
 *              - Emparejamiento de credenciales con una definición de presentación
 *              - Uso (envío) de la solicitud de presentación seleccionada
 *              - Obtención o selección de un DID en la wallet
 *
 * @requires axios
 * @requires ./HolderSessionManager
 * @requires ./walletService~listDIDs
 */

const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const { listDIDs } = require("./walletService");

/**
 * Resuelve una Presentation Request enviando el payload al endpoint de la wallet.
 *
 * @async
 * @function resolvePresentationRequest
 * @param {string} presentationRequestUrl - URL o payload de la Presentation Request.
 * @throws {Error} Propaga errores de red o autenticación de la Wallet API.
 * @returns {Promise<string>} Cadena de texto JSON con la solicitud resuelta.
 */
async function resolvePresentationRequest(presentationRequestUrl) {
  const token = await HolderSessionManager.getToken();
  const walletId = HolderSessionManager.getWalletId();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/plain",
      "Content-Type": "text/plain",
    },
  };
  const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/resolvePresentationRequest`;
  const response = await axios.post(url, presentationRequestUrl, config);
  return response.data;
}

/**
 * Empareja credenciales disponibles en la wallet con una definición de presentación.
 *
 * @async
 * @function matchCredentialsForPresentation
 * @param {object} presentationDefinition - Objeto JSON que describe la definición de presentación (Presentation Definition).
 * @throws {Error} Propaga errores de red o autenticación de la Wallet API.
 * @returns {Promise<any[]>} Array de credenciales que cumplen los criterios de la definición.
 */
async function matchCredentialsForPresentation(presentationDefinition) {
  const token = await HolderSessionManager.getToken();
  const walletId = HolderSessionManager.getWalletId();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
  const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/matchCredentialsForPresentationDefinition`;
  const response = await axios.post(url, presentationDefinition, config);
  return response.data;
}

/**
 * Envía las credenciales seleccionadas para responder a una Presentation Request.
 *
 * @async
 * @function usePresentationRequest
 * @param {string} did - Identificador descentralizado del holder.
 * @param {object|string} presentationRequest - Payload de la Presentation Request resuelta.
 * @param {string[]} selectedCredentials - Array de IDs de credenciales seleccionadas para presentar.
 * @param {object} [disclosures] - Información adicional a revelar según la definición.
 * @throws {Error} Propaga errores de red o autenticación de la Wallet API.
 * @returns {Promise<any>} Respuesta JSON de la Wallet API tras enviar la presentación.
 */
async function usePresentationRequest(
  did,
  presentationRequest,
  selectedCredentials,
  disclosures,
) {
  const token = await HolderSessionManager.getToken();
  const walletId = HolderSessionManager.getWalletId();
  const payload = { did, presentationRequest, selectedCredentials };
  if (disclosures) payload.disclosures = disclosures;

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };
  const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/usePresentationRequest`;
  const response = await axios.post(url, payload, config);
  return response.data;
}

/**
 * Obtiene o selecciona un DID del holder en la wallet.  
 * Si hay varios, devuelve el primero.
 *
 * @async
 * @function getOrSelectDidSomewhere
 * @throws {Error} Si no hay token, walletId o no se encuentran DIDs.
 * @returns {Promise<string>} DID seleccionado.
 */
async function getOrSelectDidSomewhere() {
  // 1) Obtener token y walletId
  const token = await HolderSessionManager.getToken();
  const walletId = HolderSessionManager.getWalletId();

  if (!token || !walletId) {
    throw new Error(
      "[getOrSelectDidSomewhere] No se encontró token o walletId",
    );
  }

  // 2) Listar DIDs en la wallet
  const dids = await listDIDs(token, walletId);
  if (!dids || !dids.length) {
    throw new Error(
      "[getOrSelectDidSomewhere] No se encontraron DIDs en la wallet",
    );
  }

  // 3) Seleccionar el primero
  const did = dids[0].did;
  if (!did) {
    throw new Error("[getOrSelectDidSomewhere] DID inválido");
  }

  return did;
}

module.exports = {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
  getOrSelectDidSomewhere,
};
