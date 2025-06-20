// src/__tests__/App.smoke.test.jsx
import { render, screen } from '../test-utils';
import App from '../App';

test('la app se renderiza sin estallar', () => {
    render(<App />);
    // Asumimos que tu Header usa <header>, o cambia a algún elemento siempre presente
    expect(screen.getByRole('banner')).toBeInTheDocument();
});
