/**
 * @file jest.setup.js
 * @description
 *   Configuración global para Jest:
 *   - Deshabilita la verificación de certificados TLS para permitir conexiones a servicios de prueba.
 *   - Carga variables de entorno desde el archivo `.env`.
 *   - Intercepta las llamadas HTTP a WaltID usando `nock` antes de ejecutar los tests.
 *   - Restablece las interceptaciones de `nock` después de todos los tests.
 *
 * @requires dotenv
 * @requires nock
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const nock = require('nock');

// Claves de encriptación por defecto para permitir el cifrado/desencriptado en tests
process.env.ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY ||
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=';
process.env.SIGNING_KEY =
    process.env.SIGNING_KEY ||
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb=';

/**
 * @function setupWaltIdInterceptor
 * @description
 *   Antes de ejecutar los tests, intercepta todas las llamadas HTTP
 *   POST a la ruta `/openid4vc/verify` del servicio WaltID y responde
 *   con un URL de verificación simulado.
 *
 *   Esto evita dependencias externas y permite realizar tests deterministas.
 *
 * @see {@link https://github.com/nock/nock|nock}
 */
beforeAll(() => {
    const base =
        process.env.WALTID_VERIFIER_URL || 'http://caddy:7003';

    nock(base)
        .post('/openid4vc/verify')
        .reply(200, 'http://walt.id/verify?state=xyz');
});

/**
 * @function teardownNock
 * @description
 *   Después de todos los tests, limpia y restaura las interceptaciones de `nock`,
 *   asegurando que no afecten a otros tests o al entorno de ejecución posterior.
 */
afterAll(() => {
    nock.cleanAll();
    nock.restore();
});
