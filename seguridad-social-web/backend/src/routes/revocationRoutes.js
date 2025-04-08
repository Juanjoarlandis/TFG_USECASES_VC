// src/routes/revocationRoutes.js
const express = require("express");
const router = express.Router();
const { revokeCredential } = require("../controllers/revocationController");

router.post("/credencial", revokeCredential);

module.exports = router;
