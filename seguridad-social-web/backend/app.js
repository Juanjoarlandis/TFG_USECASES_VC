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
const logger = require('./logger');       // Winston

const PORT = process.env.PORT || 3001;

(async () => {
    try {
        await connectDB();
        await connectRedis();

        const app = express();
        app.set('trust proxy', 1);

        app.use(corsConfig);
        app.use(express.json());
        app.use(compression());
        app.use(requestLogger);
        app.use(helmet());
        app.disable('x-powered-by');

        // 🔗 todas las rutas (incluye /health)
        app.use(routes);

        // manejador de errores
        app.use(errorHandler);

        app.listen(PORT, () => logger.info(`Servidor escuchando en http://localhost:${PORT}`));
    } catch (err) {
        logger.error('Error al iniciar la aplicación:', err);
        process.exit(1);
    }
})();
