// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isVerified: false,
    userData: null,
    token: null,
    flow: 'manual' // Valor por defecto.
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        verifyUser: (state, action) => {
            state.isVerified = true;
            state.userData = action.payload.user;
            state.token = action.payload.token;
            if (action.payload.flow) {
                state.flow = action.payload.flow;
            }
        },
        logout: (state) => {
            state.isVerified = false;
            state.userData = null;
            state.token = null;
            state.flow = 'manual';
        },
        initializeFromStorage: (state, action) => {
            const { token, user, flow } = action.payload;
            if (token && user) {
                state.isVerified = true;
                state.userData = user;
                state.token = token;
                if (flow) {
                    state.flow = flow;
                }
            }
        }
    },
});

export const { verifyUser, logout, initializeFromStorage } = authSlice.actions;
export default authSlice.reducer;
