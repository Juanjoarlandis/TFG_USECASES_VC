/**
 * @module src/store/store
 * @description
 * Configures and exports the Redux store for the application, combining all slices.
 *
 * Currently includes:
 *  - auth: Authentication state slice (`authSlice`)
 *
 * Usage:
 * ```js
 * import store from './store';
 * import { Provider } from 'react-redux';
 *
 * <Provider store={store}>
 *   <App />
 * </Provider>
 * ```
 *
 * @requires @reduxjs/toolkit~configureStore
 * @requires ./authSlice~authReducer
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

/**
 * Configures the Redux store with the root reducer.
 *
 * @constant {import('@reduxjs/toolkit').EnhancedStore}
 * @default
 */
const store = configureStore({
    reducer: {
        /**
         * @property {import('./authSlice').AuthState} auth
         * @description Authentication slice managing verification status, user data and token.
         */
        auth: authReducer,
    },
});

export default store;
