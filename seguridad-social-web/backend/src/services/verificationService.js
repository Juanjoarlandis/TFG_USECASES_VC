// src/services/verificationService.js
/* eslint-disable max-lines */
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../../logger');

const {
  findOrCreateOrUpdateUser,
  checkCredentialsRevocation,
  extractUserDataFromDecodedCredentialSubject,
} = require('../utils/validations');
const sessionStore = require('../utils/sessionStore');          // Redis wrapper
const User = require('../models/User');
const { generateTokens } = require('../utils/jwtUtils');

const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
  getOrSelectDidSomewhere,
} = require('./presentationService');
const { extractPresentationDefinition } = require('../utils/presentationUtils');

// ────────────────────────────────────────────────────────────────────────────
// ⚠️  ¡IMPORTANTE!  NO hagas destructuring de process.env aquí arriba:         │
//     — si los tests cambian process.env en caliente ya no se propaga.         │
//     — leeremos las vars justo cuando las usemos.                             │
// ────────────────────────────────────────────────────────────────────────────
const OFFER_EXPIRATION_MS = 60 * 1000;       // 1 min

/* ════════════════════════════════════════════════════════════════════════ */
/*                                  HELPERS                                */
/* ════════════════════════════════════════════════════════════════════════ */

/**
 * Genera la “offer” OID4VC en Walt.id, guarda el estado ‘pending’ en Redis
 * y devuelve { stateId, verificationUrl }.
 */
async function createOid4vcVerificationOffer(requestBody, callbackPath) {
  // (1) stateId único
  const stateId = uuidv4();

  // (2) Headers con callback dinámico
  const headers = {
    'Content-Type': 'application/json',
    authorizeBaseUrl: 'openid4vp://authorize',
    responseMode: 'direct_post',
    statusCallbackUri: `${process.env.VERIFIER_COORD_PUBLIC_URL}${callbackPath}/${stateId}`,
  };

  // (3) Call a Walt.id
  const verifierUrl = `${process.env.WALTID_VERIFIER_URL}/openid4vc/verify`;
  const { data: verificationUrl } = await axios.post(verifierUrl, requestBody, { headers });

  // (4) Persistimos sesión
  await sessionStore.setSession(stateId, {
    status: 'pending',
    verificationUrl,
    verificationResult: null,
    expiresAt: Date.now() + OFFER_EXPIRATION_MS,
  });

  return { stateId, verificationUrl };
}

/**
 * Lógica común a TODOS los callbacks de Walt.id:
 *   – valida que la sesión exista
 *   – marca success/failure
 *   – decodifica credenciales & comprueba revocación
 *
 * Devuelve { sessionData, decodedCreds }.
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

  const decodedCreds = credentialsJwt.map((c) => jwt.decode(c));
  return { sessionData, decodedCreds };
}

/* ════════════════════════════════════════════════════════════════════════ */
/*                                API PUBLICA                              */
/* ════════════════════════════════════════════════════════════════════════ */

module.exports = {
  /* ─────────────────────── 1 CRED ─────────────────────── */
  async offerVerificationOneCred(requestBody) {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL) {
      throw new Error('Faltan variables de entorno WALTID_VERIFIER_URL o VERIFIER_COORD_PUBLIC_URL');
    }
    return createOid4vcVerificationOffer(requestBody, '/verification/statusCallback');
  },

  /* ───────────────────── MANUAL 3 CREDS ────────────────── */
  async offerVerification3CredsManual() {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL || !process.env.ISS_COORD_URL) {
      throw new Error('Faltan variables de entorno requeridas');
    }

    // (1) pedimos los DIDs al issuer‑coord
    const { data: { issuers } } = await axios.get(`${process.env.ISS_COORD_URL}/did/issuers`);
    if (!issuers || issuers.length < 3) throw new Error('No se pudieron obtener los 3 DIDs de los issuers');

    // (2) cuerpo para Walt.id
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

    // Marcamos tipo de sesión
    const session = await sessionStore.getSession(stateId);
    session.type = 'alta';
    await sessionStore.setSession(stateId, session);

    return { stateId, verificationUrl };
  },

  /* ────────────────────── AUTO 3 CREDS ─────────────────── */
  async offerVerification3CredsAutomatic() {
    if (!process.env.WALTID_VERIFIER_URL || !process.env.VERIFIER_COORD_PUBLIC_URL || !process.env.ISS_COORD_URL) {
      throw new Error('Faltan variables de entorno requeridas');
    }

    /* Paso 1: mismos preparativos que en el flujo manual … */
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

    /* Paso 2: ajustamos la sesión */
    const session = await sessionStore.getSession(stateId);
    session.type = 'alta';
    session.expiresAt = Date.now() + 60_000;               // 1 min
    await sessionStore.setSession(stateId, session);

    /* Paso 3: ejecutamos sin QR */
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
    await usePresentationRequest(
      did,
      resolved,
      matchedCreds.map((c) => c.id),
      null,
    );

    return {
      message: 'Verificación de 3 credenciales (alta automática) iniciada. Revisa callback.',
      state: stateId,
      verificationUrl,
    };
  },

  /* ────────────────────────── CALLBACKS ───────────────────────── */
  async handleStatusCallbackAlta(stateId, verificationData) {
    const { sessionData, decodedCreds } = await processCommonCallback(stateId, verificationData);
    if (sessionData.status === 'failed') return;

    const identityCred = decodedCreds.find((c) => c?.vc?.type?.includes('CustomIdentityCredential'));
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
    sessionData.token = 'token‑alta‑ejemplo';
    await sessionStore.setSession(stateId, sessionData);
  },

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

  /* ─────────────────────── CONSULTAR SESIÓN ────────────────────── */
  async getVerificationSession(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error('Sesión no encontrada');
      err.status = 404;
      throw err;
    }

    // expiración automática
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
