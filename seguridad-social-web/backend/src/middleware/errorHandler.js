/**
 * @file errorHandler.js
 * @description Global error handling middleware for Express.
 * This middleware logs error details and returns a structured JSON response with error information.
 * It handles errors from various sources including Mongoose, Axios, and JWT.
 * @module middleware/errorHandler
 */

/**
 * Global error handler middleware.
 *
 * Logs error details (including time, original error, status code, and message) and sends a JSON response
 * with the error type and message. Additional error details (e.g., stack trace) are provided in non-production environments.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
module.exports = (err, req, res, next) => {
    console.error('--- Error Handler Log Start ---');
    console.error(`Time: ${new Date().toISOString()}`);
    console.error('Original Error:', err);

    // Set default values for status code, message, and error type.
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';
    let errorType = 'InternalServerError';

    // Handle Mongoose errors.
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Invalid data: ' + Object.values(err.errors).map(e => e.message).join(', ');
        errorType = 'ValidationError';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid format for parameter ${err.path}: ${err.value}`;
        errorType = 'CastError';
    } else if (err.code && err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue);
        message = `The field ${field} must be unique. Duplicate value: ${err.keyValue[field]}`;
        errorType = 'DuplicateKeyError';
    }

    // Handle errors from Axios (external service requests).
    if (err.isAxiosError) {
        statusCode = err.response && err.response.status ? err.response.status : 500;
        message = `External service error: ${err.message}`;
        errorType = 'ExternalServiceError';
    }

    // Handle JWT errors.
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        errorType = 'TokenExpiredError';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        errorType = 'JsonWebTokenError';
    }

    // If the error already defines a status, use it.
    if (err.status) {
        statusCode = err.status;
    }

    console.error('Status Code:', statusCode);
    console.error('Message:', message);
    console.error('--- Error Handler Log End ---');

    // Send the error response as JSON.
    res.status(statusCode).json({
        error: {
            type: errorType,
            message: message,
            // Include stack trace details if not in production.
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};
