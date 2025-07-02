/**
 * @module src/services/authService
 * @description Servicio de autenticación que maneja:
 *              - Login y verificación de credencial de identidad de forma “automática” (backend-only, sin QR).  
 *              - Refresco de tokens JWT.
 *
 * @requires ./HolderSessionManager
 * @requires ../utils/jwtUtils~verifyRefreshToken
 * @requires ../utils/jwtUtils~generateTokens
 * @requires ./walletService~getUserInfo
 * @requires ./walletService~listDIDs
 * @requires ./walletService~listCredentials
 * @requires ../models/User
 * @requires uuid~v4
 * @requires axios
 * @requires ../../logger
 * @requires ../utils/sessionStore
 * @requires ./presentationService~resolvePresentationRequest
 * @requires ./presentationService~matchCredentialsForPresentation
 * @requires ./presentationService~usePresentationRequest
 * @requires ../utils/presentationUtils~extractPresentationDefinition
 */

const HolderSessionManager = require("./HolderSessionManager");
const { verifyRefreshToken, generateTokens } = require("../utils/jwtUtils");
const { getUserInfo, listDIDs, listCredentials } = require("./walletService");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const logger = require("../../logger");
const sessionStore = require("../utils/sessionStore");
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
} = require("./presentationService");
const { extractPresentationDefinition } = require("../utils/presentationUtils");

