/**
 * @module src/controllers/authController
 * @description Controlador para gestión de autenticación: login con wallet y refresco de tokens.
 *
 * @requires ../services/authService
 * @requires ../../logger
 */

const authService = require("../services/authService");
const logger = require("../../logger");

module.exports = {
  /**
   * Maneja el login del usuario autenticándose con credenciales de wallet.
   *
   * @async
   * @function walletLogin
   * @param {import('express').Request} req - Objeto de petición de Express.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que en el body exista `email` y `password`.  
   *   - Invoca {@link module:src/services/authService.loginAndVerifyIdentityCredential|authService.loginAndVerifyIdentityCredential} para autenticar y verificar la credencial de identidad en la wallet.  
   *   - Retorna código 200 con el resultado si todo es correcto.
   *   - Si falta `email` o `password`, responde 400 con mensaje de error.
   *   - Si la wallet no contiene la credencial de identidad (`IDENTITY_CRED_MISSING`), responde con el status y código adecuados (404 por defecto).
   *   - Para otros errores con propiedad `status`, responde con ese código y mensaje.
   *   - Para cualquier otro error, delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   *   - `res.status(200).json(result)` en caso de éxito.  
   *   - `res.status(400).json({ error })` si faltan credenciales.  
   *   - `res.status(404).json({ message, code })` si falta la credencial de identidad.  
   *   - `next(error)` para errores no manejados aquí.
   */
  async walletLogin(req, res, next) {
    try {
      logger.debug("POST /auth/wallet-login - inicio");
      const { email, password } = req.body;
      if (!email || !password) {
        logger.warn("[authController] Faltan email o password");
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const result = await authService.loginAndVerifyIdentityCredential(
        email,
        password,
      );
      logger.debug(
        "[authController] Login y verificación completados con éxito",
      );
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[authController] Error en walletLogin:", error.message);

      // ↳ Ausencia de CustomIdentityCredential en la wallet
      if (error.code === "IDENTITY_CRED_MISSING") {
        return res.status(error.status || 404).json({
          message: error.message,
          code: error.code
        });
      }

      // ↳ Otros errores que ya traen status propio
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      // ↳ Todo lo demás lo maneja el middleware global
      next(error);
    }
  },

  /**
   * Maneja el refresco de tokens de autenticación.
   *
   * @async
   * @function refresh
   * @param {import('express').Request} req - Objeto de petición de Express.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que en el body exista `refreshToken`.  
   *   - Invoca {@link module:src/services/authService.refreshTokens|authService.refreshTokens} para obtener nuevos tokens.  
   *   - Retorna código 200 con los nuevos tokens si todo es correcto.
   *   - Si no se proporciona `refreshToken`, responde 400 con mensaje de error.
   *   - Para errores con propiedad `status`, responde con ese código y mensaje.
   *   - Para cualquier otro error, delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   *   - `res.status(200).json(result)` en caso de éxito.  
   *   - `res.status(400).json({ error })` si falta el token de refresco.  
   *   - `next(error)` para errores no manejados aquí.
   */
  async refresh(req, res, next) {
    try {
      logger.debug("POST /auth/refresh - Refrescando token");
      const { refreshToken } = req.body;
      if (!refreshToken) {
        logger.warn("[authController] No se proporcionó refresh token");
        return res.status(400).json({ error: "No refresh token provided" });
      }

      const result = await authService.refreshTokens(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[authController] Error en refresh:", error.message);

      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }

      next(error);
    }
  },
};
