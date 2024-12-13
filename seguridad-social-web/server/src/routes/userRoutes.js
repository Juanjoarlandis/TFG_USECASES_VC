// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUserByDni } = require('../controllers/userController');

router.get('/:dni', getUserByDni);

module.exports = router;
