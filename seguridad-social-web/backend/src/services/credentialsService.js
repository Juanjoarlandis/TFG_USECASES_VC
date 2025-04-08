// src/services/credentialsService.js
const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const logger = require("../../logger");

/**
 * credentialsService.js
 * ---------------------
 * Encapsula la lógica de llamadas al wallet-api para gestionar credenciales
 * (listar, obtener, eliminar, aceptar, rechazar, etc.).
 */

async function listCredentials() {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Configurar petición
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const credsUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials`;

    // 3. Llamar al endpoint
    const response = await axios.get(credsUrl, config);
    logger.info("[credentialsService] Credentials listed successfully");
    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error listing credentials:",
      error.message,
    );
    throw error;
  }
}

async function getCredentialById(credentialId) {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Petición a la wallet
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error getting credential by ID:",
      error.message,
    );
    throw error;
  }
}

async function deleteCredential(credentialId) {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Petición DELETE
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
    await axios.delete(url, config);
    logger.info(
      `[credentialsService] Credential ${credentialId} deleted successfully`,
    );
  } catch (error) {
    logger.error(
      "[credentialsService] Error deleting credential:",
      error.message,
    );
    throw error;
  }
}

async function acceptCredential(credentialId) {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Petición POST -> /accept
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const acceptUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/accept`;
    const response = await axios.post(acceptUrl, {}, config);

    return response.data; // Devuelve la data para que el controlador la envíe al cliente
  } catch (error) {
    logger.error(
      "[credentialsService] Error accepting credential:",
      error.message,
    );
    throw error;
  }
}

async function rejectCredential(credentialId) {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Petición POST -> /reject
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}/reject`;
    const response = await axios.post(url, {}, config);

    return response.data;
  } catch (error) {
    logger.error(
      "[credentialsService] Error rejecting credential:",
      error.message,
    );
    throw error;
  }
}

async function getCredentialStatus(credentialId) {
  try {
    // 1. Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();

    // 2. Petición GET
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    };
    const url = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/credentials/${encodeURIComponent(credentialId)}`;
    const response = await axios.get(url, config);

    // Asumimos que la respuesta indica si está 'pending' o 'issued'
    return { status: response.data.pending ? "pending" : "issued" };
  } catch (error) {
    logger.error(
      "[credentialsService] Error getting credential status:",
      error.message,
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
