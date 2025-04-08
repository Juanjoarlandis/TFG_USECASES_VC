// src/services/userService.js
const axios = require("axios");
const User = require("../models/User");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * userService.js
 * --------------
 * Encapsula la lógica de obtención y manejo de usuarios locales (MongoDB)
 * y la lógica de obtención de información del holder en la wallet.
 */

/**
 * findUserByDni:
 * Busca en la base de datos MongoDB el usuario que tenga el documentNumber = dni
 */
async function findUserByDni(dni) {
  const user = await User.findOne({ documentNumber: dni });
  return user; // Podría ser null si no existe
}

/**
 * buildUserResponse:
 * Construye el objeto "userResponse" que vas a devolver al cliente.
 * Evita exponer más datos de los necesarios y uniforma el formato de salida.
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
 * getHolderUserInfo:
 * Llama a la wallet (wallet-api) para obtener info del holder (user-info).
 */
async function getHolderUserInfo() {
  // 1. Obtener token y armar config
  const token = await HolderSessionManager.getToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  };

  // 2. Llamada a la wallet
  const response = await axios.get(
    `${process.env.WALLET_COORD_URL}/wallet-api/auth/user-info`,
    config,
  );
  // response.data tendrá la info devuelta por la wallet
  return response.data;
}

module.exports = {
  findUserByDni,
  buildUserResponse,
  getHolderUserInfo,
};
