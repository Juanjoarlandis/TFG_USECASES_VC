/**
 * @module src/controllers/didController
 * @description Controlador para gestionar operaciones relacionadas con DIDs
 *              (Decentralized Identifiers): listado de identificadores descentralizados.
 *
 * @requires ../../logger
 * @requires ../services/HolderSessionManager
 * @requires ../services/walletService~listDIDs
 */

const logger = require("../../logger");
const HolderSessionManager = require("../services/HolderSessionManager");
const { listDIDs } = require("../services/walletService");

module.exports = {
  /**
   * Lista todos los DIDs asociados a la wallet del holder.
   *
   * @async
   * @function listDIDs
   * @param {import('express').Request} _req - Objeto de petición de Express (no utilizado).
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Obtiene el token de autenticación y el walletId desde {@link module:src/services/HolderSessionManager|HolderSessionManager}.  
   *   2. Llama a {@link module:src/services/walletService.listDIDs|walletService.listDIDs} pasando el token y walletId.  
   *   3. Devuelve el array de DIDs en la respuesta con código 200.
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      de lo contrario delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   *   - `res.status(200).json(dids)` en caso de éxito.  
   *   - `res.status(error.status).json({ error: error.message })` para errores con código.  
   *   - `next(error)` para errores no manejados explícitamente.
   */
  async listDIDs(_req, res, next) {
    try {
      logger.debug("[didController] listDIDs - start");

      // 1) Obtener token y walletId desde el gestor de sesión del holder
      const token = await HolderSessionManager.getToken();
      const walletId = HolderSessionManager.getWalletId();

      // 2) Llamar al servicio para obtener los DIDs
      const dids = await listDIDs(token, walletId);

      // 3) Devolver la respuesta con el listado de DIDs
      return res.status(200).json(dids);
    } catch (error) {
      logger.error("[didController] Error obtaining DIDs:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
