/**
 * @module src/middleware/authMiddleware
 * @description Middleware de autenticación que verifica la existencia y validez
 *              de un JWT en la cookie `accessToken`.  
 *              - Si no existe la cookie → responde 401 Unauthorized.  
 *              - Si existe, verifica la firma JWT e inyecta `req.user` con el `sub` del token.
 *
 * @requires ../utils/jwtUtils~verifyAccessToken
 */

const { verifyAccessToken } = require('../utils/jwtUtils');

/**
 * Middleware que protege rutas comprobando el token de acceso en cookies.
 *
 * @function authMiddleware
 * @param {import('express').Request} req   - Objeto de petición de Express.
 *                                             Debe contener `req.cookies.accessToken`.
 * @param {import('express').Response} res  - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar al siguiente middleware.
 *
 * @description
 *   1. Extrae el token JWT de la cookie `accessToken`.  
 *   2. Si no existe, responde con 401 y mensaje de error.  
 *   3. Verifica la firma y validez del token usando {@link module:src/utils/jwtUtils.verifyAccessToken|verifyAccessToken}.  
 *   4. Si es válido, inyecta en `req.user` un objeto `{ id: decoded.sub }` y llama a `next()`.  
 *   5. Si la verificación falla, responde con 401 y mensaje de token inválido.
 *
 * @returns {void}
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
