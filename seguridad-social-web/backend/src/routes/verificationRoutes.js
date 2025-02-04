/**
 * @file verificationRoutes.js
 * @description Defines routes for verification operations.
 * This module provides endpoints for initiating verification offers (both single credential and 3-credential flows),
 * handling various status callbacks, and retrieving verification session status.
 * @module routes/verificationRoutes
 */

const express = require('express');
const router = express.Router();
const {
    offerVerification,
    offerVerification3Creds,
    statusCallbackAlta,
    statusCallback,
    getVerificationSession,
    statusCallbackWalletLogin,
    offerVerification3CredsAutomatic
} = require('../controllers/verificationController');

/**
 * @route POST /verification/offer
 * @description Initiates a verification offer for a single credential.
 */
router.post('/offer', offerVerification);

/**
 * @route POST /verification/offer3creds
 * @description Initiates a manual verification offer requiring exactly 3 credentials.
 */
router.post('/offer3creds', offerVerification3Creds);

/**
 * @route POST /verification/offer3credsAuto
 * @description Initiates an automatic verification offer for exactly 3 credentials.
 */
router.post('/offer3credsAuto', offerVerification3CredsAutomatic);

/**
 * @route POST /verification/statusCallbackAlta/:stateId
 * @description Processes the status callback for a 3-credential (Alta) verification flow.
 */
router.post('/statusCallbackAlta/:stateId', statusCallbackAlta);

/**
 * @route POST /verification/statusCallback/:stateId
 * @description Processes a generic verification callback.
 */
router.post('/statusCallback/:stateId', statusCallback);

/**
 * @route POST /verification/statusCallbackWalletLogin/:stateId
 * @description Processes a verification callback for wallet login.
 */
router.post('/statusCallbackWalletLogin/:stateId', statusCallbackWalletLogin);

/**
 * @route GET /verification/session/:stateId
 * @description Retrieves the current status of a verification session.
 */
router.get('/session/:stateId', getVerificationSession);

module.exports = router;
