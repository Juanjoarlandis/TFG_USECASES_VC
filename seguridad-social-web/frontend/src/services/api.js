// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

/* ────────────────────────────────────────────────────────────────
   Verificación de 1 credencial (DNI)
   ──────────────────────────────────────────────────────────────── */
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

  // El backend responde { verificationUrl, state }
  return {
    verificationUrl: response.data.verificationUrl,
    sessionId: response.data.state
  };
};

export const checkSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  // { status, token?, user? }
  return response.data;
};

/* ────────────────────────────────────────────────────────────────
   Datos de usuario
   ──────────────────────────────────────────────────────────────── */
export const fetchUserDataByDni = async (dni) => {
  const response = await axios.get(`${BASE_URL}/user/${dni}`);
  // { user: { ... } }
  return response.data;
};

/* ────────────────────────────────────────────────────────────────
   Verificación de 3 credenciales
   ──────────────────────────────────────────────────────────────── */
export const offerThreeCredsVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer3creds`);
  // { verificationUrl, state }
  return {
    verificationUrl: response.data.verificationUrl,
    stateId: response.data.state
  };
};

export const checkThreeCredsVerificationStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  // { status, ... }
  return response.data;
};

/* ────────────────────────────────────────────────────────────────
   Emisión de la credencial de Alta
   ──────────────────────────────────────────────────────────────── */
export const offerIssuance = async (stateId) => {
  // Devolvemos el *response* completo ⇒ Alta.js usará result.data
  return axios.post(`${BASE_URL}/issuance/offerIssuance`, { stateId });
};

export const checkIssuanceSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/issuance/session/${stateId}`);
  // { issuanceStatus }
  return response.data;
};

/* ────────────────────────────────────────────────────────────────
   Revocación de credenciales
   ──────────────────────────────────────────────────────────────── */
export const revokeCredential = async (dni) => {
  const response = await axios.post(`${BASE_URL}/revocar/credencial`, { dni });
  return response.data;
};

/* ────────────────────────────────────────────────────────────────
   Login con Wallet
   ──────────────────────────────────────────────────────────────── */
// Creamos una instancia por si luego quieres meter interceptores globales…
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  // Sólo lanzar excepción para status ≥ 500
  validateStatus: (status) => status < 500
});

export const walletLogin = async (email, password) => {
  const resp = await api.post('/auth/wallet-login', { email, password });
  // devolvemos el código HTTP + el body para que el caller lo maneje
  return {
    status: resp.status,
    ...resp.data
  };
};
