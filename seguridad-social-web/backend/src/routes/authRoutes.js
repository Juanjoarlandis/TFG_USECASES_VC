// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/wallet-login', authRateLimiter, authController.walletLogin);
router.post('/refresh', authRateLimiter, authController.refresh);

module.exports = router;
