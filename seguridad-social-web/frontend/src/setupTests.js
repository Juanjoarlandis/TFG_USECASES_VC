/**
 * src/setupTests.js
 * Ejecutado por CRA antes de cada test (setupFilesAfterEnv).
 */

import '@testing-library/jest-dom';

/* --------- 1. Polyfills de Node / WHATWG -------------------------------- */
// TextEncoder / TextDecoder  (↓ Node < 19)
import { TextEncoder, TextDecoder } from 'util';
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// Web Streams API      (↓ Node < 18)
try {
    // Node ≥ 18 los expone en 'stream/web'
    const streams = require('stream/web');
    if (!global.TransformStream) global.TransformStream = streams.TransformStream;
    if (!global.ReadableStream) global.ReadableStream = streams.ReadableStream;
    if (!global.WritableStream) global.WritableStream = streams.WritableStream;
} catch {
    // Fallback para Node 14/16 usando polyfill
    const poly = require('web-streams-polyfill/ponyfill/es2018');
    if (!global.TransformStream) global.TransformStream = poly.TransformStream;
    if (!global.ReadableStream) global.ReadableStream = poly.ReadableStream;
    if (!global.WritableStream) global.WritableStream = poly.WritableStream;
}

/* --------- 2. MSW – Mock Service Worker ---------------------------------- */
/*  ¡OJO!  require() para evitar el hoisting (debe ejecutarse DESPUÉS
    de los polyfills, o volverá a fallar).                                 */
const { server } = require('./mocks/server');

beforeAll(() => server.listen());
afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
});
afterAll(() => server.close());

global.server = server;   // Disponible en cualquier test como global.server
