// src/services/api.js
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Funciones ya existentes
export const startVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer`, {
    request_credentials: [
      {
        format: "jwt_vc_json",
        type: "CustomIdentityCredential"
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
  return response.data; // Debe devolver {user: {...}}
};

// Nuevas funciones para Alta.js
export const offerThreeCredsVerification = async () => {
  const response = await axios.post(`${BASE_URL}/verification/offer3creds`, {});
  return { verificationUrl: response.data.verificationUrl, stateId: response.data.state };
};

export const checkThreeCredsVerificationStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/verification/session/${stateId}`);
  return response.data; // {status, ...}
};

export const offerIssuance = async (stateId) => {
  const response = await axios.post(`${BASE_URL}/issuance/offer`, { stateId });
  return { issuanceOfferUrl: response.data.issuanceOfferUrl };
};

export const checkIssuanceSessionStatus = async (stateId) => {
  const response = await axios.get(`${BASE_URL}/issuance/session/${stateId}`);
  return response.data; // {issuanceStatus}
};

// Para Dashboard.js (revocar credencial)
export const revokeCredential = async (dni) => {
  const response = await axios.post(`${BASE_URL}/revocar-credencial`, { dni });
  return response.data; // { message: 'Credencial revocada con éxito', user: ... } o similar
};
