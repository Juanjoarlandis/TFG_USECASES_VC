import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

if (!process.env.DCOMPOSE) {
  dotenv.config();
}

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import routes from './routes/routes';
import logger from '../logger';
import '../shim';
import { connectToMongo } from './db/mongoose';

/**
 * Configura el servidor Express, conectando middlewares, rutas y base de datos.
 * Arranca el servidor HTTP en el puerto especificado.
 */

const app = express();
const PORT = process.env.PORT || 5500;

(async () => {
  /**
 * Establece la conexión con la base de datos MongoDB.
 * Finaliza el proceso si no se puede conectar.
 */
  await connectToMongo();
  
  /**
 * Verifica y crea directorios y ficheros necesarios para el correcto funcionamiento
 * del servicio, tales como el contador de IDs y directorios de credenciales y logs.
 */

  (function initDirectoriesAndFiles() {
    const dataDir = path.join(__dirname, '..', 'data');
    const dirs = ['count', 'credentials', 'logs', 'status'];

    for (const dirName of dirs) {
      const dirPath = path.join(dataDir, dirName);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Directorio creado: ${dirPath}`);
      }
    }

    const countDir = path.join(dataDir, 'count');
    const idTxtPath = path.join(countDir, 'id.txt');
    if (!fs.existsSync(idTxtPath)) {
      fs.writeFileSync(idTxtPath, '0', 'utf-8');
      logger.info(`Archivo id.txt creado con "0" en ${idTxtPath}`);
    }
  })();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/', routes);

  http.createServer(app).listen(PORT, () => {
    logger.info(`HTTP server listening on http://localhost:${PORT}`);
  });

})();
