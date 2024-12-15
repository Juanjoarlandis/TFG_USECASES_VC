// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isVerified: false,
    userData: null,
    token: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        verifyUser: (state, action) => {
            state.isVerified = true;
            state.userData = action.payload.user;
            state.token = action.payload.token;
        },
        logout: (state) => {
            state.isVerified = false;
            state.userData = null;
            state.token = null;
        },
        initializeFromStorage: (state, action) => {
            const { token, user } = action.payload;
            if (token && user) {
                state.isVerified = true;
                state.userData = user;
                state.token = token;
            }
        }
    },
});

export const { verifyUser, logout, initializeFromStorage } = authSlice.actions;
export default authSlice.reducer;
