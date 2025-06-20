// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,      // 1 minuto
  max: 10,                      // 10 peticiones por ventana
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,        // cabeceras RateLimit
  legacyHeaders: false,
  trustProxy: true              // ← estamos detrás de Nginx / proxy
});

module.exports = { authRateLimiter };
