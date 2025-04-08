// src/routes/index.js
const { Router } = require("express");

// Importa tus archivos de rutas:
const verificationRoutes = require("./verificationRoutes");
const issuanceRoutes = require("./issuanceRoutes");
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const revocationRoutes = require("./revocationRoutes");
const walletRoutes = require("./walletRoutes");
const didRoutes = require("./didRoutes");

// Crea el enrutador principal
const router = Router();

// Aquí "montas" cada conjunto de rutas en una ruta base específica:
router.use("/verification", verificationRoutes);
router.use("/issuance", issuanceRoutes);
router.use("/user", userRoutes);
router.use("/revocar", revocationRoutes);
router.use("/auth", authRoutes);

// Fíjate que walletRoutes y didRoutes van hacia la misma ruta base “/wallet-api”.
// Puedes unificarlos o dejarlos separados, pero generalmente se pueden “combinar”.
router.use("/wallet-api", walletRoutes);
router.use("/wallet-api", didRoutes);

// Exporta el enrutador
module.exports = router;
