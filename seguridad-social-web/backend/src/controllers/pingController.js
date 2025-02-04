/**
 * @file pingController.js
 * @description A simple health-check controller that responds with "pong".
 * @module controllers/pingController
 */

/**
 * Handles a ping request.
 *
 * This controller simply responds with a plain text "pong", which can be used to
 * verify that the server is running.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
module.exports = (req, res) => {
    res.send('pong');
};
