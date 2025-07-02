/**
 * @module src/controllers/credentialsController
 * @description Controlador para gestionar operaciones sobre credenciales de identidad:
 *              listado, obtención por ID, eliminación, aceptación, rechazo y consulta de estado.
 *
 * @requires ../../logger
 * @requires ../services/credentialsService
 */

const logger = require("../../logger");
const credentialsService = require("../services/credentialsService");

module.exports = {
  /**
   * Lista todas las credenciales disponibles.
   *
   * @async
   * @function listCredentials
   * @param {import('express').Request} _req - Objeto de petición (no se utiliza).
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Invoca {@link module:src/services/credentialsService.listCredentials|credentialsService.listCredentials}
   *     para obtener el array de credenciales.
   *   - Responde con código 200 y el array de credenciales en JSON.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async listCredentials(_req, res, next) {
    try {
      const creds = await credentialsService.listCredentials();
      return res.status(200).json(creds);
    } catch (error) {
      logger.error(
        "[credentialsController] Error listing credentials:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Obtiene una credencial por su identificador.
   *
   * @async
   * @function getCredentialById
   * @param {import('express').Request} req - Objeto de petición con `req.params.id`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que `req.params.id` esté presente; si no, responde 400.
   *   - Invoca {@link module:src/services/credentialsService.getCredentialById|credentialsService.getCredentialById}
   *     con el ID extraído de `req.params.id`.
   *   - Responde con código 200 y la credencial en JSON.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async getCredentialById(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const credential =
        await credentialsService.getCredentialById(credentialId);
      return res.status(200).json(credential);
    } catch (error) {
      logger.error(
        "[credentialsController] Error getting credential by ID:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Elimina una credencial por su identificador.
   *
   * @async
   * @function deleteCredential
   * @param {import('express').Request} req - Objeto de petición con `req.params.id`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que `req.params.id` esté presente; si no, responde 400.
   *   - Invoca {@link module:src/services/credentialsService.deleteCredential|credentialsService.deleteCredential}
   *     para eliminar la credencial.
   *   - Responde con código 200 y mensaje de éxito.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async deleteCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      await credentialsService.deleteCredential(credentialId);
      return res
        .status(200)
        .json("Credential deleted successfully");
    } catch (error) {
      logger.error(
        "[credentialsController] Error deleting credential:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Acepta (aprueba) una credencial pendiente.
   *
   * @async
   * @function acceptCredential
   * @param {import('express').Request} req - Objeto de petición con `req.params.id`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que `req.params.id` esté presente; si no, responde 400.
   *   - Invoca {@link module:src/services/credentialsService.acceptCredential|credentialsService.acceptCredential}
   *     para aceptar la credencial.
   *   - Responde con código 200 y el resultado de la operación.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async acceptCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const result = await credentialsService.acceptCredential(credentialId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error(
        "[credentialsController] Error accepting credential:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Rechaza (niega) una credencial pendiente.
   *
   * @async
   * @function rejectCredential
   * @param {import('express').Request} req - Objeto de petición con `req.params.id`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que `req.params.id` esté presente; si no, responde 400.
   *   - Invoca {@link module:src/services/credentialsService.rejectCredential|credentialsService.rejectCredential}
   *     para rechazar la credencial.
   *   - Responde con código 200 y el resultado de la operación.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async rejectCredential(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const result = await credentialsService.rejectCredential(credentialId);
      return res.status(200).json(result);
    } catch (error) {
      logger.error(
        "[credentialsController] Error rejecting credential:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Consulta el estado de una credencial.
   *
   * @async
   * @function getCredentialStatus
   * @param {import('express').Request} req - Objeto de petición con `req.params.id`.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para invocar el siguiente middleware de error.
   *
   * @description
   *   - Valida que `req.params.id` esté presente; si no, responde 400.
   *   - Invoca {@link module:src/services/credentialsService.getCredentialStatus|credentialsService.getCredentialStatus}
   *     para obtener el estado de la credencial.
   *   - Responde con código 200 y un objeto con la propiedad `status`.
   *   - En caso de error, si dispone de `error.status`, responde con ese código y mensaje;
   *     en otro caso delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async getCredentialStatus(req, res, next) {
    try {
      const credentialId = req.params.id;
      if (!credentialId) {
        return res.status(400).json({ error: "Missing credentialId" });
      }

      const statusObj =
        await credentialsService.getCredentialStatus(credentialId);
      return res.status(200).json(statusObj);
    } catch (error) {
      logger.error(
        "[credentialsController] Error getting credential status:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