module.exports = {
  /**
   * Autentica al Holder con email/password y verifica su CustomIdentityCredential
   * mediante OpenID4VC en backend (flujo automático, sin QR visible).
   *
   * @async
   * @function loginAndVerifyIdentityCredential
   * @param {string} email    - Email del Holder.
   * @param {string} password - Contraseña del Holder.
   *
   * @throws {Error} Con código `IDENTITY_CRED_MISSING` y status 404 si la wallet
   *                 no contiene la credencial requerida.
   * @throws {Error} Si falla cualquier paso de autenticación, verificación o sesión.
   *
   * @returns {Promise<{message: string, state: string, verificationUrl: string}>}
   *   - message: Indica que el flujo de login y verificación ha iniciado.  
   *   - state:   Identificador de sesión (stateId) para polling.  
   *   - verificationUrl: URL donde se procesa internamente la solicitud de presentación.
   */
  async loginAndVerifyIdentityCredential(email, password) {
    logger.debug(
      `[authService] loginAndVerifyIdentityCredential - Start with email=${email}`
    );

    // 1) Login en la wallet del Holder
    await HolderSessionManager.loginHolderWithCredentials(email, password);
    logger.debug("[authService] loginHolderWithCredentials OK");

    // 2) Obtener token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    if (!walletId) {
      logger.error("[authService] No walletId found after login");
      throw new Error("No walletId found after login");
    }
    logger.debug(`[authService] token? ${!!token}, walletId=${walletId}`);

    // Obtención de información adicional del Holder (opcional)
    const userInfo = await getUserInfo(token);
    logger.debug(`[authService] userInfo: ${JSON.stringify(userInfo, null, 2)}`);

    // 3) Listar DIDs y seleccionar el primero
    const dids = await listDIDs(token, walletId);
    logger.debug(`[authService] DIDs => ${JSON.stringify(dids, null, 2)}`);
    const did = dids[0]?.did;
    if (!did) {
      logger.error("[authService] DID not found in wallet");
      throw new Error("No DID found in wallet");
    }

    // 4) Verificar existencia de CustomIdentityCredential en la wallet
    const creds = await listCredentials(token, walletId);
    const identityCred = creds.find(
      (c) =>
        Array.isArray(c.parsedDocument?.type) &&
        c.parsedDocument.type.includes("CustomIdentityCredential")
    );
    if (!identityCred) {
      logger.warn(
        "[authService] Identity credential missing in holder wallet"
      );
      const err = new Error(
        "Holder wallet does not contain a CustomIdentityCredential"
      );
      err.status = 404;
      err.code = "IDENTITY_CRED_MISSING";
      throw err;
    }
    logger.debug(`[authService] Found identityCred => ${identityCred.id}`);

    // 5) Crear oferta de verificación en Walt.ID
    const stateId = uuidv4();
    const requestBody = {
      request_credentials: [
        { type: "CustomIdentityCredential", format: "jwt_vc_json" },
      ],
    };
    const headers = {
      "Content-Type": "application/json",
      authorizeBaseUrl: "openid4vp://authorize",
      responseMode: "direct_post",
      statusCallbackUri: `${process.env.VERIFIER_COORD_PUBLIC_URL}/verification/statusCallbackWalletLogin/${stateId}`,
    };
    logger.debug(
      `[authService] POST -> ${process.env.WALTID_VERIFIER_URL}/openid4vc/verify, state=${stateId}`
    );
    const offerResp = await axios.post(
      `${process.env.WALTID_VERIFIER_URL}/openid4vc/verify`,
      requestBody,
      { headers }
    );
    const verificationUrl = offerResp.data;
    logger.debug(`[authService] verificationUrl = ${verificationUrl}`);

    // 6) Guardar sesión en Redis con estado pendiente
    await sessionStore.setSession(stateId, {
      status: "pending",
      verificationUrl,
      verificationResult: null,
      user: null,
      flow: "automatic",
    });

    // 7) Resolver la solicitud de presentación en backend
    const resolvedRequest = await resolvePresentationRequest(
      verificationUrl
    );
    logger.debug(
      `[authService] resolvedPresentationRequest = ${JSON.stringify(
        resolvedRequest,
        null,
        2
      )}`
    );

    // 8) Extraer definición y emparejar credenciales
    const presentationDefinition = extractPresentationDefinition(
      resolvedRequest
    );
    logger.debug(
      `[authService] presentationDefinition = ${JSON.stringify(
        presentationDefinition,
        null,
        2
      )}`
    );
    const matchedCreds = await matchCredentialsForPresentation(
      presentationDefinition
    );
    if (!matchedCreds.length) {
      logger.warn(
        "[authService] No matching identity credential in wallet"
      );
      const err = new Error(
        "Holder wallet does not contain a matching CustomIdentityCredential"
      );
      err.status = 404;
      err.code = "IDENTITY_CRED_MISSING";
      throw err;
    }
    logger.debug(
      `[authService] matchedCreds => ${JSON.stringify(
        matchedCreds,
        null,
        2
      )}`
    );

    // 9) Presentar credencial emparejada
    const selectedCredentialId = matchedCreds[0].id;
    logger.debug(
      `[authService] usePresentationRequest with credId=${selectedCredentialId}`
    );
    const useResp = await usePresentationRequest(
      did,
      resolvedRequest,
      [selectedCredentialId],
      null
    );
    logger.debug(
      `[authService] usePresentationRequest response => ${JSON.stringify(
        useResp,
        null,
        2
      )}`
    );

    // Retornar estado inicial de la verificación
    return {
      message:
        "Login automático iniciado. Verificación en curso. Poll /verification/session/:stateId",
      state: stateId,
      verificationUrl,
    };
  },

  /**
   * Refresca un JWT de acceso usando un refresh token válido.
   *
   * @async
   * @function refreshTokens
   * @param {string} refreshToken - Refresh token a validar y sustituir.
   *
   * @throws {Error} Si el refresh token es inválido, no existe el usuario
   *                 o el token no está registrado en la DB.
   *
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   *   - accessToken: Nuevo JWT de acceso.  
   *   - refreshToken: Nuevo refresh token.
   */
  async refreshTokens(refreshToken) {
    logger.debug(
      `[authService] refreshTokens - refreshToken: ${refreshToken}`
    );

    // Validar y decodificar el refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      logger.warn("[authService] Invalid refresh token");
      throw new Error("Invalid refresh token");
    }

    // Buscar usuario y comprobar token registrado
    const user = await User.findById(decoded.sub);
    if (!user) {
      logger.warn(`[authService] User id=${decoded.sub} not found`);
      throw new Error("User not found");
    }
    if (!user.refreshTokens.includes(refreshToken)) {
      logger.warn("[authService] Refresh token not recognized");
      throw new Error("Refresh token not recognized");
    }

    // Generar nuevos tokens y actualizar DB
    const { accessToken, refreshToken: newToken } = generateTokens(
      user._id.toString()
    );
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newToken);
    await user.save();
    logger.debug("[authService] Tokens refreshed successfully");

    return { accessToken, refreshToken: newToken };
  },
};
