// src/store/authSlice.test.js
import authReducer, { verifyUser, logout, initializeFromStorage } from './authSlice';

const initialState = { isVerified: false, userData: null, token: null, flow: 'manual' };

test('verifyUser establece isVerified a true y guarda datos', () => {
    const action = verifyUser({ user: { firstName: 'Juan' }, token: 'abc', flow: 'automatic' });
    const nextState = authReducer(initialState, action);
    expect(nextState.isVerified).toBe(true);
    expect(nextState.userData.firstName).toBe('Juan');
    expect(nextState.flow).toBe('automatic');
});
