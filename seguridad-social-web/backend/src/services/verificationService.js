// src/services/verificationService.js

const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const logger = require("../../logger");

const {
  findOrCreateOrUpdateUser,
  checkCredentialsRevocation,
  extractUserDataFromDecodedCredentialSubject,
} = require("../utils/validations");
const sessionStore = require("../utils/sessionStore"); // Usa Redis
const User = require("../models/User");
const { generateTokens } = require("../utils/jwtUtils");
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
  getOrSelectDidSomewhere,
} = require("./presentationService");
const { extractPresentationDefinition } = require("../utils/presentationUtils");

// Config/env
const OFFER_EXPIRATION_MS = 60 * 1000;
const { WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL } =
  process.env;

/**
 * Helper para crear la oferta OID4VC y guardar la sesión "pending" en Redis.
 * @param {object} requestBody - Datos que se envían a walt.id (vp_policies, vc_policies, request_credentials, etc.)
 * @param {string} callbackPath - Ej: '/verification/statusCallbackAlta' o '/verification/statusCallback'
 * @returns {Promise<{ stateId: string, verificationUrl: string }>}
 */
async function createOid4vcVerificationOffer(requestBody, callbackPath) {
  // 1) Generar un stateId
  const stateId = uuidv4();

  // 2) Construir headers para walt.id
  const headers = {
    "Content-Type": "application/json",
    authorizeBaseUrl: "openid4vp://authorize",
    responseMode: "direct_post",
    // Importante: statusCallbackUri añade el stateId al final
    statusCallbackUri: `${VERIFIER_COORD_PUBLIC_URL}${callbackPath}/${stateId}`,
  };

  // 3) Llamada a walt.id
  const response = await axios.post(
    `${WALTID_VERIFIER_URL}/openid4vc/verify`,
    requestBody,
    { headers },
  );
  const verificationUrl = response.data;

  // 4) Guardar la sesión en Redis
  const sessionData = {
    status: "pending",
    verificationUrl,
    verificationResult: null,
    // Podrías añadir type, expiresAt, etc. si lo deseas:
    expiresAt: Date.now() + OFFER_EXPIRATION_MS,
  };
  await sessionStore.setSession(stateId, sessionData);

  return { stateId, verificationUrl };
}

/**
 * Helper para unificar la lógica común de los callbacks:
 * - Carga la sesión por stateId
 * - Actualiza status según verificationResult
 * - Decodifica vp_token y credenciales
 * - Revisa revocación
 *
 * Devuelve { sessionData, decodedCreds } si todo ok.
 * Si la verificación falla, sessionData quedará en 'failed'.
 */
async function processCommonCallback(stateId, verificationData) {
  const sessionData = await sessionStore.getSession(stateId);
  if (!sessionData) {
    const err = new Error("Sesión no encontrada");
    err.status = 404;
    throw err;
  }

  const { verificationResult, tokenResponse } = verificationData;
  sessionData.verificationResult = verificationResult;
  sessionData.status = verificationResult ? "verified" : "failed";

  if (!verificationResult) {
    // Ya falló, guardamos y devolvemos
    await sessionStore.setSession(stateId, sessionData);
    return { sessionData, decodedCreds: null };
  }

  // Extraer vp_token
  const vpToken = tokenResponse && tokenResponse.vp_token;
  if (!vpToken) {
    sessionData.status = "failed";
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error("No se encontró el vp_token");
    err.status = 400;
    throw err;
  }

  // Decodificar verifiableCredential
  const vpDecoded = jwt.decode(vpToken);
  const credentialsJwt = vpDecoded?.vp?.verifiableCredential;
  if (!credentialsJwt || credentialsJwt.length === 0) {
    sessionData.status = "failed";
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error("No se presentaron credenciales");
    err.status = 400;
    throw err;
  }

  // Revisar revocación
  const revoked = await checkCredentialsRevocation(credentialsJwt);
  if (revoked) {
    sessionData.status = "failed";
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error("Una de las credenciales está revocada");
    err.status = 400;
    throw err;
  }

  // Decodificar cada cred
  const decodedCreds = credentialsJwt.map((c) => jwt.decode(c));

  return { sessionData, decodedCreds };
}

