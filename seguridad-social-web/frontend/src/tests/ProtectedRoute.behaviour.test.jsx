import { render, screen } from '../test-utils';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

test('ProtectedRoute redirige usuarios no verificados', () => {
    render(
        <Routes>
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <div>Privado</div>
                    </ProtectedRoute>
                }
            />
            <Route path="/verification-mode" element={<div>Modo Verificación</div>} />
        </Routes>,
        { initialEntries: ['/dashboard'] }
    );

    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
    expect(screen.getByText(/modo verificación/i)).toBeInTheDocument();
});
