/**
 * @file issuanceRoutes.js
 * @description Defines routes for credential issuance operations.
 * This module provides endpoints for offering an issuance, processing issuance status callbacks,
 * retrieving issuance session status, and claiming a credential.
 * @module routes/issuanceRoutes
 */

const express = require('express');
const router = express.Router();
const {
    offerIssuance,
    issuanceStatusCallback,
    getIssuanceSessionStatus,
    claimAltaCredential
} = require('../controllers/issuanceController');

/**
 * @route POST /issuance/offerIssuance
 * @description Initiates a credential issuance offer.
 */
router.post('/offerIssuance', offerIssuance);

/**
 * @route POST /issuance/statusCallback/:stateId
 * @description Endpoint for handling issuance status callbacks from the issuer.
 */
router.post('/statusCallback/:stateId', issuanceStatusCallback);

/**
 * @route GET /issuance/session/:stateId
 * @description Retrieves the current status of a credential issuance session.
 */
router.get('/session/:stateId', getIssuanceSessionStatus);

/**
 * @route POST /issuance/claimAltaCredential
 * @description Claims the issued credential.
 */
router.post('/claimAltaCredential', claimAltaCredential);

module.exports = router;
