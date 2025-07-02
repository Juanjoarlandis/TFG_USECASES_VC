/**
 * @module src/routes/verificationRoutes
 * @description Define las rutas para el flujo de verificación de credenciales:
 *              - Oferta de verificación de una credencial
 *              - Oferta de verificación manual o automática de tres credenciales
 *              - Callbacks de estado de verificación (alta, genérico, walletLogin)
 *              - Consulta de sesión de verificación
 *
 * @requires express
 * @requires src/controllers/verificationController
 */

const express = require("express");
const router = express.Router();
const {
  offerVerification,
  offerVerification3Creds,
  offerVerification3CredsAutomatic,
  statusCallbackAlta,
  statusCallback,
  statusCallbackWalletLogin,
  getVerificationSession,
} = require("../controllers/verificationController");

/**
 * @route POST /offer
 * @summary Solicita una oferta de verificación para una única credencial.
 * @param {import('express').Request} req
 *   - req.body: datos necesarios para la verificación (una credencial).
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { verificationUrl: string, state: string }
 * @returns Delegación al middleware global de errores.
 */
router.post("/offer", offerVerification);

/**
 * @route POST /offer3creds
 * @summary Solicita una oferta de verificación manual para tres credenciales.
 * @param {import('express').Request} req - no body requerido
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { verificationUrl: string, state: string }
 * @returns Delegación al middleware global de errores.
 */
router.post("/offer3creds", offerVerification3Creds);

/**
 * @route POST /offer3credsAuto
 * @summary Solicita una oferta de verificación automática para tres credenciales.
 * @param {import('express').Request} req - no body requerido
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { message: string, state: string, verificationUrl: string }
 * @returns Delegación al middleware global de errores.
 */
router.post("/offer3credsAuto", offerVerification3CredsAutomatic);

/**
 * @route POST /statusCallbackAlta/:stateId
 * @summary Recibe el callback de estado para la oferta de verificación de alta.
 * @param {import('express').Request} req
 *   - req.params.stateId: identificador de la sesión de verificación.
 *   - req.body: datos de callback enviados por el verificador.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} Texto de confirmación.
 * @returns Delegación al middleware global de errores.
 */
router.post("/statusCallbackAlta/:stateId", statusCallbackAlta);

/**
 * @route POST /statusCallback/:stateId
 * @summary Recibe el callback genérico de estado para una verificación de una credencial.
 * @param {import('express').Request} req
 *   - req.params.stateId: identificador de la sesión de verificación.
 *   - req.body: datos de callback.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { message: string }
 * @returns Delegación al middleware global de errores.
 */
router.post("/statusCallback/:stateId", statusCallback);

/**
 * @route POST /statusCallbackWalletLogin/:stateId
 * @summary Recibe el callback de estado tras wallet login en verificación.
 * @param {import('express').Request} req
 *   - req.params.stateId: identificador de la sesión.
 *   - req.body: datos de callback.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} { message: string, status: string }
 * @returns Delegación al middleware global de errores.
 */
router.post("/statusCallbackWalletLogin/:stateId", statusCallbackWalletLogin);

/**
 * @route GET /session/:stateId
 * @summary Consulta el estado actual de una sesión de verificación.
 * @param {import('express').Request} req
 *   - req.params.stateId: identificador de la sesión.
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} Objeto con información de la sesión de verificación.
 * @returns Delegación al middleware global de errores.
 */
router.get("/session/:stateId", getVerificationSession);

module.exports = router;
