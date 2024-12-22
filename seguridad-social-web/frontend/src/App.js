import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Alta from './pages/Alta/Alta';
import VerificationMethodSelect from './pages/VerificationMethodSelect/VerificationMethodSelect';
import LoginWithWallet from './pages/LoginWithWallet/LoginWithWallet';
import ProtectedRoute from './ProtectedRoute';
import VerificationTutorial from './pages/VerificationTutorial/VerificationTutorial';
import AltaAutomatica from './pages/Alta/AltaAutomatica';
import AltaAutomaticaInfo from './pages/Alta/AltaAutomaticaInfo';
import AltaEmission from './pages/Alta/AltaEmission';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <Router>
        <Header />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verification-tutorial" element={<VerificationTutorial />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verification-mode" element={<VerificationMethodSelect />} />
            <Route path="/login-with-wallet" element={<LoginWithWallet />} />
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
      <ToastContainer />
    </>
  );
}

export default App;
