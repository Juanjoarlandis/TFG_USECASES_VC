/**
 * @module src/routes/issuanceRoutes
 * @description Define las rutas para el flujo de emisión de credenciales:
 *              - Solicitar oferta de emisión
 *              - Procesar callback de estado
 *              - Consultar estado de la sesión de emisión
 *              - Reclamar la credencial de alta
 *
 * @requires express
 * @requires src/controllers/issuanceController
 */

const express = require("express");
const router = express.Router();
const {
  offerIssuance,
  issuanceStatusCallback,
  getIssuanceSessionStatus,
  claimAltaCredential,
} = require("../controllers/issuanceController");

/**
 * @route POST /offerIssuance
 * @summary Solicita una oferta de emisión de credencial para un flujo dado.
 * @param   {import('express').Request}       req   - Debe incluir en <code>req.body.stateId</code> el identificador del flujo.
 * @param   {import('express').Response}      res   - Respuesta de Express.
 * @param   {import('express').NextFunction}  next  - Siguiente middleware de error.
 * @returns {200} {object} result              - Datos de la oferta de emisión.
 * @returns {400} {error: string}              - Cuando falta <code>stateId</code>.
 */
router.post("/offerIssuance", offerIssuance);

/**
 * @route POST /statusCallback/:stateId
 * @summary Recibe el callback de estado desde el issuer para una emisión en curso.
 * @param   {import('express').Request}       req   - Debe incluir <code>req.params.stateId</code>.
 * @param   {import('express').Response}      res   - Respuesta de Express.
 * @param   {import('express').NextFunction}  next  - Siguiente middleware de error.
 * @returns {200} {message: string}           - Mensaje de éxito al procesar el callback.
 */
router.post("/statusCallback/:stateId", issuanceStatusCallback);

/**
 * @route GET /session/:stateId
 * @summary Consulta el estado actual de una sesión de emisión.
 * @param   {import('express').Request}       req   - Debe incluir <code>req.params.stateId</code>.
 * @param   {import('express').Response}      res   - Respuesta de Express.
 * @param   {import('express').NextFunction}  next  - Siguiente middleware de error.
 * @returns {200} {issuanceStatus: any}       - Objeto con el estado de la sesión.
 * @returns {400} {error: string}             - Cuando falta <code>stateId</code>.
 */
router.get("/session/:stateId", getIssuanceSessionStatus);

/**
 * @route POST /claimAltaCredential
 * @summary Reclama la credencial de alta una vez generada la oferta.
 * @param   {import('express').Request}       req   - Debe incluir en <code>req.body.stateId</code> el identificador del flujo.
 * @param   {import('express').Response}      res   - Respuesta de Express.
 * @param   {import('express').NextFunction}  next  - Siguiente middleware de error.
 * @returns {200} {object} result              - Datos de la credencial reclamada.
 * @returns {400} {error: string}              - Cuando falta <code>stateId</code>.
 */
router.post("/claimAltaCredential", claimAltaCredential);

module.exports = router;
