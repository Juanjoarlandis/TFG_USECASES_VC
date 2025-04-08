const axios = require("axios");
const HolderSessionManager = require("./HolderSessionManager");
const { listDIDs } = require("./walletService");

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

async function getOrSelectDidSomewhere() {
  // 1) obtener token de la wallet
  const token = await HolderSessionManager.getToken();
  // 2) obtener walletId
  const walletId = HolderSessionManager.getWalletId();

  if (!token || !walletId) {
    throw new Error(
      "[getOrSelectDidSomewhere] No se encontró token o walletId",
    );
  }

  // 3) listar DIDs en la wallet
  const dids = await listDIDs(token, walletId);
  if (!dids || !dids.length) {
    throw new Error(
      "[getOrSelectDidSomewhere] No se encontraron DIDs en la wallet",
    );
  }

  // 4) seleccionar el primero (o el que quieras)
  const did = dids[0].did;
  if (!did) {
    throw new Error("[getOrSelectDidSomewhere] DID inválido");
  }

  return did;
}

module.exports = {
  getOrSelectDidSomewhere,
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
};
