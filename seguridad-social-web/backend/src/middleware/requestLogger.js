/**
 * @module src/middleware/requestLogger
 * @description Middleware de logging de peticiones HTTP que registra en consola:
 *              - Timestamp ISO de la petición
 *              - Método y URL original
 *              - Cabeceras completas
 *              - Cuerpo de la petición (JSON formateado o "{}")
 */

/**
 * Registra detalles de la petición y continúa con el siguiente middleware.
 *
 * @function requestLogger
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware.
 *
 * @description
 *   1. Imprime en consola un bloque con:
 *      - Fecha y hora en ISO.
 *      - Método HTTP y ruta solicitada.
 *   2. Imprime las cabeceras de la petición.
 *   3. Imprime el cuerpo de la petición:
 *      - Si `req.body` tiene propiedades, lo formatea como JSON indentado.
 *      - En caso contrario, imprime `"{}"`.
 *   4. Invoca `next()` para continuar el flujo de middlewares/rutas.
 *
 * @returns {void}
 */
module.exports = (req, res, next) => {
  console.log(
    `\n[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`
  );
  console.log("Headers:", req.headers);
  console.log(
    "Body:",
    Object.keys(req.body).length > 0
      ? JSON.stringify(req.body, null, 2)
      : "{}"
  );
  next();
};
