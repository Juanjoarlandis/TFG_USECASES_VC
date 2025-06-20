// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 1) Importa el CSS de React-Toastify UNA sola vez
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

import App from './App';
import { Provider } from 'react-redux';
import store from './store/store';
import { initializeFromStorage } from './store/authSlice';
import './i18n';

// Inicializar estado desde localStorage
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
const flow = localStorage.getItem('flow') || 'manual';

if (token && user) {
  store.dispatch(initializeFromStorage({ token, user, flow }));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* 2) Monta aquí el ToastContainer */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <App />
    </Provider>
  </React.StrictMode>
);
