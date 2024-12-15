// server/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { verifyRefreshToken, generateTokens } = require('../utils/jwtUtils');
const User = require('../models/User');

router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'No refresh token provided' });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(refreshToken);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = await User.findById(decoded.sub);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verificamos que el refreshToken esté en su lista
        if (!user.refreshTokens.includes(refreshToken)) {
            return res.status(401).json({ error: 'Refresh token not recognized' });
        }

        // Generar nuevo par de tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id.toString());
        // Reemplazar el refresh token viejo por uno nuevo si se quiere, o mantener ambos.
        // Aqui removemos el viejo y agregamos el nuevo
        user.refreshTokens = user.refreshTokens.filter(rt => rt !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        return res.status(200).json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
