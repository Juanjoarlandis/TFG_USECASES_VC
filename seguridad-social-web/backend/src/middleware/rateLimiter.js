/**
 * @file rateLimiter.js
 * @description Implements rate limiting middleware for Express endpoints using express-rate-limit.
 * This module defines an example rate limiter for the /auth/wallet-login endpoint, limiting requests to 5 per minute.
 * @module middleware/rateLimiter
 */

const rateLimit = require('express-rate-limit');
const logger = require('../../logger');

/**
 * Rate limiter middleware for the /auth/wallet-login endpoint.
 *
 * Limits the number of requests to 5 per minute from a single IP address.
 * When the limit is exceeded, a warning is logged and a 429 status code is returned with an error message.
 *
 * @constant {import('express-rate-limit').RateLimit}
 */
const authRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,              // Maximum 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, _next, options) => {
        logger.warn(`[RateLimit] IP=${req.ip} exceeded ${options.max} attempts on /auth/wallet-login.`);
        return res.status(options.statusCode).json({
            error: 'You have exceeded the number of login attempts. Please try again later.'
        });
    }
});

module.exports = { authRateLimiter };
