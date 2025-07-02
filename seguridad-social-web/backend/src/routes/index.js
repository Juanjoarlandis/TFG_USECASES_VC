/**
 * @module src/routes/index
 * @description Punto de montaje principal de rutas de la aplicación.  
 *              Agrupa y monta los routers específicos de cada dominio funcional:
 *              - Verificación de credenciales
 *              - Emisión de credenciales
 *              - Gestión de usuarios
 *              - Autenticación
 *              - Revocación de credenciales
 *              - Operaciones sobre wallet y DIDs
 *
 * @requires express~Router
 * @requires ./verificationRoutes
 * @requires ./issuanceRoutes
 * @requires ./userRoutes
 * @requires ./authRoutes
 * @requires ./revocationRoutes
 * @requires ./walletRoutes
 * @requires ./didRoutes
 */

const { Router } = require("express");
const verificationRoutes = require("./verificationRoutes");
const issuanceRoutes = require("./issuanceRoutes");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const revocationRoutes = require("./revocationRoutes");
const walletRoutes = require("./walletRoutes");
const didRoutes = require("./didRoutes");

/**
 * Router principal que agrupa todos los routers funcionales bajo rutas base.
 *
 * @type {import('express').Router}
 */
const router = Router();

// Montaje de rutas de verificación de credenciales en /verification
router.use("/verification", verificationRoutes);

// Montaje de rutas de emisión de credenciales en /issuance
router.use("/issuance", issuanceRoutes);

// Montaje de rutas de usuario en /user
router.use("/user", userRoutes);

// Montaje de rutas de revocación de credenciales en /revocar
router.use("/revocar", revocationRoutes);

// Montaje de rutas de autenticación (login, refresh) en /auth
router.use("/auth", authRoutes);

/**
 * Rutas relacionadas con la wallet y DIDs:
 * - Operaciones de wallet en /wallet-api (walletRoutes)
 * - Listado de DIDs en /wallet-api (didRoutes)
 *
 * Ambas se exponen bajo la misma ruta base para cohesión de API de wallet.
 */
router.use("/wallet-api", walletRoutes);
router.use("/wallet-api", didRoutes);

module.exports = router;
