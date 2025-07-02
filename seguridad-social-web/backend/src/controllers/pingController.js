/**
 * @module src/controllers/pingController
 * @description Controlador para responder a la comprobación de disponibilidad del servicio.
 */

/**
 * Controlador de endpoint de ping.
 *
 * @function pingController
 * @param {import('express').Request} req - Objeto de petición de Express (no utilizado).
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 *
 * @description
 *   - Responde con el texto `"pong"` para indicar que el servidor está activo.
 *
 * @returns {void}
 */
module.exports = (req, res) => {
  res.send("pong");
};
