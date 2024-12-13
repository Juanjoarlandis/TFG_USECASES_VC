// src/routes/verificationRoutes.js
const express = require('express');
const router = express.Router();
const {
    offerVerification,
    offerVerification3Creds,
    statusCallbackAlta,
    statusCallback,
    getVerificationSession
} = require('../controllers/verificationController');

router.post('/offer', offerVerification);
router.post('/offer3creds', offerVerification3Creds);
router.post('/statusCallbackAlta/:stateId', statusCallbackAlta);
router.post('/statusCallback/:stateId', statusCallback);
router.get('/session/:stateId', getVerificationSession);

module.exports = router;
