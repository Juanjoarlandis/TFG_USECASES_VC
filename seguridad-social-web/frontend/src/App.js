// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Alta from './pages/Alta/Alta';
import AltaAutomaticaInfo from './pages/Alta/AltaAutomaticaInfo';
import AltaAutomatica from './pages/Alta/AltaAutomatica';
import AltaEmission from './pages/Alta/AltaEmission';
import VerificationMethodSelect from './pages/VerificationMethodSelect/VerificationMethodSelect';
import LoginWithWallet from './pages/LoginWithWallet/LoginWithWallet';
import VerificationTutorial from './pages/VerificationTutorial/VerificationTutorial';

// Rutas protegidas y de invitado
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <div className="app-content">
        <Routes>
          {/* Rutas de acceso público */}
          <Route path="/" element={<Home />} />

          {/* Rutas protegidas para “invitados” (GuestRoute):
              Estas solo se pueden visitar si NO estás logueado */}
          <Route
            path="/verification-mode"
            element={
              <GuestRoute>
                <VerificationMethodSelect />
              </GuestRoute>
            }
          />

          <Route
            path="/login-with-wallet"
            element={
              <GuestRoute>
                <LoginWithWallet />
              </GuestRoute>
            }
          />

          <Route
            path="/verification-tutorial"
            element={
              <GuestRoute>
                <VerificationTutorial />
              </GuestRoute>
            }
          />

          <Route
            path="/register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />

          {/* Rutas protegidas (solo para usuarios verificados) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alta"
            element={
              <ProtectedRoute>
                <Alta />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alta-automatica-info"
            element={
              <ProtectedRoute>
                <AltaAutomaticaInfo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alta-automatica"
            element={
              <ProtectedRoute>
                <AltaAutomatica />
              </ProtectedRoute>
            }
          />

          <Route
            path="/alta-emision"
            element={
              <ProtectedRoute>
                <AltaEmission />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
