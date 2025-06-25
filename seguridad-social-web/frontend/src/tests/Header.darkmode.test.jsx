import { render, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import Header from '../components/Header/Header';

test('el botón de modo oscuro alterna la clase .dark', () => {
    render(<Header />);
    const toggle = screen.getByRole('button', { name: /cambiar modo oscuro/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    userEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
});
