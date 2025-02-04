/**
 * @file userController.js
 * @description Controller for handling user operations.
 * Provides endpoints for retrieving user data by document number (DNI).
 * @module controllers/userController
 */

const User = require('../models/User');

module.exports = {
    /**
     * Retrieves user information by DNI.
     *
     * This function finds a user by their document number provided as a URL parameter.
     * If the user exists, it returns a response with selected user fields.
     * Otherwise, it responds with a 404 error.
     *
     * @async
     * @function getUserByDni
     * @param {import('express').Request} req - Express request object with a `dni` parameter.
     * @param {import('express').Response} res - Express response object.
     * @param {import('express').NextFunction} next - Express next middleware function.
     * @returns {Promise<void>} Sends a JSON response with the user data or an error message.
     */
    async getUserByDni(req, res, next) {
        try {
            const { dni } = req.params;
            const user = await User.findOne({ documentNumber: dni });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const userResponse = {
                firstName: user.firstName,
                familyName: user.familyName,
                documentNumber: user.documentNumber,
                gender: user.gender,
                nationality: user.nationality,
                birthDate: user.birthDate,
                nss: user.nss,
                photo: user.photo,
                hasAltaCredential: user.hasAltaCredential,
                altaIssueDate: user.altaIssueDate,
                altaCredentialData: user.altaCredentialData || null,
                flow: user.flow
            };

            return res.status(200).json({ user: userResponse });
        } catch (err) {
            next(err);
        }
    }
};
