// src/middleware/corsConfig.js
const cors = require('cors');

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://tudominio.com'] // ajustar dominio real
    : ['http://localhost:3000'];

module.exports = cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
});
