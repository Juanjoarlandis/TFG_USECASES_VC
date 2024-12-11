// logger.ts
import winston from 'winston';
import path from 'path';

const allpath: string = path.join(__dirname, 'data', 'logs', 'logs.log');

// Función para serializar JSON evitando referencias circulares
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  }, 2);
}

interface RequestLike {
  method?: string;
  url?: string;
  headers?: object;
}

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...meta };
  
  if (sanitized.req && typeof sanitized.req === 'object') {
    const reqObj = sanitized.req as RequestLike;
    sanitized.req = {
      method: reqObj.method,
      url: reqObj.url,
      headers: reqObj.headers
    };
  }

  if (sanitized.res) {
    // No necesitamos loguear la respuesta completa. Si se quiere, se extraen algunos campos.
    // Por ahora, simplemente la borramos o dejamos algo sencillo.
    delete sanitized.res;
  }

  return sanitized;
}

const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const safeMeta = sanitizeMeta(meta);
  const aux = `[${level}]:`;
  if (Object.keys(safeMeta).length) {
    return `${aux.padEnd(18, ' ')}${timestamp} ${message}\n    ${safeStringify(safeMeta)}`;
  } else {
    return `${aux.padEnd(18, ' ')}${timestamp} ${message}`;
  }
});

const customFileFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const safeMeta = sanitizeMeta(meta);
  const aux = `[${level}]:`;
  if (Object.keys(safeMeta).length) {
    return `${aux.padEnd(8, ' ')}${timestamp} ${message}\n    ${safeStringify(safeMeta)}`;
  } else {
    return `${aux.padEnd(8, ' ')}${timestamp} ${message}`;
  }
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format((info) => {
          info.level = info.level.toUpperCase();
          return info;
        })(),
        winston.format.colorize(),
        customFormat
      ),
    }),
    new winston.transports.File({
      filename: allpath,
      format: winston.format.combine(
        winston.format((info) => {
          info.level = info.level.toUpperCase();
          return info;
        })(),
        customFileFormat
      ),
    }),
  ],
});

export default logger;
