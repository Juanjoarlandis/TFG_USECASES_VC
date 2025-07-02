import authReducer, {
    verifyUser,
    logout,
    initializeFromStorage,
} from './authSlice';

describe('authSlice reducer', () => {
    const initialState = {
        isVerified: false,
        userData: null,
        token: null,
        flow: 'manual',
    };

    test('verifyUser: sets isVerified=true and stores user, token & flow', () => {
        const action = verifyUser({
            user: { firstName: 'Juan', lastName: 'Pérez' },
            token: 'abc123',
            flow: 'automatic',
        });
        const nextState = authReducer(initialState, action);

        expect(nextState.isVerified).toBe(true);
        expect(nextState.userData).toEqual({ firstName: 'Juan', lastName: 'Pérez' });
        expect(nextState.token).toBe('abc123');
        expect(nextState.flow).toBe('automatic');
    });

    test('logout: resets state to initial values', () => {
        // start from a non-initial state
        const loggedInState = {
            isVerified: true,
            userData: { firstName: 'Ana' },
            token: 'token123',
            flow: 'automatic',
        };
        const nextState = authReducer(loggedInState, logout());

        expect(nextState).toEqual(initialState);
    });

    describe('initializeFromStorage', () => {
        test('populates state when valid token and user are provided', () => {
            const payload = {
                token: 'stored-token',
                user: { firstName: 'Luis', age: 30 },
                flow: 'automatic',
            };
            const nextState = authReducer(initialState, initializeFromStorage(payload));

            expect(nextState.isVerified).toBe(true);
            expect(nextState.token).toBe('stored-token');
            expect(nextState.userData).toEqual({ firstName: 'Luis', age: 30 });
            expect(nextState.flow).toBe('automatic');
        });

        test('does nothing when token or user is missing', () => {
            const payloads = [
                { token: null, user: { firstName: 'X' } },
                { token: 't', user: null },
                { token: '', user: {} },
            ];

            payloads.forEach((payload) => {
                const nextState = authReducer(initialState, initializeFromStorage(payload));
                expect(nextState).toEqual(initialState);
            });
        });
    });
});
