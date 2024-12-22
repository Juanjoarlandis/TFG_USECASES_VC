const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/wallet-login', authController.walletLogin);
router.post('/refresh', authController.refresh);

module.exports = router;
