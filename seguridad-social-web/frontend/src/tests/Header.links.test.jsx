import { render, screen } from '../test-utils';
import Header from '../components/Header/Header';
import { verifyUser, logout } from '../store/authSlice';
import store from '../store/store';

describe('<Header> dinámico', () => {
    test('enlaces públicos sin sesión', () => {
        store.dispatch(logout());
        render(<Header />);
        expect(screen.getByRole('link', { name: /ayuda/i })).toBeVisible();
        expect(screen.queryByRole('link', { name: /darse de alta/i })).toBeNull();
    });

    test('enlaces privados después de login', () => {
        store.dispatch(
            verifyUser({
                token: 't',
                user: { firstName: 'Ada', hasAltaCredential: false }
            })
        );
        render(<Header />);
        expect(screen.getByRole('link', { name: /darse de alta/i })).toBeVisible();
    });
});
