/**
 * @module src/utils/jwtUtils
 * @description Utilidades para generar y verificar JSON Web Tokens (JWT) de acceso y refresh.
 *
 * @requires jsonwebtoken
 */

const jwt = require("jsonwebtoken");

/**
 * Duración de validez del access token.
 * @constant {string}
 * @default
 */
const ACCESS_TOKEN_EXPIRATION = "15m";

/**
 * Duración de validez del refresh token.
 * @constant {string}
 * @default
 */
const REFRESH_TOKEN_EXPIRATION = "7d";

/**
 * Clave secreta para firmar access tokens.
 * @constant {string}
 * @default
 */
const JWT_SECRET = process.env.JWT_SECRET || "secret";

/**
 * Clave secreta para firmar refresh tokens.
 * @constant {string}
 * @default
 */
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

/**
 * Genera un par de tokens JWT: uno de acceso y uno de refresco.
 *
 * @function generateTokens
 * @param {string} userId - Identificador del usuario que se incluye como claim `sub`.
 * @returns {{ accessToken: string, refreshToken: string }} Objeto con los tokens generados:
 *  - accessToken: JWT con expiración definida por {@link ACCESS_TOKEN_EXPIRATION}.
 *  - refreshToken: JWT con expiración definida por {@link REFRESH_TOKEN_EXPIRATION}.
 */
function generateTokens(userId) {
  const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });
  return { accessToken, refreshToken };
}

/**
 * Verifica y decodifica un JWT de acceso.
 *
 * @function verifyAccessToken
 * @param {string} token - JWT de acceso a verificar.
 * @throws {JsonWebTokenError} Si el token es inválido.
 * @throws {TokenExpiredError} Si el token ha expirado.
 * @returns {object} Payload decodificado del token (contiene al menos la propiedad `sub`).
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Verifica y decodifica un JWT de refresco.
 *
 * @function verifyRefreshToken
 * @param {string} token - JWT de refresco a verificar.
 * @throws {JsonWebTokenError} Si el token es inválido.
 * @throws {TokenExpiredError} Si el token ha expirado.
 * @returns {object} Payload decodificado del token (contiene al menos la propiedad `sub`).
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = { generateTokens, verifyAccessToken, verifyRefreshToken };
