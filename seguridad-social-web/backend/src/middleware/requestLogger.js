/**
 * @file requestLogger.js
 * @description Express middleware that logs incoming HTTP request details,
 * including the request method, URL, headers, and body.
 * Useful for debugging and monitoring requests.
 * @module middleware/requestLogger
 */

/**
 * Logs the HTTP method, URL, headers, and body of each incoming request.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 */
module.exports = (req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body:', Object.keys(req.body).length > 0 ? JSON.stringify(req.body, null, 2) : '{}');
    next();
};
