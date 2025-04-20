// src/middleware/authMiddleware.js
const { verifyAccessToken } = require('../utils/jwtUtils');

/**
 * Middleware de autenticación basado en la cookie "accessToken".
 *  ⮑ Si no existe la cookie → 401.
 *  ⮑ Si existe, se verifica la firma JWT y se inyecta req.user.
 */
module.exports = function authMiddleware(req, res, next) {
    const token = req.cookies && req.cookies.accessToken;

    if (!token) {
        return res.status(401).json({ error: 'No token cookie' });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = { id: decoded.sub };
        return next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
