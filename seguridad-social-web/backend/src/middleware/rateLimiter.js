// src/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo de 10 peticiones en ese minuto
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true, // retorna las cabeceras RateLimit
  legacyHeaders: false,
});

module.exports = { authRateLimiter };
