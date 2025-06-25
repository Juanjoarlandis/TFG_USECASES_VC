import reducer, {
    verifyUser,
    logout,
    initializeFromStorage
} from '../store/authSlice';

const base = { isVerified: false, userData: null, token: null, flow: 'manual' };

test('verifyUser llena estado', () => {
    const res = reducer(
        base,
        verifyUser({ user: { firstName: 'Ada' }, token: 'x', flow: 'automatic' })
    );
    expect(res).toMatchObject({
        isVerified: true,
        userData: { firstName: 'Ada' },
        flow: 'automatic'
    });
});

test('logout reinicia al estado inicial', () => {
    const logged = { ...base, isVerified: true, token: 't' };
    expect(reducer(logged, logout())).toEqual(base);
});

test('initializeFromStorage hidrata correctamente', () => {
    const payload = { token: '1', user: { firstName: 'Bob' }, flow: 'manual' };
    const res = reducer(base, initializeFromStorage(payload));
    expect(res.isVerified).toBe(true);
    expect(res.userData.firstName).toBe('Bob');
});
