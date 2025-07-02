/**
 * @module src/controllers/revocationController
 * @description Controlador para gestionar la revocación de credenciales de identidad.
 *
 * @requires ../services/revocationService
 * @requires ../../logger
 */

const revocationService = require("../services/revocationService");
const logger = require("../../logger");

module.exports = {
  /**
   * Revoca una credencial asociada al DNI proporcionado.
   *
   * @async
   * @function revokeCredential
   * @param {import('express').Request} req - Objeto de petición de Express.
   *   Debe incluir en `req.body.dni` el número de identificación.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra en el logger el DNI recibido.  
   *   2. Valida que `dni` esté presente en el body; si no, responde con estado 400.  
   *   3. Llama a {@link module:src/services/revocationService.revokeCredential|revocationService.revokeCredential}  
   *      para procesar la revocación.  
   *   4. Devuelve el resultado (objeto con `message` y `user`) con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      de lo contrario, delega el error al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async revokeCredential(req, res, next) {
    try {
      const { dni } = req.body;
      logger.debug(`[revocationController] revokeCredential - dni=${dni}`);
      if (!dni) {
        return res.status(400).json({ error: "Missing dni" });
      }

      const result = await revocationService.revokeCredential(dni);
      // result => { message, user }
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[revocationController] Error general:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
