/**
 * @file app.js
 * @description Entry point of the backend application. Configures and starts the Express server,
 * establishes connections to MongoDB and Redis, and mounts the application routes.
 * @version 1.0.0
 */

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const { connectRedis } = require('./src/config/redis');

const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const corsConfig = require('./src/middleware/corsConfig');

const verificationRoutes = require('./src/routes/verificationRoutes');
const issuanceRoutes = require('./src/routes/issuanceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const revocationRoutes = require('./src/routes/revocationRoutes');
const authRoutes = require('./src/routes/authRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const didRoutes = require('./src/routes/didRoutes');

/**
 * Connect to MongoDB.
 * Uses the MONGO_URI environment variable for the connection.
 */
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

/**
 * Express application instance.
 * Configures middleware and routes.
 * @type {Express.Application}
 */
const app = express();

// Set proxy, CORS, JSON parser, and request logger middleware.
app.set('trust proxy', 1);
app.use(corsConfig);
app.use(express.json());
app.use(requestLogger);

// Mount application routes.
app.use('/verification', verificationRoutes);
app.use('/issuance', issuanceRoutes);
app.use('/user', userRoutes);
app.use('/revocar', revocationRoutes);
app.use('/auth', authRoutes);
app.use('/wallet-api', walletRoutes);
app.use('/wallet-api', didRoutes);

// Global error handling middleware.
app.use(errorHandler);

/**
 * Application port.
 * Uses the PORT environment variable or defaults to 3001.
 * @constant {number}
 */
const PORT = process.env.PORT || 3001;

/**
 * Starts the Express server.
 * Connects to Redis before starting the server on the defined port.
 *
 * @async
 * @function startServer
 */
async function startServer() {
    try {
        await connectRedis();
        app.listen(PORT, () => {
            console.log(`Server is listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

startServer();
