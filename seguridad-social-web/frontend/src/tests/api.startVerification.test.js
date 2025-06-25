/* ---------------------------------------
   src/__tests__/api.startVerification.test.js
----------------------------------------*/
import { startVerification } from '../src/services/api';
import { rest } from 'msw';           // ya no importamos server: está en global

const URL = `${process.env.REACT_APP_BACKEND_URL}/verification/offer`;

test('startVerification devuelve url y state', async () => {
    global.server.use(
        rest.post(URL, (_, res, ctx) =>
            res(ctx.json({ verificationUrl: 'https://issuer', state: '123' }))
        )
    );

    await expect(startVerification()).resolves.toEqual({
        verificationUrl: 'https://issuer',
        sessionId: '123'
    });
});

test('propaga error del backend', async () => {
    global.server.use(rest.post(URL, (_, res, ctx) => res(ctx.status(500))));
    await expect(startVerification()).rejects.toThrow();
});
