// src/services/issuanceService.js
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Importa tu logger, el store de sesión y los modelos necesarios
const logger = require("../../logger");
const sessionStore = require("../utils/sessionStore");
const User = require("../models/User");

// Importa el HolderSessionManager y cualquier otro service que necesites
const HolderSessionManager = require("./HolderSessionManager");
const { listDIDs } = require("./walletService");

// Variables de entorno para callback, etc.
const { VERIFIER_COORD_PUBLIC_URL, WALTID_ISSUER_URL } = process.env;

module.exports = {
  /**
   * Lógica para ofrecer (iniciar) una emisión de credencial.
   * @param {string} stateId - ID de la sesión/estado en Redis
   * @returns {object} - { issuanceOfferUrl, state }
   */
  async offerIssuance(stateId) {
    // 1) Leer la sesión en Redis
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData || !sessionData.user) {
      const err = new Error("No existe la sesión o no hay usuario asociado");
      err.status = 404;
      throw err;
    }

    const user = sessionData.user;
    if (!user.hasAltaCredential) {
      const err = new Error(
        "El usuario no tiene una alta pendiente de emisión",
      );
      err.status = 400;
      throw err;
    }

    // 2) Obtener datos extra de la sesión
    const employerData = sessionData.employerData || {
      employerName: "Empresa de Servicios S.A.",
      contributionAccountCode: "0111-2222-33-4444444444",
      socialSecurityRegime: "Régimen General",
      collectiveAgreements: [
        "Convenio Colectivo de Empresas de Servicios Generales",
        "Convenio Colectivo Sectorial",
      ],
    };
    const userAddress = sessionData.userAddress || "Calle Ejemplo 123, Madrid";

    // 3) Construir la credencial base (simplificado)
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
          apellidos: user.familyName || "Perez",
          nombre: user.firstName || "Mario",
          dni: user.documentNumber || "12345678A",
          nss: user.nss || "123456789012",
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

    // 4) Guardar en DB (en la colección de usuarios)
    const dbUser = await User.findOne({ documentNumber: user.documentNumber });
    if (dbUser) {
      dbUser.altaCredentialJti = revocationId;
      dbUser.altaCredentialData = altaCredential;
      await dbUser.save();
    }

    // 5) Llamar a WaltID (issuance)
    const callbackUrl = `${VERIFIER_COORD_PUBLIC_URL}/issuance/statusCallback/${stateId}`;
    logger.debug(`[offerIssuance] => callbackUrl = ${callbackUrl}`);

    // Ejemplo de configuración
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
    const credentialConfigurationId = "CustomIdentityCredential_jwt_vc_json";

    const issuanceRequestBody = {
      issuerKey,
      issuerDid,
      credentialConfigurationId,
      credentialData: altaCredential,
      mapping: {
        id: altaCredential.id,
        issuer: { id: "<issuerDid>" },
        credentialSubject: { id: "<subjectDid>" },
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
      },
    );

    logger.debug(
      `[offerIssuance] => issueResponse.data: ${JSON.stringify(issueResponse.data, null, 2)}`,
    );

    // 6) Actualizar la sesión en Redis
    sessionData.user = dbUser || user;
    sessionData.issuanceOfferUrl = issueResponse.data; // la URL devuelta por WaltID
    sessionData.issuanceStatus = "offered";

    await sessionStore.setSession(stateId, sessionData);

    // 7) Retornar algo al controller
    return {
      issuanceOfferUrl: issueResponse.data,
      state: stateId,
    };
  },

  /**
   * Lógica para manejar la callback (issuanceStatusCallback).
   * @param {string} stateId
   */
  async handleIssuanceCallback(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("Sesión no encontrada en Redis");
      err.status = 404;
      throw err;
    }

    // Asumimos que si la callback llegó, la issuance fue aceptada
    sessionData.issuanceStatus = "accepted";
    await sessionStore.setSession(stateId, sessionData);

    return sessionData;
  },

  /**
   * Retorna el estado actual de la issuance (issuanceStatus).
   * @param {string} stateId
   * @returns {string} issuanceStatus
   */
  async getIssuanceSessionStatus(stateId) {
    const sessionData = await sessionStore.getSession(stateId);
    if (!sessionData) {
      const err = new Error("Sesión no encontrada");
      err.status = 404;
      throw err;
    }

    return sessionData.issuanceStatus || "unknown";
  },

  /**
   * Lógica para reclamar la credencial (claimAltaCredential).
   * @param {string} stateId
   * @returns {object} - { message, claimedCredentials }
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

    // Obtenemos token y walletId
    const token = await HolderSessionManager.getToken();
    const walletId = HolderSessionManager.getWalletId();
    if (!token || !walletId) {
      const err = new Error(
        "No se encontró sesión de la wallet (token o walletId)",
      );
      err.status = 500;
      throw err;
    }

    // DID del holder
    const dids = await listDIDs(token, walletId);
    if (!dids || !dids.length) {
      const err = new Error("No se encontraron DIDs en la wallet");
      err.status = 400;
      throw err;
    }
    const did = dids[0].did;

    // Endpoint de walt.id para "claim"
    const useOfferUrl = `${process.env.WALLET_COORD_URL}/wallet-api/wallet/${walletId}/exchange/useOfferRequest?did=${encodeURIComponent(did)}&requireUserInput=false`;
    logger.debug(`[claimAltaCredential] => POST -> ${useOfferUrl}`);

    // Enviamos issuanceOfferUrl tal cual, con 'Content-Type': 'text/plain'
    const resp = await axios.post(useOfferUrl, issuanceOfferUrl, {
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Bearer ${token}`,
      },
    });

    logger.debug(
      `[claimAltaCredential] => Resp.data: ${JSON.stringify(resp.data, null, 2)}`,
    );

    // Marcamos la sesión
    sessionData.issuanceStatus = "claimed";
    await sessionStore.setSession(stateId, sessionData);

    return {
      message: "Credencial de Alta reclamada con éxito",
      claimedCredentials: resp.data,
    };
  },
};
