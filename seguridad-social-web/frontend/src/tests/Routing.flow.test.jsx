import { render, screen } from '../test-utils';
import { Routes, Route } from 'react-router-dom';
import GuestRoute from '../GuestRoute';
import ProtectedRoute from '../ProtectedRoute';
import { verifyUser, logout } from '../store/authSlice';
import store from '../store/store';

const Dummy = () => <div>OK</div>;

describe('Rutas protegidas', () => {
    test('GuestRoute bloquea a usuarios verificados', () => {
        store.dispatch(verifyUser({ token: 'tok', user: { firstName: 'Bob' } }));

        render(
            <Routes>
                <Route
                    path="/login"
                    element={
                        <GuestRoute>
                            <Dummy />
                        </GuestRoute>
                    }
                />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>,
            { initialEntries: ['/login'] }
        );

        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });

    test('ProtectedRoute redirige a no verificados', () => {
        store.dispatch(logout());

        render(
            <Routes>
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dummy />
                        </ProtectedRoute>
                    }
                />
                <Route path="/verification-mode" element={<div>VM</div>} />
            </Routes>,
            { initialEntries: ['/dashboard'] }
        );

        expect(screen.getByText(/vm/i)).toBeInTheDocument();
    });
});
