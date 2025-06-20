// src/ProtectedRoute.test.jsx
import { render, screen } from './test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';

test('ProtectedRoute redirige usuarios no verificados', () => {
    render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>,
        { initialAuthState: { isVerified: false } }
    );
    expect(screen.queryByText(/bienvenido/i)).not.toBeInTheDocument();
});
