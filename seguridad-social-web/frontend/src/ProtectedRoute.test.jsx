import { render, screen } from './testUtils';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';

test('ProtectedRoute redirige usuarios no verificados', () => {
    render(
        <Routes>
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
        </Routes>,
        {
            initialEntries: ['/dashboard'],
            initialAuthState: { isVerified: false },
        }
    );

    expect(screen.queryByText(/bienvenido/i)).not.toBeInTheDocument();
});
