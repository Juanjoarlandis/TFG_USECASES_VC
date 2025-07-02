import mongoose from 'mongoose';
import logger from '../../logger';

 /**
  * URI de conexión a MongoDB. Se lee de la variable de entorno `MONGODB_URI`,
  * o se utiliza el valor por defecto apuntando a `localhost:27017/issuercoord`.
  *
  * @constant {string}
  */
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/issuercoord';

/**
 * Establece la conexión con la base de datos MongoDB utilizando Mongoose.
 *
 * - Intenta conectarse a la URI definida en {@link MONGODB_URI}.
 * - Al conectar con éxito, registra un mensaje de información.
 * - Si ocurre un error, lo registra como error y finaliza el proceso con código 1.
 *
 * @async
 * @function connectToMongo
 * @returns {Promise<void>} Se resuelve cuando la conexión se establece correctamente.
 * @throws {Error} Si la conexión falla, lanza el error tras registrar el fallo.
 */
export async function connectToMongo(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB successfully');
  } catch (error: any) {
    logger.error('Error connecting to MongoDB:', error);
    // Finaliza el proceso ante fallo irreparable en la conexión
    process.exit(1);
  }
}
