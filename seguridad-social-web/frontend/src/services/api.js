/**
 * @module src/services/api
 * @description
 * HTTP client wrapper for all backend interactions, including:
 * - Verificación de credenciales (1 y 3 flows)
 * - Emisión de credenciales
 * - Revocación de credenciales
 * - Login con Wallet
 *
 * Utiliza axios y basa su URL raíz en la variable de entorno REACT_APP_BACKEND_URL.
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Inicia el flujo de verificación de una credencial (DNI) mediante OID4VC.
 *
 * @async
 * @function startVerification
 * @returns {Promise<{verificationUrl: string, sessionId: string}>}
 *   - verificationUrl: URL donde el holder presenta la credencial.
 *   - sessionId: Identificador de la sesión para polling.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const startVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer`, {
    request_credentials: [
      { type: 'CustomIdentityCredential', format: 'jwt_vc_json' }
    ],
    vc_policies: [
      'signature',
      { policy: 'webhook', args: 'http://issuer_coord:5500/webhook-verify' }
    ]
  });
  return {
    verificationUrl: response.data.verificationUrl,
    sessionId: response.data.state
  };
};

/**
 * Consulta el estado de la sesión de verificación de una credencial.
 *
 * @async
 * @function checkSessionStatus
 * @param {string} stateId - Identificador de la sesión de verificación.
 * @returns {Promise<object>} Objeto con:
 *   - status: 'pending' | 'verified' | 'failed' | 'expired'
 *   - token (opcional): JWT de acceso tras verificación
 *   - user (opcional): Datos de usuario verificado
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const checkSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  return response.data;
};

/**
 * Obtiene los datos de un usuario mediante su DNI.
 *
 * @async
 * @function fetchUserDataByDni
 * @param {string} dni - DNI del usuario.
 * @returns {Promise<{user: object}>} Objeto con la propiedad `user`.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const fetchUserDataByDni = async (dni) => {
  const response = await axios.get(`${BASE_URL}/user/${dni}`);
  return response.data;
};

/**
 * Inicia el flujo de verificación de tres credenciales.
 *
 * @async
 * @function offerThreeCredsVerification
 * @returns {Promise<{verificationUrl: string, stateId: string}>}
 *   - verificationUrl: URL donde el holder presenta las tres credenciales.
 *   - stateId: Identificador de la sesión para polling.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const offerThreeCredsVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer3creds`);
  return {
    verificationUrl: response.data.verificationUrl,
    stateId: response.data.state
  };
};

/**
 * Consulta el estado de la sesión de verificación de tres credenciales.
 *
 * @async
 * @function checkThreeCredsVerificationStatus
 * @param {string} stateId - Identificador de la sesión de verificación.
 * @returns {Promise<object>} Objeto con:
 *   - status: 'pending' | 'verified' | 'failed' | 'expired'
 *   - otros campos según respuesta del backend
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const checkThreeCredsVerificationStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  return response.data;
};

/**
 * Solicita una oferta de emisión de la credencial de Alta.
 *
 * @async
 * @function offerIssuance
 * @param {string} stateId - Identificador de la sesión en backend.
 * @returns {Promise<import('axios').AxiosResponse>} Respuesta completa de Axios,
 *   que incluye data con `{ issuanceOfferUrl, state }`.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const offerIssuance = async (stateId) => {
  return axios.post(`${BASE_URL}/issuance/offerIssuance`, { stateId });
};

/**
 * Consulta el estado de la sesión de emisión de la credencial de Alta.
 *
 * @async
 * @function checkIssuanceSessionStatus
 * @param {string} stateId - Identificador de la sesión de emisión.
 * @returns {Promise<{issuanceStatus: string}>} Objeto con la propiedad `issuanceStatus`.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const checkIssuanceSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/issuance/session/${stateId}`);
  return response.data;
};

/**
 * Revoca la credencial de un usuario identificado por DNI.
 *
 * @async
 * @function revokeCredential
 * @param {string} dni - DNI del usuario cuya credencial se revoca.
 * @returns {Promise<object>} Objeto con `{ message, user }` según respuesta del backend.
 * @throws {Error} Si la llamada HTTP falla o devuelve status ≥ 500.
 */
export const revokeCredential = async (dni) => {
  const response = await axios.post(`${BASE_URL}/revocar/credencial`, { dni });
  return response.data;
};

/**
 * Instancia de Axios configurada para endpoints con cookie-based auth.
 *
 * `validateStatus` solo rechaza errores 500+ (errores de servidor).
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  validateStatus: (status) => status < 500
});

/**
 * Autentica al usuario contra Wallet usando email y password.
 *
 * @async
 * @function walletLogin
 * @param {string} email - Email del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<{status: number, ...any}>}
 *   - status: Código HTTP de la respuesta
 *   - Otros campos según respuesta del backend (tokens, mensajes, etc.)
 * @throws {Error} Si la llamada HTTP falla con status ≥ 500.
 */
export const walletLogin = async (email, password) => {
  const resp = await api.post('/auth/wallet-login', { email, password });
  return {
    status: resp.status,
    ...resp.data
  };
};
