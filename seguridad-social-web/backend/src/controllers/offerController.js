/**
 * @module src/controllers/offerController
 * @description Controlador para gestionar el uso de ofertas de credenciales.
 *
 * @requires ../services/offerService
 * @requires ../../logger
 */

const offerService = require("../services/offerService");
const logger = require("../../logger");

module.exports = {
  /**
   * Procesa el uso de una oferta de credencial proporcionada por URL.
   *
   * @async
   * @function useCredentialOffer
   * @param {import('express').Request} req - Objeto de petición de Express.
   *   Debe incluir en `req.body`:
   *   - `offerUrl` {string}: URL de la oferta de credencial.
   *   - `did` {string}: Identificador descentralizado (DID) del holder.
   * @param {import('express').Response} res - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar el manejo de errores.
   *
   * @description
   *   1. Registra en el logger el contenido de `req.body`.  
   *   2. Valida que existan `offerUrl` y `did`; si falta alguno, responde con código 400.  
   *   3. Llama a {@link module:src/services/offerService.useCredentialOffer|offerService.useCredentialOffer}  
   *      pasando `offerUrl` y `did`.  
   *   4. Devuelve la respuesta con los datos obtenidos y código 200.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega el error al middleware global.
   *
   * @returns {Promise<import('express').Response|void>}
   */
  async useCredentialOffer(req, res, next) {
    try {
      const { offerUrl, did } = req.body;
      logger.debug("[offerController] useCredentialOffer - body:", req.body);

      if (!offerUrl || !did) {
        return res.status(400).json({ error: "Missing offerUrl or did" });
      }

      const data = await offerService.useCredentialOffer(offerUrl, did);
      return res.status(200).json(data);
    } catch (error) {
      logger.error(
        "[offerController] Error using credential offer:",
        error.message
      );
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
