import { render, screen, waitFor, act } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Alta from '../pages/Alta/Alta';
import { rest } from 'msw';

const BASE = process.env.REACT_APP_BACKEND_URL;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runOnlyPendingTimers());

test('ciclo completo verificación + emisión', async () => {
    global.server.use(
        rest.post(`${BASE}/verification/offer3creds`, (_, res, ctx) =>
            res(ctx.json({ verificationUrl: 'https://qr', state: 'S1' }))
        ),
        rest.get(`${BASE}/verification/session/S1`, (_, res, ctx) =>
            res.once(ctx.json({ status: 'pending' }))
        ),
        rest.get(`${BASE}/verification/session/S1`, (_, res, ctx) =>
            res(ctx.json({ status: 'verified' }))
        ),
        rest.post(`${BASE}/issuance/offerIssuance`, (_, res, ctx) =>
            res(ctx.json({ issuanceOfferUrl: 'https://qr2', state: 'S1' }))
        ),
        rest.get(`${BASE}/issuance/session/S1`, (_, res, ctx) =>
            res(ctx.json({ issuanceStatus: 'accepted' }))
        )
    );

    render(<Alta />);

    userEvent.click(
        screen.getByRole('button', { name: /iniciar verificación/i })
    );
    await waitFor(() => screen.getByText(/escanee este código qr/i));

    act(() => jest.advanceTimersByTime(5000)); // 1er polling
    act(() => jest.advanceTimersByTime(5000)); // 2º polling

    await waitFor(() => screen.getByText(/credencial emitida y aceptada/i));
});
