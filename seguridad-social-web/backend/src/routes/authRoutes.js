/**
 * @file authRoutes.js
 * @description Defines authentication-related routes for the application.
 * Routes include wallet login (with rate limiting) and token refresh.
 * @module routes/authRoutes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter } = require('../middleware/rateLimiter');

/**
 * @route POST /auth/wallet-login
 * @description Handles wallet login requests.
 * Applies rate limiting to protect against excessive login attempts.
 */
router.post('/wallet-login', authRateLimiter, authController.walletLogin);

/**
 * @route POST /auth/refresh
 * @description Handles token refresh requests.
 * This endpoint is used to refresh access and refresh tokens.
 */
router.post('/refresh', authController.refresh);

module.exports = router;
