/**
 * @module src/controllers/issuanceController
 * @description Controlador para gestionar el flujo de emisión de credenciales:
 *              - Solicitar oferta de emisión
 *              - Procesar callback de estado de emisión
 *              - Consultar estado de la sesión de emisión
 *              - Reclamar la credencial de alta
 *
 * @requires ../../logger
 * @requires ../services/issuanceService
 */

const logger = require("../../logger");
const issuanceService = require("../services/issuanceService");

module.exports = {
  /**
   * Solicita una oferta de emisión de credencial para el estado proporcionado.
   *
   * @async
   * @function offerIssuance
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.body.stateId` el identificador del flujo de emisión.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar al siguiente middleware de errores.
   *
   * @description
   *   1. Registra en el logger el contenido de `req.body`.  
   *   2. Valida que `stateId` esté presente; si no, responde con código 400.  
   *   3. Llama a {@link module:src/services/issuanceService.offerIssuance|issuanceService.offerIssuance}  
   *      para generar la oferta de emisión.  
   *   4. Devuelve el resultado con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso delega el manejo al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async offerIssuance(req, res, next) {
    try {
      logger.debug("[offerIssuance] => BODY:", req.body);
      const { stateId } = req.body;
      if (!stateId) {
        return res.status(400).json({ error: "Missing stateId" });
      }
      const result = await issuanceService.offerIssuance(stateId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[offerIssuance] => Error:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Procesa el callback de estado enviado por el proveedor de emisión.
   *
   * @async
   * @function issuanceStatusCallback
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.params.stateId` el identificador del flujo de emisión.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar al siguiente middleware de errores.
   *
   * @description
   *   1. Registra en el logger los parámetros de ruta recibidos.  
   *   2. Llama a {@link module:src/services/issuanceService.handleIssuanceCallback|issuanceService.handleIssuanceCallback}  
   *      para procesar el callback.  
   *   3. Devuelve un mensaje de éxito con código 200.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async issuanceStatusCallback(req, res, next) {
    try {
      logger.debug("[issuanceStatusCallback] => params:", req.params);
      const { stateId } = req.params;
      await issuanceService.handleIssuanceCallback(stateId);
      return res
        .status(200)
        .json({ message: "Issuance callback processed successfully" });
    } catch (error) {
      logger.error("[issuanceStatusCallback] => Error:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Obtiene el estado actual de la sesión de emisión para un flujo dado.
   *
   * @async
   * @function getIssuanceSessionStatus
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.params.stateId` el identificador del flujo de emisión.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar al siguiente middleware de errores.
   *
   * @description
   *   1. Registra en el logger los parámetros de ruta recibidos.  
   *   2. Llama a {@link module:src/services/issuanceService.getIssuanceSessionStatus|issuanceService.getIssuanceSessionStatus}  
   *      con `stateId`.  
   *   3. Devuelve el objeto `{ issuanceStatus }` con código 200.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async getIssuanceSessionStatus(req, res, next) {
    try {
      logger.debug("[getIssuanceSessionStatus] => params:", req.params);
      const { stateId } = req.params;
      const issuanceStatus =
        await issuanceService.getIssuanceSessionStatus(stateId);
      return res.status(200).json({ issuanceStatus });
    } catch (error) {
      logger.error("[getIssuanceSessionStatus] => Error:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Permite al holder reclamar la credencial de alta tras recibir la oferta.
   *
   * @async
   * @function claimAltaCredential
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.body.stateId` el identificador del flujo de emisión.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar al siguiente middleware de errores.
   *
   * @description
   *   1. Registra en el logger el contenido de `req.body`.  
   *   2. Valida que `stateId` esté presente; si no, responde con código 400.  
   *   3. Llama a {@link module:src/services/issuanceService.claimAltaCredential|issuanceService.claimAltaCredential}  
   *      con `stateId`.  
   *   4. Devuelve el resultado con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async claimAltaCredential(req, res, next) {
    try {
      logger.debug("[claimAltaCredential] => BODY:", req.body);
      const { stateId } = req.body;
      if (!stateId) {
        return res.status(400).json({ error: "Missing stateId" });
      }
      const result = await issuanceService.claimAltaCredential(stateId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[claimAltaCredential] => Error:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
