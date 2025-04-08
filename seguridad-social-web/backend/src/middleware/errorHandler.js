// src/middleware/errorHandler.js

const logger = require("../../logger"); // Si usas Winston, Pino u otro logger personalizado

module.exports = (err, req, res, next) => {
  // =====================================================
  // 1) LOG BASADO EN TIEMPO Y METADATOS DE LA PETICIÓN
  // =====================================================
  const now = new Date().toISOString();
  logger.error("--- Error Handler Log Start ---");
  logger.error(`Time: ${now}`);
  logger.error(`Request Path: ${req.method} ${req.originalUrl}`);
  logger.error(`IP: ${req.ip}`);
  // Aquí podrías incluir más metadatos (headers relevantes, userId si lo tienes, etc.)

  // =====================================================
  // 2) VALORES POR DEFECTO
  // =====================================================
  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";
  let errorType = "InternalServerError";

  // =====================================================
  // 3) ERRORES DE MONGOOSE
  // =====================================================
  if (err.name === "ValidationError") {
    // Error de validación Mongoose
    statusCode = 400;
    // Unir todos los mensajes de validación
    message =
      "Datos inválidos: " +
      Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    errorType = "ValidationError";
  } else if (err.name === "CastError") {
    // Errores de casteo (por ej. IDs mal formados)
    statusCode = 400;
    message = `El formato del parámetro ${err.path} es inválido: ${err.value}`;
    errorType = "CastError";
  } else if (err.code && err.code === 11000) {
    // Índice único violado en Mongoose
    statusCode = 400;
    const field = Object.keys(err.keyValue);
    message = `El campo ${field} debe ser único. Valor duplicado: ${err.keyValue[field]}`;
    errorType = "DuplicateKeyError";
  }

  // =====================================================
  // 4) ERRORES DE AXIOS (SERVICIOS EXTERNOS)
  // =====================================================
  // isAxiosError: puede indicarnos que el error viene de axios
  if (err.isAxiosError) {
    // Podrías extraer err.response?.status, err.response?.data, etc.
    statusCode =
      err.response && err.response.status ? err.response.status : 500;
    message = `Error en servicio externo: ${err.message}`;
    errorType = "ExternalServiceError";
  }

  // =====================================================
  // 5) ERRORES DE JWT U OTRAS BIBLIOTECAS
  // =====================================================
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expirado";
    errorType = "TokenExpiredError";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token inválido";
    errorType = "JsonWebTokenError";
  }

  // =====================================================
  // 6) ERRORES PERSONALIZADOS (SERVICES, ETC.)
  // =====================================================
  // Por ejemplo, tu service puede lanzar:
  //   throw { status: 404, message: 'Recurso no encontrado', code: 'RESOURCE_NOT_FOUND' }
  // O un error con err.customCode
  if (err.status) {
    statusCode = err.status;
  }
  if (err.code && typeof err.code === "string") {
    // Podríamos asignar errorType con err.code si tiene un valor especial
    errorType = err.code;
  }

  // =====================================================
  // 7) LOG DETALLADO (Stacktrace, Data, Etc.)
  // =====================================================
  logger.error(`Status Code: ${statusCode}`);
  logger.error(`Error Type: ${errorType}`);
  logger.error(`Message: ${message}`);
  // Si estás en un entorno de staging o desarrollo, loguea el stack completo
  if (process.env.NODE_ENV !== "production") {
    logger.error(err.stack);
  }
  logger.error("--- Error Handler Log End ---");

  // =====================================================
  // 8) RESPUESTA JSON AL CLIENTE
  // =====================================================
  // En producción no retornamos stacktrace, para evitar exponer detalles.
  // Ajusta según tus necesidades.
  res.status(statusCode).json({
    error: {
      type: errorType,
      message: message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
