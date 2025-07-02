/**
 * @module src/middleware/rateLimiter
 * @description Middleware para limitar la tasa de peticiones en rutas de autenticación,
 *              previniendo ataques de fuerza bruta y abusos.  
 *              Configura un límite de máximo 10 peticiones por minuto.
 *
 * @requires express-rate-limit
 * @see {@link https://github.com/express-rate-limit/express-rate-limit|express-rate-limit}
 */

const rateLimit = require("express-rate-limit");

/**
 * Middleware de rate limiting para endpoints de autenticación.
 *
 * @constant {import('express-rate-limit').RateLimitRequestHandler} authRateLimiter
 * @description
 *   - <code>windowMs</code>: 1 minuto (60000 ms).  
 *   - <code>max</code>: hasta 10 peticiones por ventana.  
 *   - <code>message</code>: respuesta JSON en caso de superar el límite.  
 *   - <code>standardHeaders</code>: expone cabeceras RateLimit estándar.  
 *   - <code>legacyHeaders</code>: deshabilita cabeceras antiguas.  
 *   - <code>trustProxy</code>: habilita confiabilidad de cabeceras cuando hay proxy (Nginx, Heroku, etc.).
 */
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,      // 1 minuto
  max: 10,                      // 10 peticiones por ventana
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,        // cabeceras RateLimit estándar
  legacyHeaders: false,         // deshabilita cabeceras obsoletas
  trustProxy: true              // estamos detrás de un proxy (p.ej. Nginx)
});

module.exports = { authRateLimiter };
