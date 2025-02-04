/**
 * @file corsConfig.js
 * @description Configures Cross-Origin Resource Sharing (CORS) for the application.
 * This middleware restricts origins based on the NODE_ENV environment variable.
 * @module middleware/corsConfig
 */

const cors = require('cors');

// Define allowed origins based on the environment.
// In production, update the array with the actual domain(s).
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://tudominio.com'] // Replace with your actual production domain(s)
    : ['https://localhost'];

/**
 * CORS middleware configuration.
 *
 * Allows requests from specified origins with the HTTP methods GET, POST, PUT, DELETE.
 * Also allows credentials (cookies, authorization headers, TLS client certificates).
 *
 * @constant {import('cors').CorsRequestHandler}
 */
module.exports = cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
});
