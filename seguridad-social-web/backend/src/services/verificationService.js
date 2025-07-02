/**
 * @module src/services/verificationService
 * @description Servicio que gestiona el flujo de verificación de credenciales con Walt.id:
 *              - Creación de ofertas de verificación (1 y 3 credenciales, manual y automático)
 *              - Procesamiento de callbacks de estado (alta, genérico, walletLogin)
 *              - Consulta del estado de la sesión de verificación
 *
 * @requires uuid~v4
 * @requires axios
 * @requires jsonwebtoken
 * @requires ../../logger
 * @requires ../utils/validations~findOrCreateOrUpdateUser
 * @requires ../utils/validations~checkCredentialsRevocation
 * @requires ../utils/validations~extractUserDataFromDecodedCredentialSubject
 * @requires ../utils/sessionStore
 * @requires ../models/User
 * @requires ../utils/jwtUtils~generateTokens
 * @requires ./presentationService~resolvePresentationRequest
 * @requires ./presentationService~matchCredentialsForPresentation
 * @requires ./presentationService~usePresentationRequest
 * @requires ./presentationService~getOrSelectDidSomewhere
 * @requires ../utils/presentationUtils~extractPresentationDefinition
 */

const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../../logger');
const {
  findOrCreateOrUpdateUser,
  checkCredentialsRevocation,
  extractUserDataFromDecodedCredentialSubject,
} = require('../utils/validations');
const sessionStore = require('../utils/sessionStore');
const User = require('../models/User');
const { generateTokens } = require('../utils/jwtUtils');
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
  getOrSelectDidSomewhere,
} = require('./presentationService');
const { extractPresentationDefinition } = require('../utils/presentationUtils');

const OFFER_EXPIRATION_MS = 60 * 1000; // 1 minuto

/**
 * Crea una oferta OID4VC en Walt.id, almacena estado `'pending'` en Redis
 * y devuelve el identificador de sesión y la URL de verificación.
 *
 * @async
 * @function createOid4vcVerificationOffer
 * @param {object} requestBody - Cuerpo JSON de la solicitud de verificación.
 * @param {string} callbackPath - Path del callback (sin stateId) que usará Walt.id.
 * @throws {Error} Propaga errores de red o de configuración.
 * @returns {Promise<{stateId: string, verificationUrl: string}>}
 */
async function createOid4vcVerificationOffer(requestBody, callbackPath) {
  const stateId = uuidv4();
  const headers = {
    'Content-Type': 'application/json',
    authorizeBaseUrl: 'openid4vp://authorize',
    responseMode: 'direct_post',
    statusCallbackUri: `${process.env.VERIFIER_COORD_PUBLIC_URL}${callbackPath}/${stateId}`,
  };
  const verifierUrl = `${process.env.WALTID_VERIFIER_URL}/openid4vc/verify`;
  const { data: verificationUrl } = await axios.post(verifierUrl, requestBody, { headers });

  await sessionStore.setSession(stateId, {
    status: 'pending',
    verificationUrl,
    verificationResult: null,
    expiresAt: Date.now() + OFFER_EXPIRATION_MS,
  });

  return { stateId, verificationUrl };
}

/**
 * Procesa lógicamente cualquier callback de Walt.id:
 * - Valida y actualiza sesión en Redis
 * - Decodifica y valida revocación de credenciales presentadas
 *
 * @async
 * @function processCommonCallback
 * @param {string} stateId - Identificador de sesión en Redis.
 * @param {{verificationResult: boolean, tokenResponse?: object}} param1
 * @throws {Error} Si la sesión no existe, falta vp_token o credenciales revocadas.
 * @returns {Promise<{sessionData: object, decodedCreds: object[]|null}>}
 */
async function processCommonCallback(stateId, { verificationResult, tokenResponse }) {
  const sessionData = await sessionStore.getSession(stateId);
  if (!sessionData) {
    const err = new Error('Sesión no encontrada');
    err.status = 404;
    throw err;
  }

  sessionData.verificationResult = verificationResult;
  sessionData.status = verificationResult ? 'verified' : 'failed';
  if (!verificationResult) {
    await sessionStore.setSession(stateId, sessionData);
    return { sessionData, decodedCreds: null };
  }

  const vpToken = tokenResponse?.vp_token;
  if (!vpToken) {
    sessionData.status = 'failed';
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error('No se encontró el vp_token');
    err.status = 400;
    throw err;
  }

  const vpDecoded = jwt.decode(vpToken);
  const credentialsJwt = vpDecoded?.vp?.verifiableCredential;
  if (!credentialsJwt?.length) {
    sessionData.status = 'failed';
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error('No se presentaron credenciales');
    err.status = 400;
    throw err;
  }

  if (await checkCredentialsRevocation(credentialsJwt)) {
    sessionData.status = 'failed';
    await sessionStore.setSession(stateId, sessionData);
    const err = new Error('Una de las credenciales está revocada');
    err.status = 400;
    throw err;
  }

  const decodedCreds = credentialsJwt.map(c => jwt.decode(c));
  return { sessionData, decodedCreds };
}

