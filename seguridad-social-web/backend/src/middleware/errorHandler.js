/**
 * @module src/middleware/errorHandler
 * @description Middleware global de manejo de errores para Express.  
 *              Registra información completa del error (timestamp, ruta, IP, metadata),
 *              clasifica distintos tipos de error (Mongoose, Axios, JWT, duplicados, personalizados),
 *              y envía una respuesta JSON estándar al cliente.
 *
 * @requires ../../logger
 */

const logger = require("../../logger");

/**
 * Middleware que captura errores no gestionados en rutas o middlewares anteriores.
 *
 * @function errorHandler
 * @param {Error & {
 *   status?: number,
 *   code?: string,
 *   isAxiosError?: boolean,
 *   name?: string,
 *   keyValue?: Record<string, any>,
 *   response?: { status?: number, data?: any }
 * }} err - Objeto de error lanzado.
 * @param {import('express').Request} req - Petición de Express.
 * @param {import('express').Response} res - Respuesta de Express.
 * @param {import('express').NextFunction} next - Siguiente middleware (no se usa aquí).
 *
 * @description
 *   1. Registra el timestamp, método, ruta e IP de la petición.  
 *   2. Inicializa `statusCode`, `message` y `errorType` con valores por defecto.  
 *   3. Ajusta la respuesta según el tipo de error:
 *      - <code>ValidationError</code>, <code>CastError</code>, <code>DuplicateKeyError</code> de Mongoose.  
 *      - <code>isAxiosError</code> para errores de servicios externos.  
 *      - <code>TokenExpiredError</code> y <code>JsonWebTokenError</code> de JWT.  
 *      - Errores personalizados que incluyan <code>status</code> o <code>code</code>.  
 *   4. Registra detalles finales: código, tipo, mensaje y stack (si no es producción).  
 *   5. Envía al cliente:
 *      ```json
 *      {
 *        "error": {
 *          "type": "<errorType>",
 *          "message": "<message>",
 *          // en desarrollo, incluye stack
 *          "stack": "<stacktrace>"
 *        }
 *      }
 *      ```
 *
 * @returns {void}
 */
module.exports = (err, req, res, next) => {
  // 1) LOG BASADO EN TIEMPO Y METADATOS DE LA PETICIÓN
  const now = new Date().toISOString();
  logger.error("--- Error Handler Log Start ---");
  logger.error(`Time: ${now}`);
  logger.error(`Request Path: ${req.method} ${req.originalUrl}`);
  logger.error(`IP: ${req.ip}`);

  // 2) VALORES POR DEFECTO
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";
  let errorType = "InternalServerError";

  // 3) ERRORES DE MONGOOSE
  if (err.name === "ValidationError") {
    statusCode = 400;
    message =
      "Datos inválidos: " +
      Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    errorType = "ValidationError";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `El formato del parámetro ${err.path} es inválido: ${err.value}`;
    errorType = "CastError";
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `El campo ${field} debe ser único. Valor duplicado: ${err.keyValue[field]}`;
    errorType = "DuplicateKeyError";
  }

  // 4) ERRORES DE AXIOS (SERVICIOS EXTERNOS)
  if (err.isAxiosError) {
    statusCode = err.response?.status || 500;
    message = `Error en servicio externo: ${err.message}`;
    errorType = "ExternalServiceError";
  }

  // 5) ERRORES DE JWT U OTRAS BIBLIOTECAS
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expirado";
    errorType = "TokenExpiredError";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido";
    errorType = "JsonWebTokenError";
  }

  // 6) ERRORES PERSONALIZADOS
  if (err.status) {
    statusCode = err.status;
  }
  if (typeof err.code === "string") {
    errorType = err.code;
  }

  // 7) LOG DETALLADO
  logger.error(`Status Code: ${statusCode}`);
  logger.error(`Error Type: ${errorType}`);
  logger.error(`Message: ${message}`);
  if (process.env.NODE_ENV !== "production") {
    logger.error(err.stack);
  }
  logger.error("--- Error Handler Log End ---");

  // 8) RESPUESTA JSON AL CLIENTE
  res.status(statusCode).json({
    error: {
      type: errorType,
      message: message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
