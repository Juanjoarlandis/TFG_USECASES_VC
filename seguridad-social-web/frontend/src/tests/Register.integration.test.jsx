import { render, screen, waitFor, act } from '../testUtils';
import userEvent from '@testing-library/user-event';
import Register from '../pages/Register/Register';
import { rest } from 'msw';

const BASE = process.env.REACT_APP_BACKEND_URL;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.runOnlyPendingTimers());

test('proceso completo de verificación DNI', async () => {
    global.server.use(
        rest.post(`${BASE}/verification/offer`, (_, res, ctx) =>
            res(ctx.json({ verificationUrl: 'https://qr', state: 'S1' }))
        ),
        rest.get(`${BASE}/verification/session/S1`, (_, res, ctx) =>
            res(ctx.json({
                status: 'verified',
                token: 'tok',
                refreshToken: 'rt',
                user: {
                    firstName: 'Ada',
                    familyName: 'Lovelace',
                    documentNumber: '123'
                }
            }))
        )
    );

    render(<Register />);
    userEvent.click(screen.getByRole('button', { name: /iniciar verificación/i }));

    await waitFor(() => screen.getByText(/generando qr/i));
    act(() => jest.advanceTimersByTime(3000));        // QR generado
    await waitFor(() => screen.getByText(/escanea este código qr/i));

    act(() => jest.advanceTimersByTime(5000));        // polling
    await waitFor(() => screen.getByText(/credencial verificada/i));
});
