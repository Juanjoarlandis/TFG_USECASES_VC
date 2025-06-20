// src/pages/Register/Register.integration.test.jsx
import { render, screen, waitFor, act } from '../../test‑utils';
import userEvent from '@testing-library/user-event';
import Register from '../pages/Register/Register';
import { server, rest } from '../mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('proceso completo de verificación DNI', async () => {
    render(<Register />);
    userEvent.click(screen.getByRole('button', { name: /iniciar verificación/i }));

    // Mock: respuesta de offer
    await waitFor(() => screen.getByText(/generando qr/i));
    act(() => jest.advanceTimersByTime(3000));

    expect(screen.getByText(/escanea este código qr/i)).toBeInTheDocument();

    // Avanzar polling al estado verified
    server.use(
        rest.get(`${process.env.REACT_APP_BACKEND_URL}/verification/session/:id`, (req, res, ctx) =>
            res(ctx.json({ status: 'verified', token: 't', user: { firstName: 'Test' }, refreshToken: 'r' }))
        )
    );
    act(() => jest.advanceTimersByTime(5000));

    await waitFor(() => screen.getByText(/credencial verificada/i));
});
