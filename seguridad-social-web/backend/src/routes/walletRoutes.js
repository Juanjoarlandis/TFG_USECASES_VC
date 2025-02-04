/**
 * @file walletRoutes.js
 * @description Defines routes for wallet operations.
 * This module provides endpoints for ping, holder user info, credential management (list, retrieve, delete, accept, reject, status),
 * credential offers, and credential presentation operations.
 * @module routes/walletRoutes
 */

const express = require('express');
const { getUserInfo } = require('../controllers/userInfoController');
const {
    listCredentials,
    getCredentialById,
    deleteCredential,
    acceptCredential,
    rejectCredential,
    getCredentialStatus
} = require('../controllers/credentialsController');
const { useCredentialOffer } = require('../controllers/offerController');
const {
    resolvePresentationRequest,
    matchCredentialsForPresentation,
    usePresentationRequest
} = require('../controllers/presentationController');
const ping = require('../controllers/pingController');

const router = express.Router();

/**
 * @route GET /wallet-api/ping
 * @description Simple ping endpoint to check server health.
 */
router.get('/ping', ping);

/**
 * @route GET /wallet-api/user-info
 * @description Retrieves information about the authenticated holder.
 */
router.get('/user-info', getUserInfo);

/**
 * @route GET /wallet-api/credentials
 * @description Retrieves a list of credentials from the wallet.
 */
router.get('/credentials', listCredentials);

/**
 * @route GET /wallet-api/credentials/:id
 * @description Retrieves a specific credential by its ID.
 */
router.get('/credentials/:id', getCredentialById);

/**
 * @route DELETE /wallet-api/credentials/:id
 * @description Deletes a specific credential by its ID.
 */
router.delete('/credentials/:id', deleteCredential);

/**
 * @route POST /wallet-api/credential-offer
 * @description Uses a credential offer by sending it to the wallet.
 */
router.post('/credential-offer', useCredentialOffer);

/**
 * @route POST /wallet-api/credentials/:id/accept
 * @description Accepts a specific credential by its ID.
 */
router.post('/credentials/:id/accept', acceptCredential);

/**
 * @route POST /wallet-api/credentials/:id/reject
 * @description Rejects a specific credential by its ID.
 */
router.post('/credentials/:id/reject', rejectCredential);

/**
 * @route GET /wallet-api/credentials/:id/status
 * @description Retrieves the status of a specific credential by its ID.
 */
router.get('/credentials/:id/status', getCredentialStatus);

/**
 * @route POST /wallet-api/resolve-presentation-request
 * @description Resolves a presentation request.
 */
router.post('/resolve-presentation-request', resolvePresentationRequest);

/**
 * @route POST /wallet-api/match-credentials
 * @description Matches credentials for a given presentation definition.
 */
router.post('/match-credentials', matchCredentialsForPresentation);

/**
 * @route POST /wallet-api/use-presentation-request
 * @description Uses a presentation request to present selected credentials.
 */
router.post('/use-presentation-request', usePresentationRequest);

module.exports = router;
