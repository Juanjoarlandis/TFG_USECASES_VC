// src/routes/walletRoutes.js
const express = require('express');
const { getUserInfo } = require('../controllers/userInfoController');
const { listCredentials, getCredentialById, deleteCredential, acceptCredential, rejectCredential, getCredentialStatus } = require('../controllers/credentialsController');
const { useCredentialOffer } = require('../controllers/offerController');
const { resolvePresentationRequest, matchCredentialsForPresentation, usePresentationRequest } = require('../controllers/presentationController');
const ping = require('../controllers/pingController'); // Un controlador ping sencillo

const router = express.Router();

// Ping
router.get('/ping', ping);

// Info del Holder
router.get('/user-info', getUserInfo);

// Credenciales
router.get('/credentials', listCredentials);
router.get('/credentials/:id', getCredentialById);
router.delete('/credentials/:id', deleteCredential);

// Oferta de credenciales
router.post('/credential-offer', useCredentialOffer);

// Aceptar/Rechazar credenciales
router.post('/credentials/:id/accept', acceptCredential);
router.post('/credentials/:id/reject', rejectCredential);

// Estado de credencial
router.get('/credentials/:id/status', getCredentialStatus);

// Presentación de credenciales
router.post('/resolve-presentation-request', resolvePresentationRequest);
router.post('/match-credentials', matchCredentialsForPresentation);
router.post('/use-presentation-request', usePresentationRequest);

module.exports = router;
