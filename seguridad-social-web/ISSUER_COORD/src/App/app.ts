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
import routes from './routes/routes'; // Este archivo debe exportar un router de Express.
import logger from '../logger';
import './../shim';

const app = express();
const PORT = process.env.PORT || 5500;

// Verificación y creación de carpetas y archivos necesarios:
(function initDirectoriesAndFiles() {
  const dataDir = path.join(__dirname, '..', 'data');
  const dirs = ['count', 'credentials', 'dids', 'logs', 'status'];

  // Crear las carpetas si no existen
  for (const dirName of dirs) {
    const dirPath = path.join(dataDir, dirName);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Directorio creado: ${dirPath}`);
    }
  }

  // Verificar id.txt en count
  const countDir = path.join(dataDir, 'count');
  const idTxtPath = path.join(countDir, 'id.txt');
  if (!fs.existsSync(idTxtPath)) {
    fs.writeFileSync(idTxtPath, '0', 'utf-8');
    logger.info(`Archivo id.txt creado con "0" en ${idTxtPath}`);
  }

  // Verificar did.json e issuerKey.json en dids
  const didsDir = path.join(dataDir, 'dids');
  const didJsonPath = path.join(didsDir, 'did.json');
  if (!fs.existsSync(didJsonPath)) {
    const defaultDid = {
      "@context": "https://www.w3.org/ns/did/v1",
      "id": "did:web:placeholder",
      "verificationMethod": [],
      "authentication": [],
      "assertionMethod": []
    };
    fs.writeFileSync(didJsonPath, JSON.stringify(defaultDid, null, 2), 'utf-8');
    logger.info(`Archivo did.json creado en ${didJsonPath}`);
  }

  const issuerKeyJsonPath = path.join(didsDir, 'issuerKey.json');
  if (!fs.existsSync(issuerKeyJsonPath)) {
    const defaultIssuerKey = {
      "type": "jwk",
      "jwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "",
        "d": "",
        "kid": ""
      }
    };
    fs.writeFileSync(issuerKeyJsonPath, JSON.stringify(defaultIssuerKey, null, 2), 'utf-8');
    logger.info(`Archivo issuerKey.json creado en ${issuerKeyJsonPath}`);
  }

})();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utiliza el router de Express.
app.use('/', routes);

http.createServer(app).listen(PORT, () => {
  logger.info(`HTTP server listening on http://localhost:${PORT}`);
});
