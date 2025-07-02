/**
 * @module src/routes/revocationRoutes
 * @description Define la ruta para revocar credenciales de identidad mediante DNI.
 *
 * @requires express
 * @requires src/controllers/revocationController~revokeCredential
 */

const express = require("express");
const router = express.Router();
const { revokeCredential } = require("../controllers/revocationController");

/**
 * @route POST /credencial
 * @summary Revoca una credencial asociada al DNI del usuario.
 * @param   {import('express').Request}      req   - Debe incluir en <code>req.body.dni</code> el número de identificación del usuario.
 * @param   {import('express').Response}     res   - Respuesta de Express.
 * @param   {import('express').NextFunction} next  - Siguiente middleware de manejo de errores.
 * @returns {200} { message: string, user: object } - Objeto con mensaje de éxito y datos del usuario afectado.
 * @returns {400} { error: string }                - Cuando falta el campo <code>dni</code> en el body.
 * @returns {default} Delegación al middleware de error global para otros errores.
 */
router.post("/credencial", revokeCredential);

module.exports = router;
