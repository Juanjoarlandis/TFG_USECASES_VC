/**
 * @module src/store/authSlice
 * @description
 * Redux slice for authentication state, handling:
 *  - Verification status
 *  - User data from credential verification
 *  - JWT token storage
 *  - Flow mode ('manual' or 'automatic')
 *
 * @requires @reduxjs/toolkit~createSlice
 */

/**
 * @typedef {Object} AuthState
 * @property {boolean} isVerified    - Indicates if the user has been verified.
 * @property {Object|null} userData  - User data returned from the backend upon verification.
 * @property {string|null} token     - JWT access token for authenticated requests.
 * @property {string} flow           - Verification flow mode, 'manual' or 'automatic'.
 */

/** @type {AuthState} */
const initialState = {
    /** @type {boolean} */
    isVerified: false,
    /** @type {Object|null} */
    userData: null,
    /** @type {string|null} */
    token: null,
    /** @type {string} Defaults to 'manual' */
    flow: 'manual'
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        /**
         * Marks the user as verified and stores user data and token.
         *
         * @param {AuthState} state - Current authentication state.
         * @param {Object} action
         * @param {Object} action.payload
         * @param {Object} action.payload.user  - User data object.
         * @param {string} action.payload.token - JWT access token.
         * @param {string} [action.payload.flow] - Optional flow mode ('automatic').
         */
        verifyUser: (state, action) => {
            state.isVerified = true;
            state.userData = action.payload.user;
            state.token = action.payload.token;
            if (action.payload.flow) {
                state.flow = action.payload.flow;
            }
        },
        /**
         * Logs out the user by resetting the authentication state to defaults.
         *
         * @param {AuthState} state - Current authentication state.
         */
        logout: (state) => {
            state.isVerified = false;
            state.userData = null;
            state.token = null;
            state.flow = 'manual';
        },
        /**
         * Initializes authentication state from persisted storage.
         * If valid token and user are provided, marks as verified.
         *
         * @param {AuthState} state - Current authentication state.
         * @param {Object} action
         * @param {Object} action.payload
         * @param {string} action.payload.token - Persisted JWT access token.
         * @param {Object} action.payload.user  - Persisted user data object.
         * @param {string} [action.payload.flow] - Persisted flow mode.
         */
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
    }
});

export const { verifyUser, logout, initializeFromStorage } = authSlice.actions;
export default authSlice.reducer;
