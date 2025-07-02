/**
 * @module src/middleware/corsConfig
 * @description Configuración de CORS para la API. Define los orígenes permitidos,
 *              métodos HTTP soportados y habilita el envío de credenciales (cookies).
 *
 * @requires cors
 */

const cors = require("cors");

/**
 * Lista de orígenes permitidos para CORS.
 * - En producción: dominio real de la aplicación.
 * - En desarrollo: localhost seguro.
 *
 * @constant {string[]}
 */
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://tudominio.com"]
    : ["https://localhost"];

/**
 * Middleware CORS preconfigurado.
 *
 * @type {import('cors').CorsOptions}
 * @description
 *   - <code>origin</code>: orígenes permitidos según la constante <code>allowedOrigins</code>.  
 *   - <code>methods</code>: métodos HTTP permitidos: GET, POST, PUT, DELETE.  
 *   - <code>credentials</code>: habilita el envío de cookies y credenciales.
 *
 * @returns {import('express').RequestHandler} Middleware para Express.
 */
module.exports = cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});
