import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Provider } from 'react-redux';
import store from './store/store';
import { initializeFromStorage } from './store/authSlice';
import './i18n';

// Inicializar estado desde localStorage
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
if (token && user) {
  store.dispatch(initializeFromStorage({ token, user }));
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
