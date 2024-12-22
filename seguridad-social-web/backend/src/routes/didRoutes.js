// src/routes/didRoutes.js
const express = require('express');
const { listDIDs } = require('../controllers/didController');

const router = express.Router();

router.get('/dids', listDIDs);

module.exports = router;
