/**
 * @module src/routes/walletRoutes
 * @description Define las rutas para operaciones relacionadas con la wallet del Holder:
 *              - Ping de salud
 *              - Información del usuario Holder
 *              - Gestión de credenciales (listado, detalle, eliminación, aceptación, rechazo, estado)
 *              - Uso de ofertas de credenciales
 *              - Flujo de presentación de credenciales (resolución, emparejamiento, envío)
 *
 * @requires express
 * @requires src/controllers/userInfoController~getUserInfo
 * @requires src/controllers/credentialsController~listCredentials
 * @requires src/controllers/credentialsController~getCredentialById
 * @requires src/controllers/credentialsController~deleteCredential
 * @requires src/controllers/credentialsController~acceptCredential
 * @requires src/controllers/credentialsController~rejectCredential
 * @requires src/controllers/credentialsController~getCredentialStatus
 * @requires src/controllers/offerController~useCredentialOffer
 * @requires src/controllers/presentationController~resolvePresentationRequest
 * @requires src/controllers/presentationController~matchCredentialsForPresentation
 * @requires src/controllers/presentationController~usePresentationRequest
 * @requires src/controllers/pingController
 */

const express = require("express");
const {
  getUserInfo
} = require("../controllers/userInfoController");
const {
  listCredentials,
  getCredentialById,
  deleteCredential,
  acceptCredential,
  rejectCredential,
  getCredentialStatus,
} = require("../controllers/credentialsController");
const {
  useCredentialOffer
} = require("../controllers/offerController");
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
} = require("../controllers/presentationController");
const ping = require("../controllers/pingController");

const router = express.Router();

/**
 * @route GET /ping
 * @summary Endpoint de salud que responde "pong".
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
router.get("/ping", ping);

/**
 * @route GET /user-info
 * @summary Obtiene la información del usuario Holder desde la wallet.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} walletInfo - Objeto con los datos del usuario Holder.
 * @returns Delegación al middleware global de errores.
 */
router.get("/user-info", getUserInfo);

/**
 * @route GET /credentials
 * @summary Lista todas las credenciales disponibles en la wallet.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} Array<Credential> - Listado de credenciales.
 */
router.get("/credentials", listCredentials);

/**
 * @route GET /credentials/:id
 * @summary Obtiene los detalles de una credencial por su ID.
 * @param {import('express').Request} req - Debe incluir <code>req.params.id</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} Credential - Objeto de la credencial.
 * @returns {400} { error: string } - Si falta el ID.
 */
router.get("/credentials/:id", getCredentialById);

/**
 * @route DELETE /credentials/:id
 * @summary Elimina una credencial por su ID.
 * @param {import('express').Request} req - Debe incluir <code>req.params.id</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { message: string } - Confirmación de eliminación.
 * @returns {400} { error: string } - Si falta el ID.
 */
router.delete("/credentials/:id", deleteCredential);

/**
 * @route POST /credential-offer
 * @summary Usa una oferta de credencial proporcionada por URL.
 * @param {import('express').Request} req - Debe incluir en <code>req.body.offerUrl</code> y <code>req.body.did</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Datos resultantes del uso de la oferta.
 * @returns {400} { error: string } - Si faltan parámetros.
 */
router.post("/credential-offer", useCredentialOffer);

/**
 * @route POST /credentials/:id/accept
 * @summary Acepta (aprueba) una credencial pendiente.
 * @param {import('express').Request} req - Debe incluir <code>req.params.id</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Resultado de la aceptación.
 * @returns {400} { error: string } - Si falta el ID.
 */
router.post("/credentials/:id/accept", acceptCredential);

/**
 * @route POST /credentials/:id/reject
 * @summary Rechaza (niega) una credencial pendiente.
 * @param {import('express').Request} req - Debe incluir <code>req.params.id</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Resultado del rechazo.
 * @returns {400} { error: string } - Si falta el ID.
 */
router.post("/credentials/:id/reject", rejectCredential);

/**
 * @route GET /credentials/:id/status
 * @summary Consulta el estado de una credencial.
 * @param {import('express').Request} req - Debe incluir <code>req.params.id</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { status: string } - Objeto con el estado de la credencial.
 * @returns {400} { error: string } - Si falta el ID.
 */
router.get("/credentials/:id/status", getCredentialStatus);

/**
 * @route POST /resolve-presentation-request
 * @summary Resuelve una solicitud de presentación a partir de una URL.
 * @param {import('express').Request} req - Debe incluir <code>req.body.presentationRequestUrl</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Detalles de la solicitud de presentación.
 * @returns {400} { error: string } - Si falta la URL.
 */
router.post("/resolve-presentation-request", resolvePresentationRequest);

/**
 * @route POST /match-credentials
 * @summary Empareja credenciales disponibles con una definición de presentación.
 * @param {import('express').Request} req - Debe incluir <code>req.body.presentationDefinition</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Credenciales que cumplen la definición.
 * @returns {400} { error: string } - Si falta la definición.
 */
router.post("/match-credentials", matchCredentialsForPresentation);

/**
 * @route POST /use-presentation-request
 * @summary Envía la presentación de credenciales seleccionadas.
 * @param {import('express').Request} req - Debe incluir en body <code>did</code>, <code>presentationRequest</code>, <code>selectedCredentials</code>, y opcional <code>disclosures</code>.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} any - Resultado del envío de la presentación.
 * @returns {400} { error: string } - Si faltan parámetros obligatorios.
 */
router.post("/use-presentation-request", usePresentationRequest);

module.exports = router;
