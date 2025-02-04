/**
 * @file didRoutes.js
 * @description Defines routes related to Decentralized Identifiers (DIDs).
 * This module includes a route to list DIDs from the wallet.
 * @module routes/didRoutes
 */

const express = require('express');
const { listDIDs } = require('../controllers/didController');

const router = express.Router();

/**
 * @route GET /did/dids
 * @description Retrieves the list of DIDs.
 */
router.get('/dids', listDIDs);

module.exports = router;
