import axios from 'axios';
import { data } from 'react-router-dom';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

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

// Nueva función para obtener el usuario por DNI
export const fetchUserDataByDni = async (dni) => {
  const response = await axios.get(`${BASE_URL}/user/${dni}`);
  console.log(response.data)
  return response.data; // Debe devolver {user: {...}} con la info actualizada
};
