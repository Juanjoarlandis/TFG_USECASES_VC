// src/middleware/requestLogger.js
module.exports = (req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] Request: ${req.method} ${req.originalUrl}`);
    console.log('Headers:', req.headers);
    console.log('Body:', Object.keys(req.body).length > 0 ? JSON.stringify(req.body, null, 2) : '{}');
    next();
};
