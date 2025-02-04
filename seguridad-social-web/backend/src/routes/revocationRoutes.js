/**
 * @file revocationRoutes.js
 * @description Defines routes for credential revocation operations.
 * This module provides an endpoint for revoking a credential.
 * @module routes/revocationRoutes
 */

const express = require('express');
const router = express.Router();
const { revokeCredential } = require('../controllers/revocationController');

/**
 * @route POST /revocar/credencial
 * @description Revokes a credential by marking it as revoked in the database
 * and removing it from the wallet.
 */
router.post('/credencial', revokeCredential);

module.exports = router;
