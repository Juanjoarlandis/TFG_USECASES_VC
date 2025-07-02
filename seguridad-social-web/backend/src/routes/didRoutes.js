/**
 * @module src/routes/didRoutes
 * @description Define la ruta para obtener los DIDs (Decentralized Identifiers) asociados a la wallet.
 *
 * @requires express
 * @requires src/controllers/didController~listDIDs
 */

const express = require("express");
const { listDIDs } = require("../controllers/didController");

const router = express.Router();

/**
 * @route GET /dids
 * @summary Obtiene el listado de DIDs del holder.
 * @param {import('express').Request} req - Objeto de petición de Express (no utiliza body ni params).
 * @param {import('express').Response} res - Objeto de respuesta de Express.  
 *        Devolverá un array JSON de DIDs: `["did:example:123", "did:example:456", …]`.
 * @param {import('express').NextFunction} next - Siguiente middleware de manejo de errores.
 * @returns {Promise<import('express').Response|void>}
 *   - `res.status(200).json(dids)` en caso de éxito.  
 *   - `res.status(error.status).json({ error })` si el servicio lanza un error con `status`.  
 *   - `next(error)` para errores no gestionados explícitamente.
 */
router.get("/dids", listDIDs);

module.exports = router;
