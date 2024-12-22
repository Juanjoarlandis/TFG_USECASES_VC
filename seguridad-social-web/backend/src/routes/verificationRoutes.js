// src/routes/verificationRoutes.js
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

router.post('/offer', offerVerification);
router.post('/offer3creds', offerVerification3Creds);
router.post('/offer3credsAuto', offerVerification3CredsAutomatic);
router.post('/statusCallbackAlta/:stateId', statusCallbackAlta);
router.post('/statusCallback/:stateId', statusCallback);
router.post('/statusCallbackWalletLogin/:stateId', statusCallbackWalletLogin);
router.get('/session/:stateId', getVerificationSession);


module.exports = router;
