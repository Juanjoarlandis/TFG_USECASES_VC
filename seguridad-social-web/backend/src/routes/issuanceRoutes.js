const express = require('express');
const router = express.Router();
const {
    offerIssuance,
    issuanceStatusCallback,
    getIssuanceSessionStatus,
    claimAltaCredential
} = require('../controllers/issuanceController');

// 1) Para la oferta (issueOffer)
router.post('/offerIssuance', offerIssuance);

// 2) Callback del issuer
router.post('/statusCallback/:stateId', issuanceStatusCallback);

// 3) Consultar el status de la issuance
router.get('/session/:stateId', getIssuanceSessionStatus);

// 4) Reclamar la credencial
router.post('/claimAltaCredential', claimAltaCredential);

module.exports = router;
