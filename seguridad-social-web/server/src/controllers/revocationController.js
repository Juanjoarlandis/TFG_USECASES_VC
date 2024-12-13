// src/controllers/revocationController.js
const User = require('../models/User');
const RevokedCredential = require('../models/RevokedCredential');

module.exports = {
    async revokeCredential(req, res, next) {
        try {
            const { dni } = req.body;
            const user = await User.findOne({ documentNumber: dni });
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            user.hasAltaCredential = false;
            user.altaIssueDate = null;
            user.altaCredentialData = null;
            await user.save();

            if (user.altaCredentialJti) {
                try {
                    await RevokedCredential.create({ credentialId: user.altaCredentialJti });
                } catch (e) {
                    if (e.code !== 11000) {
                        console.error('Error añadiendo a la lista negra:', e);
                    }
                }
            } else {
                console.warn('No se encontró altaCredentialJti en el usuario.');
            }

            return res.status(200).json({ message: 'Credencial revocada con éxito', user });
        } catch (err) {
            next(err);
        }
    }
};
