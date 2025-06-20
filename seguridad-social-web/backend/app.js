// app.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');

const corsConfig = require('./src/middleware/corsConfig');
const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const logger = require('./logger'); // Winston logger

const PORT = process.env.PORT || 3001;

async function main() {
    try {
        // 1) Conectamos a MongoDB
        await connectDB();

        // 2) Conectamos a Redis
        await connectRedis();

        // 3) Creamos la app de Express
        const app = express();
        app.set('trust proxy', 1);
        // 4) Middlewares
        app.use(corsConfig);
        app.use(express.json());
        app.use(compression());
        app.use(requestLogger);
        app.use(helmet());
        app.disable('x-powered-by');

        // 5) Rutas
        app.use(routes);

        // 6) Middleware de errores global
        app.use(errorHandler);

        // 7) Iniciar servidor
        app.listen(PORT, () => {
            logger.info(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error('Error al iniciar la aplicación:', err);
        process.exit(1);
    }
}

// Ejecutamos la función main
main();
