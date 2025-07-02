/**
 * @module src/routes/userRoutes
 * @description Define las rutas para operaciones de usuario, en particular obtener un usuario por su DNI.
 *
 * @requires express
 * @requires src/controllers/userController~getUserByDni
 */

const express = require("express");
const router = express.Router();
const { getUserByDni } = require("../controllers/userController");

/**
 * @route GET /:dni
 * @summary Obtiene un usuario a partir de su DNI
 * @param   {import('express').Request}      req   - Debe incluir en <code>req.params.dni</code> el número de documento del usuario.
 * @param   {import('express').Response}     res   - Respuesta de Express.  
 *                           - 200: `{ user: { ... } }` con la información del usuario.  
 *                           - 400: `{ error: "Missing dni param" }` si falta el parámetro.  
 *                           - 404: `{ error: "Usuario no encontrado" }` si no existe el usuario.  
 * @param   {import('express').NextFunction} next  - Siguiente middleware de manejo de errores.
 * @returns {Promise<import('express').Response|void>}
 */
router.get("/:dni", getUserByDni);

module.exports = router;
