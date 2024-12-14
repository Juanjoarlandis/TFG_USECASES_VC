import mongoose from 'mongoose';
import logger from '../../logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/issuercoord';

/**
 * Establece la conexión con la base de datos MongoDB utilizando Mongoose.
 * En caso de error, se loguea y se fuerza la terminación del proceso.
 */
export async function connectToMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');
  } catch (error: any) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}
