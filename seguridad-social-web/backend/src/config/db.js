const mongoose = require('mongoose');
const logger = require('../../logger');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('Conectado a MongoDB');
    } catch (err) {
        logger.error('Error conectando a MongoDB:', err);
        process.exit(1);
    }
}

module.exports = { connectDB };
