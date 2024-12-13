// src/controllers/userController.js
const User = require('../models/User');

module.exports = {
    async getUserByDni(req, res, next) {
        try {
            const { dni } = req.params;
            const user = await User.findOne({ documentNumber: dni });
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const userResponse = {
                firstName: user.firstName,
                familyName: user.familyName,
                documentNumber: user.documentNumber,
                currentAddress: user.currentAddress,
                hasAltaCredential: user.hasAltaCredential,
                altaIssueDate: user.altaIssueDate,
                gender: user.gender,
                nationality: user.nationality,
                birthDate: user.birthDate,
                nss: user.nss,
                personalNumber: user.personalNumber,
                laserEngravedSerial: user.laserEngravedSerial,
                dniIssueDate: user.dniIssueDate,
                canNumber: user.canNumber,
                sex: user.sex,
                placeOfBirth: user.placeOfBirth,
                ascendants: user.ascendants,
                issuingTeamCode: user.issuingTeamCode,
                altaCredentialData: user.altaCredentialData || null
            };

            return res.status(200).json({ user: userResponse });
        } catch (err) {
            next(err);
        }
    }
};
