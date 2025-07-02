/**
 * @module src/controllers/presentationController
 * @description Controlador para gestionar el flujo de presentación de credenciales:
 *              - Resolución de solicitudes de presentación
 *              - Emparejamiento de credenciales con una definición de presentación
 *              - Uso (envío) de la solicitud de presentación seleccionada
 *
 * @requires ../../logger
 * @requires ../services/presentationService~resolvePresentationRequest
 * @requires ../services/presentationService~matchCredentialsForPresentation
 * @requires ../services/presentationService~usePresentationRequest
 */

const logger = require("../../logger");
const {
  resolvePresentationRequest,
  matchCredentialsForPresentation,
  usePresentationRequest,
} = require("../services/presentationService");

module.exports = {
  /**
   * Resuelve una solicitud de presentación a partir de una URL.
   *
   * @async
   * @function resolvePresentationRequest
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.body.presentationRequestUrl` la URL de la solicitud.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Valida que `presentationRequestUrl` esté presente; si no, responde 400.  
   *   2. Registra en el logger la URL recibida.  
   *   3. Llama a {@link module:src/services/presentationService.resolvePresentationRequest|resolvePresentationRequest}  
   *      para obtener los detalles de la solicitud de presentación.  
   *   4. Registra los datos obtenidos y los devuelve con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async resolvePresentationRequest(req, res, next) {
    try {
      const { presentationRequestUrl } = req.body;
      if (!presentationRequestUrl) {
        return res
          .status(400)
          .json({ error: "Missing presentationRequestUrl" });
      }

      logger.debug(
        `[presentationController] resolvePresentationRequest => ${presentationRequestUrl}`
      );
      const data = await resolvePresentationRequest(presentationRequestUrl);
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error resolving presentation request:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Empareja credenciales disponibles con una definición de presentación.
   *
   * @async
   * @function matchCredentialsForPresentation
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.body.presentationDefinition` la definición de presentación.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Valida que `presentationDefinition` esté presente; si no, responde 400.  
   *   2. Registra en el logger la definición recibida.  
   *   3. Llama a {@link module:src/services/presentationService.matchCredentialsForPresentation|matchCredentialsForPresentation}  
   *      para obtener las credenciales que cumplen con la definición.  
   *   4. Registra los datos obtenidos y los devuelve con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async matchCredentialsForPresentation(req, res, next) {
    try {
      const { presentationDefinition } = req.body;
      if (!presentationDefinition) {
        return res
          .status(400)
          .json({ error: "Missing presentationDefinition" });
      }

      logger.debug(
        `[presentationController] matchCredentialsForPresentation => ${JSON.stringify(
          presentationDefinition
        )}`
      );
      const data = await matchCredentialsForPresentation(
        presentationDefinition
      );
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error matching credentials:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },

  /**
   * Procesa y envía la presentación de credenciales seleccionadas.
   *
   * @async
   * @function usePresentationRequest
   * @param {import('express').Request} req - Objeto de petición de Express.  
   *   Debe incluir en `req.body`:
   *   - `did` {string}: Identificador descentralizado del holder.  
   *   - `presentationRequest` {object}: Objeto de solicitud de presentación.  
   *   - `selectedCredentials` {Array<object>}: Credenciales elegidas para la presentación.  
   *   - `disclosures` {object} [opcional]: Información adicional a revelar.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Valida que `did`, `presentationRequest` y `selectedCredentials` estén presentes;  
   *      si falta alguno, responde 400 con mensaje de error.  
   *   2. Registra en el logger el DID y las credenciales seleccionadas.  
   *   3. Llama a {@link module:src/services/presentationService.usePresentationRequest|usePresentationRequest}  
   *      pasando los datos necesarios.  
   *   4. Registra los datos de respuesta y los devuelve con código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async usePresentationRequest(req, res, next) {
    try {
      const { did, presentationRequest, selectedCredentials, disclosures } =
        req.body;
      if (!did || !presentationRequest || !selectedCredentials) {
        return res
          .status(400)
          .json({
            error:
              "Missing did, presentationRequest or selectedCredentials",
          });
      }

      logger.debug(
        `[presentationController] usePresentationRequest => did=${did}, creds=${JSON.stringify(
          selectedCredentials
        )}`
      );
      const data = await usePresentationRequest(
        did,
        presentationRequest,
        selectedCredentials,
        disclosures
      );
      logger.debug(
        `[presentationController] data => ${JSON.stringify(data, null, 2)}`
      );
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[presentationController] Error using presentation request:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
