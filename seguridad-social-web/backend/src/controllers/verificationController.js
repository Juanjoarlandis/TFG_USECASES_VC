/**
 * @module src/controllers/verificationController
 * @description Controlador para gestionar el flujo de verificación de credenciales:
 *              - Oferta de verificación para 1 credencial
 *              - Oferta de verificación automática para 3 credenciales
 *              - Oferta de verificación manual para 3 credenciales
 *              - Callbacks de estado (alta, genérico, walletLogin)
 *              - Consulta de sesión de verificación
 *
 * @requires ../../logger
 * @requires ../services/verificationService
 */

const logger = require("../../logger");
const verificationService = require("../services/verificationService");

module.exports = {
  /**
   * Genera una oferta de verificación para una única credencial.
   *
   * @async
   * @function offerVerification
   * @param {import('express').Request} req  - Objeto de petición de Express.  
   *   Debe incluir en `req.body` los datos necesarios para la verificación de 1 credencial.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Llama a {@link module:src/services/verificationService.offerVerificationOneCred|verificationService.offerVerificationOneCred}  
   *      pasando `req.body`.  
   *   3. Devuelve un objeto con `verificationUrl` y `state` (stateId) con código 200.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async offerVerification(req, res, next) {
    try {
      logger.debug("[verificationController] offerVerification - start");
      const result = await verificationService.offerVerificationOneCred(req.body);
      return res.status(200).json({
        verificationUrl: result.verificationUrl,
        state: result.stateId,
      });
    } catch (error) {
      logger.error("[verificationController] Error en offerVerification:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Genera una oferta de verificación automática para tres credenciales.
   *
   * @async
   * @function offerVerification3CredsAutomatic
   * @param {import('express').Request} req  - Objeto de petición de Express (no lleva body).
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Llama a {@link module:src/services/verificationService.offerVerification3CredsAutomatic|verificationService.offerVerification3CredsAutomatic}.  
   *   3. Devuelve el resultado completo (message, state, verificationUrl) con código 200.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async offerVerification3CredsAutomatic(req, res, next) {
    try {
      logger.debug("[verificationController] offerVerification3CredsAutomatic - start");
      const result = await verificationService.offerVerification3CredsAutomatic();
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[verificationController] Error en offerVerification3CredsAutomatic:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Genera una oferta de verificación manual para tres credenciales.
   *
   * @async
   * @function offerVerification3Creds
   * @param {import('express').Request} req  - Objeto de petición de Express (no lleva body).
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Llama a {@link module:src/services/verificationService.offerVerification3CredsManual|verificationService.offerVerification3CredsManual}.  
   *   3. Devuelve un objeto con `verificationUrl` y `state` (stateId) con código 200.  
   *   4. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async offerVerification3Creds(req, res, next) {
    try {
      logger.debug("[verificationController] offerVerification3Creds - start");
      const result = await verificationService.offerVerification3CredsManual();
      return res.status(200).json({
        verificationUrl: result.verificationUrl,
        state: result.stateId,
      });
    } catch (error) {
      logger.error("[verificationController] Error en offerVerification3Creds:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Callback para el estado de verificación de alta.
   *
   * @async
   * @function statusCallbackAlta
   * @param {import('express').Request} req  - Objeto de petición de Express.  
   *   Debe incluir `req.params.stateId` y el body con datos de verificación.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Extrae `stateId` de `req.params` y el body.  
   *   3. Llama a {@link module:src/services/verificationService.handleStatusCallbackAlta|verificationService.handleStatusCallbackAlta}  
   *      para procesar los datos.  
   *   4. Devuelve un mensaje de éxito con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async statusCallbackAlta(req, res, next) {
    try {
      logger.debug("[verificationController] statusCallbackAlta - start");
      const { stateId } = req.params;
      const verificationData = req.body;
      await verificationService.handleStatusCallbackAlta(stateId, verificationData);
      return res.status(200).send("Status callback alta processed successfully");
    } catch (error) {
      logger.error("[verificationController] Error en statusCallbackAlta:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Callback genérico para el estado de verificación de una credencial.
   *
   * @async
   * @function statusCallback
   * @param {import('express').Request} req  - Objeto de petición de Express.  
   *   Debe incluir `req.params.stateId` y `req.body` con datos de estado.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Extrae `stateId` de `req.params`.  
   *   3. Llama a {@link module:src/services/verificationService.handleStatusCallbackGeneric|verificationService.handleStatusCallbackGeneric}  
   *      con `stateId` y `req.body`.  
   *   4. Devuelve un mensaje de éxito con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async statusCallback(req, res, next) {
    try {
      logger.debug("[verificationController] statusCallback - start");
      const { stateId } = req.params;
      await verificationService.handleStatusCallbackGeneric(stateId, req.body);
      return res.status(200).json({ message: "statusCallback processed successfully" });
    } catch (error) {
      logger.error("[verificationController] Error en statusCallback:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Callback especial para estado de verificación tras wallet login.
   *
   * @async
   * @function statusCallbackWalletLogin
   * @param {import('express').Request} req  - Objeto de petición de Express.  
   *   Debe incluir `req.params.stateId` y `req.body` con datos de estado.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Extrae `stateId` de `req.params`.  
   *   3. Llama a {@link module:src/services/verificationService.handleStatusCallbackWalletLogin|verificationService.handleStatusCallbackWalletLogin}  
   *      con `stateId` y `req.body`.  
   *   4. Consulta el estado actualizado via {@link module:src/services/verificationService.getVerificationSession|verificationService.getVerificationSession}.  
   *   5. Devuelve un objeto con mensaje y estado con código 200.  
   *   6. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async statusCallbackWalletLogin(req, res, next) {
    try {
      logger.debug("[verificationController] statusCallbackWalletLogin - start");
      const { stateId } = req.params;
      await verificationService.handleStatusCallbackWalletLogin(stateId, req.body);

      const updated = await verificationService.getVerificationSession(stateId);
      return res.status(200).json({
        message: "statusCallbackWalletLogin processed",
        status: updated.status,
      });
    } catch (error) {
      logger.error("[verificationController] Error en statusCallbackWalletLogin:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Obtiene la información de la sesión de verificación.
   *
   * @async
   * @function getVerificationSession
   * @param {import('express').Request} req  - Objeto de petición de Express.  
   *   Debe incluir `req.params.stateId`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra el inicio de la operación en el logger.  
   *   2. Extrae `stateId` de `req.params`.  
   *   3. Llama a {@link module:src/services/verificationService.getVerificationSession|verificationService.getVerificationSession}.  
   *   4. Devuelve la información de la sesión con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async getVerificationSession(req, res, next) {
    try {
      logger.debug("[verificationController] getVerificationSession - start");
      const { stateId } = req.params;
      const sessionInfo = await verificationService.getVerificationSession(stateId);
      return res.status(200).json(sessionInfo);
    } catch (error) {
      logger.error("[verificationController] Error en getVerificationSession:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
