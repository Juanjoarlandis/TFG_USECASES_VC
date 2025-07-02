/**
 * @module src/controllers/userController
 * @description Controlador para operaciones relacionadas con usuarios, específicamente
 *              la obtención de un usuario por su DNI.
 *
 * @requires ../services/userService
 * @requires ../../logger
 */

const userService = require("../services/userService");
const logger = require("../../logger");

module.exports = {
  /**
   * Obtiene un usuario a partir de su DNI.
   *
   * @async
   * @function getUserByDni
   * @param {import('express').Request} req   - Objeto de petición de Express.  
   *   Debe contener `req.params.dni` con el número de identificación.
   * @param {import('express').Response} res  - Objeto de respuesta de Express.
   * @param {import('express').NextFunction} next - Función para delegar al middleware de errores.
   *
   * @description
   *   1. Extrae `dni` de `req.params` y valida su presencia; si falta, responde con 400.  
   *   2. Llama a {@link module:src/services/userService.findUserByDni|userService.findUserByDni}  
   *      para buscar el usuario en la base de datos.  
   *   3. Si no se encuentra el usuario, responde con 404 y mensaje de error.  
   *   4. Si se encuentra, construye la respuesta con  
   *      {@link module:src/services/userService.buildUserResponse|userService.buildUserResponse}  
   *      y responde con código 200 y el objeto `{ user }`.  
   *   5. En caso de error con propiedad `status`, responde con ese código y mensaje;  
   *      en otro caso, delega al middleware global de manejo de errores.
   *
   * @returns {Promise<import('express').Response|void>}
   *   - `res.status(200).json({ user })` en caso de éxito.  
   *   - `res.status(400).json({ error: "Missing dni param" })` si falta el parámetro.  
   *   - `res.status(404).json({ error: "Usuario no encontrado" })` si no existe.  
   *   - `next(error)` para errores imprevistos.
   */
  async getUserByDni(req, res, next) {
    try {
      const { dni } = req.params;
      if (!dni) {
        return res.status(400).json({ error: "Missing dni param" });
      }

      const user = await userService.findUserByDni(dni);
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const userResponse = userService.buildUserResponse(user);
      return res.status(200).json({ user: userResponse });
    } catch (error) {
      logger.error("[userController] Error getUserByDni:", error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  },
};
