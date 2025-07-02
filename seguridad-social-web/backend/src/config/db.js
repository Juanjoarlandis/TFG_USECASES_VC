/**
 * @module src/config/db
 * @description Módulo encargado de la conexión a la base de datos MongoDB usando Mongoose.
 *
 * @requires mongoose
 * @requires logger
 */

const mongoose = require('mongoose');
const logger = require('../../logger');

/**
 * @async
 * @function connectDB
 * @description
 *   Establece la conexión a MongoDB utilizando la cadena de conexión definida
 *   en la variable de entorno <code>MONGO_URI</code>.  
 *   Registra un mensaje de éxito si la conexión se establece correctamente o,
 *   en caso de error, registra el fallo y finaliza el proceso con código 1.
 *
 * @returns {Promise<void>} Se resuelve cuando la conexión se establece con éxito.
 *
 * @see {@link https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-connect Mongoose.connect}
 */
async function connectDB() {
  try {
    // Conecta a MongoDB con la URI especificada en .env
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Conectado a MongoDB');
  } catch (err) {
    // Si ocurre un error, lo registra y termina el proceso
    logger.error('Error conectando a MongoDB:', err);
    process.exit(1);
  }
}

module.exports = { connectDB };