module.exports = {
  /**
   * Genera una oferta de verificación OID4VC para 1 cred.
   * @param {object} requestBody - request_credentials y políticas de walt.id
   * @returns {Promise<{ stateId: string, verificationUrl: string }>}
   */
  async offerVerificationOneCred(requestBody) {
    if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL) {
      throw new Error(
        "Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL",
      );
    }
    // Simplemente delegamos a createOid4vcVerificationOffer
    return createOid4vcVerificationOffer(
      requestBody,
      "/verification/statusCallback",
    );
  },

  /**
   * Genera una oferta de verificación pidiendo EXACTAMENTE 3 credenciales (manual).
   * @returns {Promise<{ stateId: string, verificationUrl: string }>}
   */
  async offerVerification3CredsManual() {
    if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL || !ISS_COORD_URL) {
      throw new Error(
        "Faltan variables de entorno (WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL)",
      );
    }

    // Pedir DIDs al issuer_coord (ejemplo)
    const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
    const { issuers } = didsResponse.data;
    if (!issuers || issuers.length < 3) {
      throw new Error("No se pudieron obtener los 3 DIDs de los issuers");
    }

    // Construimos el requestBody
    const requestBody = {
      vp_policies: [
        { policy: "minimum-credentials", args: 3 },
        { policy: "maximum-credentials", args: 100 },
      ],
      vc_policies: [
        "signature",
        "expired",
        "not-before",
        {
          policy: "webhook",
          args: "http://issuer_coord:5500/webhook-verify",
        },
        {
          policy: "allowed-issuer",
          args: issuers,
        },
      ],
      request_credentials: [
        { type: "CustomIdentityCredential", format: "jwt_vc_json" },
        { type: "PassportCredential", format: "jwt_vc_json" },
        { type: "EmployerRegistrationCredential", format: "jwt_vc_json" },
      ],
    };

    // Llamamos a nuestro helper
    const { stateId, verificationUrl } = await createOid4vcVerificationOffer(
      requestBody,
      "/verification/statusCallbackAlta",
    );

    // Podríamos actualizar la sesión con un "type" y "expiresAt" extra:
    const sessionData = await sessionStore.getSession(stateId);
    sessionData.type = "alta";
    // La sobrescribimos
    await sessionStore.setSession(stateId, sessionData);

    return { stateId, verificationUrl };
  },

  /**
   * Genera una oferta de verificación "3 creds" y la ejecuta automáticamente sin QR.
   * @returns {Promise<{ message: string, state: string, verificationUrl: string }>}
   */
  async offerVerification3CredsAutomatic() {
    if (!WALTID_VERIFIER_URL || !VERIFIER_COORD_PUBLIC_URL || !ISS_COORD_URL) {
      throw new Error(
        "Faltan variables de entorno (WALTID_VERIFIER_URL, VERIFIER_COORD_PUBLIC_URL, ISS_COORD_URL)",
      );
    }

    // Pedir issuer DIDs
    const didsResponse = await axios.get(`${ISS_COORD_URL}/did/issuers`);
    const { issuers } = didsResponse.data;
    if (!issuers || issuers.length < 3) {
      throw new Error("No se pudieron obtener los 3 issuers");
    }

    // Construir requestBody
    const requestBody = {
      vp_policies: [
        { policy: "minimum-credentials", args: 3 },
        { policy: "maximum-credentials", args: 100 },
      ],
      vc_policies: [
        "signature",
        "expired",
        "not-before",
        {
          policy: "webhook",
          args: "http://issuer_coord:5500/webhook-verify",
        },
        {
          policy: "allowed-issuer",
          args: issuers,
        },
      ],
      request_credentials: [
        { type: "CustomIdentityCredential", format: "jwt_vc_json" },
        { type: "PassportCredential", format: "jwt_vc_json" },
        { type: "EmployerRegistrationCredential", format: "jwt_vc_json" },
      ],
    };

    // 1) Crear la oferta OID4VC
    const { stateId, verificationUrl } = await createOid4vcVerificationOffer(
      requestBody,
      "/verification/statusCallbackAlta",
    );

    // 2) Actualizamos la sesión con "type" y un expiresAt menor
    let sessionData = await sessionStore.getSession(stateId);
    sessionData.type = "alta";
    sessionData.expiresAt = Date.now() + 1 * 60 * 1000; // 1 min
    await sessionStore.setSession(stateId, sessionData);

    // ============= Ejecución automática (sin QR) ============
    const resolvedPresentationRequest =
      await resolvePresentationRequest(verificationUrl);
    const presentationDefinition = extractPresentationDefinition(
      resolvedPresentationRequest,
    );

    const matchedCreds = await matchCredentialsForPresentation(
      presentationDefinition,
    );
    if (!matchedCreds || matchedCreds.length < 3) {
      sessionData.status = "failed";
      await sessionStore.setSession(stateId, sessionData);
      const err = new Error("No matching 3 credentials en la wallet");
      err.status = 400;
      throw err;
    }

    const selectedCredsIds = matchedCreds.map((c) => c.id);
    const did = await getOrSelectDidSomewhere();

    await usePresentationRequest(
      did,
      resolvedPresentationRequest,
      selectedCredsIds,
      null,
    );

    return {
      message:
        "Verificación de 3 credenciales (alta automática) iniciada. Revisa callback.",
      state: stateId,
      verificationUrl,
    };
  },

  /**
   * Callback "statusCallbackAlta" para 3 credenciales (ALTA)
   */
  async handleStatusCallbackAlta(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(
      stateId,
      verificationData,
    );

    if (sessionData.status === "failed") return;

    // Buscamos la cred. de identidad
    const identityCredDecoded = decodedCreds.find((c) =>
      c?.vc?.type?.includes("CustomIdentityCredential"),
    );
    if (!identityCredDecoded) {
      sessionData.status = "failed";
      await sessionStore.setSession(stateId, sessionData);
      const err = new Error("No se encontró la credencial de identidad");
      err.status = 400;
      throw err;
    }

    // Extraer datos y marcar en DB
    const idData = extractUserDataFromDecodedCredentialSubject(
      identityCredDecoded.vc.credentialSubject,
    );
    const user = await findOrCreateOrUpdateUser(idData, "manual");
    user.hasAltaCredential = true;
    user.altaIssueDate = new Date();
    await user.save();

    sessionData.user = user;
    // Ejemplo: un token de "alta"
    sessionData.token = "ejemplo-de-token-alta";
    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Callback genérico (1 cred).
   */
  async handleStatusCallbackGeneric(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(
      stateId,
      verificationData,
    );
    if (sessionData.status === "failed") return;

    // 1 cred => la primera
    const vcDecoded = decodedCreds[0];
    const userData = extractUserDataFromDecodedCredentialSubject(
      vcDecoded.vc.credentialSubject,
    );

    const user = await findOrCreateOrUpdateUser(userData, "manual");
    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    sessionData.user = user;
    sessionData.token = accessToken;
    sessionData.refreshToken = refreshToken;

    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Callback "walletLogin" (flujo automático).
   */
  async handleStatusCallbackWalletLogin(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(
      stateId,
      verificationData,
    );
    if (sessionData.status === "failed") return;

    // Primera cred => identidad
    const identityCredDecoded = decodedCreds[0];
    const userData = extractUserDataFromDecodedCredentialSubject(
      identityCredDecoded.vc.credentialSubject,
    );
    const user = await findOrCreateOrUpdateUser(userData, "automatic");

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    sessionData.user = user;
    sessionData.token = accessToken;
    sessionData.refreshToken = refreshToken;
    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Devuelve la información de la sesión, tokens, user, etc.
   */
  async getVerificationSession(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("Sesión no encontrada");
      err.status = 404;
      throw err;
    }

    // Expiración
    if (
      sessionData.expiresAt &&
      Date.now() > sessionData.expiresAt &&
      sessionData.status === "pending"
    ) {
      sessionData.status = "expired";
      await sessionStore.setSession(stateId, sessionData);
    }

    let userResponse = null;
    if (sessionData.user && sessionData.user.documentNumber) {
      const u = await User.findOne({
        documentNumber: sessionData.user.documentNumber,
      });
      if (u) {
        userResponse = {
          firstName: u.firstName,
          familyName: u.familyName,
          documentNumber: u.documentNumber,
          currentAddress: u.currentAddress,
          hasAltaCredential: u.hasAltaCredential,
          altaIssueDate: u.altaIssueDate,
          gender: u.gender,
          nationality: u.nationality,
          birthDate: u.birthDate,
          nss: u.nss,
          altaCredentialData: u.altaCredentialData || null,
        };
      }
    }

    return {
      status: sessionData.status,
      token: sessionData.token || null,
      refreshToken: sessionData.refreshToken || null,
      user: userResponse,
    };
  },
};
