// src/routes/issuanceRoutes.js
const express = require('express');
const router = express.Router();
const {
    offerIssuance,
    issuanceStatusCallback,
    getIssuanceSessionStatus
} = require('../controllers/issuanceController');

router.post('/offer', offerIssuance);
router.post('/statusCallback/:stateId', issuanceStatusCallback);
router.get('/session/:stateId', getIssuanceSessionStatus);

module.exports = router;
