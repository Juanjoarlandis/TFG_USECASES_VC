import { render, screen } from '../test-utils';
import { Routes, Route } from 'react-router-dom';
import GuestRoute from '../GuestRoute';
import { verifyUser } from '../store/authSlice';
import store from '../store/store';

test('GuestRoute bloquea usuarios verificados', () => {
    store.dispatch(verifyUser({ user: { firstName: 'Ada' }, token: 'xyz' }));

    render(
        <Routes>
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <div>Pública</div>
                    </GuestRoute>
                }
            />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>,
        { initialEntries: ['/login'] }
    );

    expect(screen.queryByText('Pública')).not.toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
