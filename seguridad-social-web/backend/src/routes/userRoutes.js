/**
 * @file userRoutes.js
 * @description Defines routes for user-related operations.
 * This module provides an endpoint for retrieving user information by document number (DNI).
 * @module routes/userRoutes
 */

const express = require('express');
const router = express.Router();
const { getUserByDni } = require('../controllers/userController');

/**
 * @route GET /user/:dni
 * @description Retrieves user information by document number (DNI).
 */
router.get('/:dni', getUserByDni);

module.exports = router;
