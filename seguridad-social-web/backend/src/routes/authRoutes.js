/**
 * @module src/routes/authRoutes
 * @description Define las rutas de autenticación: login con wallet y refresco de tokens.
 *
 * @requires express
 * @requires src/controllers/authController
 * @requires src/middleware/rateLimiter
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authRateLimiter } = require("../middleware/rateLimiter");

/**
 * @route POST /wallet-login
 * @summary Autentica al usuario mediante credenciales de wallet y verifica su identidad.
 * @middleware authRateLimiter
 * @param {import('express').Request} req
 * @param {string} req.body.email - Email del usuario (requerido).
 * @param {string} req.body.password - Contraseña del usuario (requerido).
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} result - Objeto con tokens y datos de sesión.
 * @returns {400} { error: string } - Cuando falta email o password.
 * @returns {404} { message: string, code: string } - Cuando falta la credencial de identidad en la wallet.
 */
router.post("/wallet-login", authRateLimiter, authController.walletLogin);

/**
 * @route POST /refresh
 * @summary Refresca los tokens de autenticación utilizando un refresh token.
 * @middleware authRateLimiter
 * @param {import('express').Request} req
 * @param {string} req.body.refreshToken - Token de refresco (requerido).
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {200} result - Objeto con nuevos accessToken y refreshToken.
 * @returns {400} { error: string } - Cuando no se proporciona refreshToken.
 */
router.post("/refresh", authRateLimiter, authController.refresh);

module.exports = router;
