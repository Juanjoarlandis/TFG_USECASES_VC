// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Funciones existentes...
export const startVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer`, {
    request_credentials: [
      {
        type: "CustomIdentityCredential",
        format: "jwt_vc_json"
      }
    ],
    vc_policies: [
      "signature",
      {
        policy: "webhook",
        args: "http://issuer_coord:5500/webhook-verify"
      }
    ]
  });
  return { verificationUrl: response.data.verificationUrl, sessionId: response.data.state };
};

export const checkSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  return response.data; // {status, token?, user?}
};

export const fetchUserDataByDni = async (dni) => {
  const response = await axios.get(`${BASE_URL}/user/${dni}`);
  return response.data; // {user: {...}}
};

export const offerThreeCredsVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer3creds`, {});
  return { verificationUrl: response.data.verificationUrl, stateId: response.data.state };
};

export const checkThreeCredsVerificationStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  return response.data; // {status, ...}
};

export const offerIssuance = async (stateId) => {
  const response = await axios.post(`${BASE_URL}/issuance/offerIssuance`, { stateId });
  return { issuanceOfferUrl: response.data.issuanceOfferUrl };
};

export const checkIssuanceSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/issuance/session/${stateId}`);
  return response.data; // {issuanceStatus}
};

export const revokeCredential = async (dni) => {
  const response = await axios.post(`${BASE_URL}/revocar/credencial`, { dni });
  return response.data;
};

// Nueva función para login con wallet
export const walletLogin = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/auth/wallet-login`, { email, password });
  // El backend debería devolver { message, accessToken, refreshToken, user? }
  return response.data;
};
