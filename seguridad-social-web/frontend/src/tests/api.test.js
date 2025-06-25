import { startVerification } from '../services/api';
import { rest } from 'msw';

const BASE = process.env.REACT_APP_BACKEND_URL;

test('startVerification devuelve url y state', async () => {
    global.server.use(
        rest.post(`${BASE}/verification/offer`, (_, res, ctx) =>
            res(ctx.json({ verificationUrl: 'https://issuer', state: '123' }))
        )
    );

    await expect(startVerification()).resolves.toEqual({
        verificationUrl: 'https://issuer',
        sessionId: '123'
    });
});

test('propaga error del backend', async () => {
    global.server.use(
        rest.post(`${BASE}/verification/offer`, (_, res, ctx) => res(ctx.status(500)))
    );
    await expect(startVerification()).rejects.toThrow();
});
