/**
 * @module app
 * @description Punto de entrada de la aplicación. Configura e inicia el servidor Express,
 *              estableciendo conexiones con la base de datos y Redis, aplicando middlewares
 *              de seguridad, compresión, logging, CORS; registra rutas y maneja errores.
 *
 * @requires dotenv
 * @requires express
 * @requires helmet
 * @requires compression
 * @requires src/config/db~connectDB
 * @requires src/config/redis~connectRedis
 * @requires src/middleware/corsConfig
 * @requires src/middleware/requestLogger
 * @requires src/middleware/errorHandler
 * @requires src/routes
 * @requires logger
 */

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
const logger = require('./logger');

const PORT = process.env.PORT || 3001;

/**
 * Inicializa y arranca el servidor Express.
 *
 * @async
 * @function initApp
 * @returns {Promise<void>} Se resuelve cuando el servidor está escuchando; rechaza si ocurre un error.
 */
async function initApp() {
    try {
        // Conexión a la base de datos
        await connectDB();
        logger.info('Conectado a la base de datos.');

        // Conexión a Redis
        await connectRedis();
        logger.info('Conectado a Redis.');

        // Creación de la aplicación Express
        const app = express();

        /**
         * Confía en el proxy de cabeceras 'X-Forwarded-*'
         * útil cuando la app está detrás de Nginx, Heroku, etc.
         * @see {@link https://expressjs.com/en/guide/behind-proxies.html}
         */
        app.set('trust proxy', 1);

        // ─── Middlewares globales ────────────────────────────────────────────────

        /**
         * Configuración de CORS para controlar orígenes permitidos,
         * métodos y cabeceras.
         * @see src/middleware/corsConfig
         */
        app.use(corsConfig);

        /**
         * Parseo de JSON en el cuerpo de las peticiones.
         */
        app.use(express.json());

        /**
         * Compresión GZIP de las respuestas HTTP.
         */
        app.use(compression());

        /**
         * Logging de cada petición: método, URL, estado y tiempo.
         * @see src/middleware/requestLogger
         */
        app.use(requestLogger);

        /**
         * Cabeceras de seguridad HTTP.
         */
        app.use(helmet());

        /**
         * Deshabilita la cabecera 'X-Powered-By' para no exponer tecnología.
         */
        app.disable('x-powered-by');

        // ─── Rutas ────────────────────────────────────────────────────────────────
        /**
         * Registro de todas las rutas de la API (incluye /health, /api/…).
         */
        app.use(routes);

        // ─── Manejador de errores ─────────────────────────────────────────────────
        /**
         * Captura y formatea errores no gestionados en middlewares o rutas.
         * @see src/middleware/errorHandler
         */
        app.use(errorHandler);

        // ─── Inicio del servidor ──────────────────────────────────────────────────
        app.listen(PORT, () => {
            logger.info(`Servidor escuchando en http://localhost:${PORT}`);
        });
    } catch (error) {
        // Si hay fallo en inicialización, registra y sale del proceso
        logger.error('Error al iniciar la aplicación:', error);
        process.exit(1);
    }
}

// Arranca la aplicación
initApp();
