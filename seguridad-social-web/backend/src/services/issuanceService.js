/**
 * @module src/services/issuanceService
 * @description Servicio que gestiona el flujo de emisión de credenciales:
 *              - Inicio de oferta de emisión
 *              - Procesamiento de callbacks de estado
 *              - Consulta de estado de la sesión de emisión
 *              - Reclamo de la credencial de alta
 *
 * @requires axios
 * @requires uuid~v4
 * @requires ../../logger
 * @requires ../utils/sessionStore
 * @requires ../models/User
 * @requires ./HolderSessionManager
 * @requires ./walletService~listDIDs
 */

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const logger = require("../../logger");
const sessionStore = require("../utils/sessionStore");
const User = require("../models/User");
const HolderSessionManager = require("./HolderSessionManager");
const { listDIDs } = require("./walletService");

const { VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

module.exports = {
  /**
   * Inicia una oferta de emisión de credencial de alta en Social Security.
   *
   * @async
   * @function offerIssuance
   * @param {string} stateId - Identificador de sesión registrado en Redis.
   * @throws {Error} Si no existe la sesión o el usuario no tiene alta pendiente.
   * @returns {Promise<{issuanceOfferUrl: any, state: string}>}
   *   - issuanceOfferUrl: URL o payload devuelto por WaltID para la emisión.  
   *   - state: Identificador de sesión (stateId) para seguimiento.
   */
  async offerIssuance(stateId) {
    // 1) Verificar sesión y usuario
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData || !sessionData.user) {
      const err = new Error("No existe la sesión o no hay usuario asociado");
      err.status = 404;
      throw err;
    }
    const user = sessionData.user;
    if (!user.hasAltaCredential) {
      const err = new Error("El usuario no tiene una alta pendiente de emisión");
      err.status = 400;
      throw err;
    }

    // 2) Preparar datos de la credencial de alta
    const employerData = sessionData.employerData ?? {
      employerName: "Empresa de Servicios S.A.",
      contributionAccountCode: "0111-2222-33-4444444444",
      socialSecurityRegime: "Régimen General",
      collectiveAgreements: [
        "Convenio Colectivo de Empresas de Servicios Generales",
        "Convenio Colectivo Sectorial",
      ],
    };
    const userAddress = sessionData.userAddress ?? "Calle Ejemplo 123, Madrid";

    // 3) Construcción de la credencial verificable
    const revocationId = uuidv4();
    logger.debug(`[offerIssuance] => revocationId: ${revocationId}`);
    const altaCredential = {
      "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://www.w3.org/ns/credentials/examples/v2",
      ],
      id: `urn:uuid:${revocationId}`,
      type: ["VerifiableCredential", "SocialSecurityRegistrationCredential"],
      issuer: {
        id: "did:web:tesoreria.seguridadsocial.gob.es",
        name: "Tesorería General de la Seguridad Social - España",
        description:
          "Entidad emisora de la credencial de alta en la Seguridad Social",
      },
      name: "Credencial de Alta en la Seguridad Social",
      description:
        "Credencial verificable de alta en el régimen de la Seguridad Social del trabajador",
      validFrom: "2024-12-08T10:19:28Z",
      expirationDate: "2025-12-08T10:19:28Z",
      category: "SocialSecurityEnrollment",
      credentialSubject: {
        id: "did:web:trabajador.example.com",
        employer: {
          employerName: employerData.employerName,
          contributionAccountCode: employerData.contributionAccountCode,
          socialSecurityRegime: employerData.socialSecurityRegime,
          collectiveAgreements: employerData.collectiveAgreements,
        },
        worker: {
          apellidos: user.familyName ?? "Perez",
          nombre: user.firstName ?? "Mario",
          dni: user.documentNumber ?? "12345678A",
          nss: user.nss ?? "123456789012",
          domicilio: userAddress,
          fechaInicioActividad: "2024-12-08",
          grupoCotizacion: "Grupo 4",
          tipoContrato: "Indefinido tiempo completo",
          coeficienteJornada: "100%",
          ocupacion: "Administrativo",
          codigoCuentaCotizacion: employerData.contributionAccountCode,
        },
      },
    };

    // 4) Guardar JTI y datos en el usuario de la base de datos
    const dbUser = await User.findOne({ documentNumber: user.documentNumber });
    if (dbUser) {
      dbUser.altaCredentialJti = revocationId;
      dbUser.altaCredentialData = altaCredential;
      await dbUser.save();
    }

    // 5) Llamada al emisor WaltID para generar la emisión
    const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
    logger.debug(`[offerIssuance] => callbackUrl = ${callbackUrl}`);
    const issuerDid = "did:web:5a4b7b0ff4db.ngrok.app";
    const issuerKey = {
      type: "jwk",
      jwk: {
        kty: "OKP",
        d: "MQiwQ0LRJwY3_E6Hio4HXqb-owk8pNd_7lgBO1p6tac",
        crv: "Ed25519",
        kid: "SD44Rn7TCc8o8eWlOz-_G_pdBXhqufvAPiclQzsjP8w",
        x: "xXmUTXp7JyH9EMtjnObS7lZVtFPe0zEJKqrXxmElaCY",
      },
    };
    const issuanceRequestBody = {
      issuerKey,
      issuerDid,
      credentialConfigurationId: "CustomIdentityCredential_jwt_vc_json",
      credentialData: altaCredential,
      mapping: {
        id: altaCredential.id,
        issuer: { id: issuerDid },
        credentialSubject: { id: altaCredential.credentialSubject.id },
        issuanceDate: "<timestamp>",
        expirationDate: "<timestamp-in:365d>",
      },
      authenticationMethod: "PRE_AUTHORIZED",
    };
    const issueResponse = await axios.post(
      `${WALTID_ISSUER_URL}/openid4vc/jwt/issue`,
      issuanceRequestBody,
      {
        headers: {
          "Content-Type": "application/json",
          statusCallbackUri: callbackUrl,
        },
      }
    );
    logger.debug(
      `[offerIssuance] => issueResponse.data: ${JSON.stringify(
        issueResponse.data,
        null,
        2
      )}`
    );

    // 6) Actualizar sesión en Redis con datos de oferta
    sessionData.user = dbUser ?? user;
    sessionData.issuanceOfferUrl = issueResponse.data;
    sessionData.issuanceStatus = "offered";
    await sessionStore.setSession(stateId, sessionData);

    // 7) Retornar al controlador
    return {
      issuanceOfferUrl: issueResponse.data,
      state: stateId,
    };
  },

  /**
   * Procesa el callback de estado enviado por el emisor.
   *
   * @async
   * @function handleIssuanceCallback
   * @param {string} stateId - Identificador de sesión en Redis.
   * @throws {Error} Si la sesión no existe.
   * @returns {Promise<object>} Datos actualizados de la sesión.
   */
  async handleIssuanceCallback(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("Sesión no encontrada en Redis");
      err.status = 404;
      throw err;
    }
    sessionData.issuanceStatus = "accepted";
    await sessionStore.setSession(stateId, sessionData);
    return sessionData;
  },

  /**
   * Obtiene el estado actual de la sesión de emisión.
   *
   * @async
   * @function getIssuanceSessionStatus
   * @param {string} stateId - Identificador de sesión en Redis.
   * @throws {Error} Si la sesión no existe.
   * @returns {Promise<string>} Estado de la emisión: "offered", "accepted" u "unknown".
   */
  async getIssuanceSessionStatus(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("Sesión no encontrada");
      err.status = 404;
      throw err;
    }
    return sessionData.issuanceStatus ?? "unknown";
  },

  /**
   * Reclama la credencial de alta usando la oferta previamente generada.
   *
   * @async
   * @function claimAltaCredential
   * @param {string} stateId - Identificador de sesión en Redis.
   * @throws {Error} Si la sesión no existe, no hay oferta o falta token/walletId.
   * @returns {Promise<{message: string, claimedCredentials: any}>}
   *   - message: Confirmación de éxito.  
   *   - claimedCredentials: Respuesta del endpoint de exchange de la wallet.
   */
  async claimAltaCredential(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("No existe la sesión");
      err.status = 400;
      throw err;
    }
    const issuanceOfferUrl = sessionData.issuanceOfferUrl;
    if (!issuanceOfferUrl) {
      const err = new Error("No hay issuanceOfferUrl en la sesión");
      err.status = 400;
      throw err;
    }

    // Obtener token, walletId y DID del holder
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    if (!token || !walletId) {
      const err = new Error("No se encontró sesión de la wallet (token o walletId)");
      err.status = 500;
      throw err;
    }
    const dids = await listDIDs(token, walletId);
    if (!dids?.length) {
      const err = new Error("No se encontraron DIDs en la wallet");
      err.status = 400;
      throw err;
    }
    const did = dids[0].did;

    // Enviar la oferta a la wallet para reclamar la credencial
    const useOfferUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(
      did
    )}&requireUserInput=false`;
    logger.debug(`[claimAltaCredential] => POST -> ${useOfferUrl}`);
    const resp = await axios.post(useOfferUrl, issuanceOfferUrl, {
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Bearer ${token}`,
      },
    });
    logger.debug(
      `[claimAltaCredential] => Resp.data: ${JSON.stringify(resp.data, null, 2)}`
    );

    // Actualizar estado en Redis
    sessionData.issuanceStatus = "claimed";
    await sessionStore.setSession(stateId, sessionData);

    return {
      message: "Credencial de Alta reclamada con éxito",
      claimedCredentials: resp.data,
    };
  },
};
