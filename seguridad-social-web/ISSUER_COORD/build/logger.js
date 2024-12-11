"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// logger.ts
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const allpath = path_1.default.join(__dirname, 'data', 'logs', 'logs.log');
// Función para serializar JSON evitando referencias circulares
function safeStringify(obj) {
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
function sanitizeMeta(meta) {
    const sanitized = Object.assign({}, meta);
    if (sanitized.req && typeof sanitized.req === 'object') {
        const reqObj = sanitized.req;
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
const customFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, meta = __rest(_a, ["level", "message", "timestamp"]);
    const safeMeta = sanitizeMeta(meta);
    const aux = `[${level}]:`;
    if (Object.keys(safeMeta).length) {
        return `${aux.padEnd(18, ' ')}${timestamp} ${message}\n    ${safeStringify(safeMeta)}`;
    }
    else {
        return `${aux.padEnd(18, ' ')}${timestamp} ${message}`;
    }
});
const customFileFormat = winston_1.default.format.printf((_a) => {
    var { level, message, timestamp } = _a, meta = __rest(_a, ["level", "message", "timestamp"]);
    const safeMeta = sanitizeMeta(meta);
    const aux = `[${level}]:`;
    if (Object.keys(safeMeta).length) {
        return `${aux.padEnd(8, ' ')}${timestamp} ${message}\n    ${safeStringify(safeMeta)}`;
    }
    else {
        return `${aux.padEnd(8, ' ')}${timestamp} ${message}`;
    }
});
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'HH:mm:ss' })),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format((info) => {
                info.level = info.level.toUpperCase();
                return info;
            })(), winston_1.default.format.colorize(), customFormat),
        }),
        new winston_1.default.transports.File({
            filename: allpath,
            format: winston_1.default.format.combine(winston_1.default.format((info) => {
                info.level = info.level.toUpperCase();
                return info;
            })(), customFileFormat),
        }),
    ],
});
exports.default = logger;
