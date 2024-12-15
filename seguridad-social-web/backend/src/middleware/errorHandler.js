// src/middleware/errorHandler.js

module.exports = (err, req, res, next) => {
    console.error('--- Error Handler Log Start ---');
    console.error(`Time: ${new Date().toISOString()}`);
    console.error('Original Error:', err);

    // Aquí definimos valores por defecto
    let statusCode = err.status || 500;
    let message = err.message || 'Internal Server Error';
    let errorType = 'InternalServerError';

    // Manejo de errores de Mongoose
    if (err.name === 'ValidationError') {
        // Errores de validación Mongoose
        statusCode = 400;
        message = 'Datos inválidos: ' + Object.values(err.errors).map(e => e.message).join(', ');
        errorType = 'ValidationError';
    } else if (err.name === 'CastError') {
        // Errores de casteo, por ejemplo, id inválido
        statusCode = 400;
        message = `El formato del parámetro ${err.path} es inválido: ${err.value}`;
        errorType = 'CastError';
    } else if (err.code && err.code === 11000) {
        // Error de índice único en Mongoose
        statusCode = 400;
        const field = Object.keys(err.keyValue);
        message = `El campo ${field} debe ser único. Valor duplicado: ${err.keyValue[field]}`;
        errorType = 'DuplicateKeyError';
    }

    // Manejo de errores de Axios (peticiones externas)
    if (err.isAxiosError) {
        // Podríamos agregar lógica para errores de axios
        // err.response?.status puede ayudarnos
        statusCode = err.response && err.response.status ? err.response.status : 500;
        message = `Error en servicio externo: ${err.message}`;
        errorType = 'ExternalServiceError';
    }

    // Manejo de errores de JWT (si se hace verificación interna)
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
        errorType = 'TokenExpiredError';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
        errorType = 'JsonWebTokenError';
    }

    // Si el error viene ya con un status predefinido por el controlador, lo respetamos
    // (por ejemplo: 400, 404, etc.)
    if (err.status) {
        statusCode = err.status;
    }

    // Podemos añadir lógica adicional para errores no cubiertos, o errores personalizados
    // con más contexto

    // Log detallado para debug (en producción podrías omitir ciertos detalles)
    console.error('Status Code:', statusCode);
    console.error('Message:', message);
    console.error('--- Error Handler Log End ---');

    // Respuesta con JSON
    res.status(statusCode).json({
        error: {
            type: errorType,
            message: message,
            // Podemos dar detalles adicionales para debug si no es producción
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};
