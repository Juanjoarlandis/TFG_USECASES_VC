require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const requestLogger = require('./src/middleware/requestLogger');
const errorHandler = require('./src/middleware/errorHandler');
const corsConfig = require('./src/middleware/corsConfig');


// Conexión a la base de datos
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

const app = express();

// CORS restrictivo (en producción establecer el origen en una lista blanca)
app.use(corsConfig);

// Middlewares
app.use(express.json());
app.use(requestLogger);

// Rutas
const verificationRoutes = require('./src/routes/verificationRoutes');
const issuanceRoutes = require('./src/routes/issuanceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const revocationRoutes = require('./src/routes/revocationRoutes');
const authRoutes = require('./src/routes/authRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const didRoutes = require('./src/routes/didRoutes');

app.use('/verification', verificationRoutes);
app.use('/issuance', issuanceRoutes);
app.use('/user', userRoutes);
app.use('/revocar', revocationRoutes);
app.use('/auth', authRoutes);
app.use('/wallet-api', walletRoutes);
app.use('/wallet-api', didRoutes);

// Middleware de errores global
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend escuchando en http://localhost:${PORT}`);
});
