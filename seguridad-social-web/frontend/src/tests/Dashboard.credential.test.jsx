import { render, screen } from '../test-utils';
import Dashboard from '../pages/Dashboard/Dashboard';
import { verifyUser } from '../store/authSlice';
import store from '../store/store';

const dummyUser = {
    firstName: 'Ada',
    hasAltaCredential: true,
    altaCredentialData: {
        type: ['AltaCredential'],
        issuer: { name: 'Tesorería', id: 'urn:gob:es:ss' },
        credentialSubject: {
            worker: { nombre: 'Ada', apellidos: 'L.', dni: '123', nss: 'XYZ' }
        }
    }
};

test('muestra tarjeta de Alta cuando el usuario la posee', () => {
    store.dispatch(verifyUser({ user: dummyUser, token: 'tok' }));
    render(<Dashboard />);
    expect(screen.getByText(/alta seguridad social/i)).toBeInTheDocument();
});
