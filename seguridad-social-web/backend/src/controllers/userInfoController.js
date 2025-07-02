/**
 * @module src/controllers/userInfoController
 * @description Controlador para obtener la información del usuario Holder asociado a la wallet.
 *
 * @requires ../../logger
 * @requires ../services/userService~getHolderUserInfo
 */

const logger = require("../../logger");
const userService = require("../services/userService");

module.exports = {
  /**
   * Obtiene la información del usuario Holder desde la wallet.
   *
   * @async
   * @function getUserInfo
   * @param {import('express').Request} _req - Objeto de petición de Express (no utilizado).
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra en el logger el inicio de la operación.  
   *   2. Llama a {@link module:src/services/userService.getHolderUserInfo|getHolderUserInfo}  
   *      para obtener los datos del usuario Holder asociados a la wallet.  
   *   3. Devuelve la información obtenida con código 200 en formato JSON.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   *   - `res.status(200).json(walletInfo)` en caso de éxito.  
   *   - `next(error)` para errores imprevistos.
   */
  async getUserInfo(_req, res, next) {
    try {
      logger.debug("[userInfoController] getUserInfo - start");
      const walletInfo = await userService.getHolderUserInfo();
      return res.status(200).json(walletInfo);
    } catch (error) {
      logger.error(
        "[userInfoController] Error obtaining Holder user info:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