module.exports = {
  /**
   * Crea una oferta de verificación para una sola credencial.
   *
   * @async
   * @function offerVerificationOneCred
   * @param {object} requestBody - Parámetros de la verificación (tipo de credencial).
   * @throws {Error} Si faltan variables de entorno o falla la llamada a Walt.id.
   * @returns {Promise<{stateId: string, verificationUrl: string}>}
   */
  async offerVerificationOneCred(requestBody) {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL) {
      throw new Error('Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL');
    }
    return createOid4vcVerificationOffer(requestBody, '/verification/statusCallback');
  },

  /**
   * Crea una oferta manual de verificación para tres credenciales.
   *
   * @async
   * @function offerVerification3CredsManual
   * @throws {Error} Si faltan variables de entorno o no se obtienen 3 issuers.
   * @returns {Promise<{stateId: string, verificationUrl: string}>}
   */
  async offerVerification3CredsManual() {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL || !process.env.ISS_COORD_URL) {
      throw new Error('Faltan variables de entorno requeridas');
    }
    const { data: { issuers } } = await axios.get(`${process.env.ISS_COORD_URL}/did/issuers`);
    if (!issuers || issuers.length < 3) throw new Error('No se pudieron obtener los 3 DIDs de los issuers');

    const requestBody = {
      vp_policies: [
        { policy: 'minimum-credentials', args: 3 },
        { policy: 'maximum-credentials', args: 100 },
      ],
      vc_policies: [
        'signature',
        'expired',
        'not-before',
        { policy: 'webhook', args: 'http://issuer_coord:5500/webhook-verify' },
        { policy: 'allowed-issuer', args: issuers },
      ],
      request_credentials: [
        { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
        { type: 'PassportCredential', format: 'jwt_vc_json' },
        { type: 'EmployerRegistrationCredential', format: 'jwt_vc_json' },
      ],
    };

    const { stateId, verificationUrl } = await createOid4vcVerificationOffer(
      requestBody,
      '/verification/statusCallbackAlta',
    );
    const session = await sessionStore.getSession(stateId);
    session.type = 'alta';
    await sessionStore.setSession(stateId, session);

    return { stateId, verificationUrl };
  },

  /**
   * Crea una oferta automática de verificación para tres credenciales
   * y procesa internamente sin requerir QR.
   *
   * @async
   * @function offerVerification3CredsAutomatic
   * @throws {Error} Si faltan variables de entorno o no se emparejan 3 credenciales.
   * @returns {Promise<{message: string, state: string, verificationUrl: string}>}
   */
  async offerVerification3CredsAutomatic() {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL || !process.env.ISS_COORD_URL) {
      throw new Error('Faltan variables de entorno requeridas');
    }
    const { data: { issuers } } = await axios.get(`${process.env.ISS_COORD_URL}/did/issuers`);
    if (!issuers || issuers.length < 3) throw new Error('No se pudieron obtener los 3 issuers');

    const requestBody = {
      vp_policies: [
        { policy: 'minimum-credentials', args: 3 },
        { policy: 'maximum-credentials', args: 100 },
      ],
      vc_policies: [
        'signature',
        'expired',
        'not-before',
        { policy: 'webhook', args: 'http://issuer_coord:5500/webhook-verify' },
        { policy: 'allowed-issuer', args: issuers },
      ],
      request_credentials: [
        { type: 'CustomIdentityCredential', format: 'jwt_vc_json' },
        { type: 'PassportCredential', format: 'jwt_vc_json' },
        { type: 'EmployerRegistrationCredential', format: 'jwt_vc_json' },
      ],
    };

    const { stateId, verificationUrl } = await createOid4vcVerificationOffer(
      requestBody,
      '/verification/statusCallbackAlta',
    );
    const session = await sessionStore.getSession(stateId);
    session.type = 'alta';
    session.expiresAt = Date.now() + OFFER_EXPIRATION_MS;
    await sessionStore.setSession(stateId, session);

    const resolved = await resolvePresentationRequest(verificationUrl);
    const presDef = extractPresentationDefinition(resolved);
    const matchedCreds = await matchCredentialsForPresentation(presDef);
    if (!matchedCreds || matchedCreds.length < 3) {
      session.status = 'failed';
      await sessionStore.setSession(stateId, session);
      const err = new Error('No matching 3 credentials en la wallet');
      err.status = 400;
      throw err;
    }

    const did = await getOrSelectDidSomewhere();
    await usePresentationRequest(did, resolved, matchedCreds.map(c => c.id), null);

    return {
      message: 'Verificación de 3 credenciales (alta automática) iniciada. Revisa callback.',
      state: stateId,
      verificationUrl,
    };
  },

  /**
   * Maneja el callback de estado para la verificación de alta.
   *
   * @async
   * @function handleStatusCallbackAlta
   * @param {string} stateId - Identificador de sesión en Redis.
   * @param {object} verificationData - Datos del callback de Walt.id.
   * @throws {Error} Si faltan credenciales de identidad.
   */
  async handleStatusCallbackAlta(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(stateId, verificationData);
    if (sessionData.status === 'failed') return;

    const identityCred = decodedCreds.find(c => c?.vc?.type?.includes('CustomIdentityCredential'));
    if (!identityCred) {
      sessionData.status = 'failed';
      await sessionStore.setSession(stateId, sessionData);
      const err = new Error('No se encontró la credencial de identidad');
      err.status = 400;
      throw err;
    }

    const idData = extractUserDataFromDecodedCredentialSubject(identityCred.vc.credentialSubject);
    const user = await findOrCreateOrUpdateUser(idData, 'manual');
    user.hasAltaCredential = true;
    user.altaIssueDate = new Date();
    await user.save();

    sessionData.user = user;
    sessionData.token = 'token-alta-ejemplo';
    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Maneja el callback genérico de verificación de una credencial.
   *
   * @async
   * @function handleStatusCallbackGeneric
   * @param {string} stateId - Identificador de sesión en Redis.
   * @param {object} verificationData - Datos del callback de Walt.id.
   */
  async handleStatusCallbackGeneric(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(stateId, verificationData);
    if (sessionData.status === 'failed') return;

    const vcDecoded = decodedCreds[0];
    const userData = extractUserDataFromDecodedCredentialSubject(vcDecoded.vc.credentialSubject);
    const user = await findOrCreateOrUpdateUser(userData, 'manual');

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    sessionData.user = user;
    sessionData.token = accessToken;
    sessionData.refreshToken = refreshToken;
    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Maneja el callback de verificación tras wallet login.
   *
   * @async
   * @function handleStatusCallbackWalletLogin
   * @param {string} stateId - Identificador de sesión en Redis.
   * @param {object} verificationData - Datos del callback de Walt.id.
   */
  async handleStatusCallbackWalletLogin(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(stateId, verificationData);
    if (sessionData.status === 'failed') return;

    const identity = decodedCreds[0];
    const data = extractUserDataFromDecodedCredentialSubject(identity.vc.credentialSubject);
    const user = await findOrCreateOrUpdateUser(data, 'automatic');

    const { accessToken, refreshToken } = generateTokens(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save();

    sessionData.user = user;
    sessionData.token = accessToken;
    sessionData.refreshToken = refreshToken;
    await sessionStore.setSession(stateId, sessionData);
  },

  /**
   * Recupera el estado completo de la sesión de verificación.
   *
   * @async
   * @function getVerificationSession
   * @param {string} stateId - Identificador de sesión en Redis.
   * @throws {Error} Si la sesión no existe.
   * @returns {Promise<{status: string, token: string|null, refreshToken: string|null, user: object|null}>}
   */
  async getVerificationSession(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }

    if (sessionData.expiresAt && Date.now() > sessionData.expiresAt && sessionData.status === 'pending') {
      sessionData.status = 'expired';
      await sessionStore.setSession(stateId, sessionData);
    }

    let userResponse = null;
    if (sessionData.user?.documentNumber) {
      const u = await User.findOne({ documentNumber: sessionData.user.documentNumber });
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
      token: sessionData.token ?? null,
      refreshToken: sessionData.refreshToken ?? null,
      user: userResponse,
    };
  },
};
