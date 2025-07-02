/**
 * @module src/App
 * @description
 * Main application component that sets up routing and global layout
 * (Header/Footer). Defines public, guest-only and protected routes
 * for the verification, issuance and dashboard flows.
 *
 * Uses React Router v6 with custom <ProtectedRoute> and <GuestRoute>
 * wrappers to guard routes based on authentication state.
 */

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
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import './App.css';

/**
 * Application root component.
 *
 * @component
 * @returns {JSX.Element} The application layout with header, footer, and routed pages.
 */
function App() {
  return (
    <Router>
      {/* Global header displayed on all pages */}
      <Header />

      {/* Main content area where routed components will render */}
      <div className="app-content">
        <Routes>
          {/** Public route: Home page */}
          <Route path="/" element={<Home />} />

          {/** Guest-only routes: accessible only when not authenticated */}
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

          {/** Protected routes: accessible only when authenticated */}
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

      {/* Global footer displayed on all pages */}
      <Footer />
    </Router>
  );
}

export default App;
