/**
 * MSW – servidor de mocks compartido por todos los tests.
 * Incluye handlers «catch‑all»; cada test puede sobre‑escribir
 * o añadir sus propios handlers con `global.server.use(…)`.
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

/* Handlers genéricos: devuelven 200 {} para cualquier método/URL
   si el test no ha proporcionado un handler específico. */
const genericHandlers = [
    rest.get('*', (_req, res, ctx) => res(ctx.status(200), ctx.json({}))),
    rest.post('*', (_req, res, ctx) => res(ctx.status(200), ctx.json({}))),
    rest.put('*', (_req, res, ctx) => res(ctx.status(200), ctx.json({}))),
    rest.delete('*', (_req, res, ctx) => res(ctx.status(200), ctx.json({}))),
];

export const server = setupServer(...genericHandlers);
export { rest };     // por comodidad, aunque los tests suelen `import { rest } from 'msw'`
