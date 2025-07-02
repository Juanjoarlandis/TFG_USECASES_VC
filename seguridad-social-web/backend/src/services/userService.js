/**
 * @module src/services/userService
 * @description Servicio que encapsula la lógica de gestión de usuarios:
 *              - Búsqueda en MongoDB de usuarios por DNI.
 *              - Construcción de la respuesta de usuario para el cliente.
 *              - Obtención de información del Holder desde la Wallet API.
 *
 * @requires axios
 * @requires ../models/User
 * @requires ./HolderSessionManager
 * @requires ../../logger
 */

const axios = require("axios");
const User = require("../models/User");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * Busca un usuario en MongoDB por su DNI.
 *
 * @async
 * @function findUserByDni
 * @param {string} dni - Número de documento (DNI) del usuario a buscar.
 * @returns {Promise<import('../models/User')|null>}
 *   Documento de usuario si se encuentra, o `null` si no existe.
 */
async function findUserByDni(dni) {
  return await User.findOne({ documentNumber: dni });
}

/**
 * Construye el objeto de respuesta de usuario para enviar al cliente,
 * ocultando campos sensibles y uniformando la salida.
 *
 * @function buildUserResponse
 * @param {import('../models/User')} user - Documento de usuario obtenido de MongoDB.
 * @returns {Object} Objeto con la información de usuario expuesta al cliente:
 *   - firstName, familyName, documentNumber, gender, nationality, birthDate, nss,
 *     photo, hasAltaCredential, altaIssueDate, altaCredentialData, flow.
 */
function buildUserResponse(user) {
  return {
    firstName: user.firstName,
    familyName: user.familyName,
    documentNumber: user.documentNumber,
    gender: user.gender,
    nationality: user.nationality,
    birthDate: user.birthDate,
    nss: user.nss,
    photo: user.photo,
    hasAltaCredential: user.hasAltaCredential,
    altaIssueDate: user.altaIssueDate,
    altaCredentialData: user.altaCredentialData || null,
    flow: user.flow,
  };
}

/**
 * Obtiene la información del Holder (usuario de la wallet) llamando
 * al endpoint `/wallet-api/auth/user-info` de la Wallet API.
 *
 * @async
 * @function getHolderUserInfo
 * @throws {Error} Propaga errores de red o autenticación.
 * @returns {Promise<Object>} Objeto con la información de usuario retornada por la Wallet API.
 */
async function getHolderUserInfo() {
  const token = await HolderSessionManager.getToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };

  const url = `${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`;
  const response = await axios.get(url, config);
  return response.data;
}

module.exports = {
  findUserByDni,
  buildUserResponse,
  getHolderUserInfo,
};
