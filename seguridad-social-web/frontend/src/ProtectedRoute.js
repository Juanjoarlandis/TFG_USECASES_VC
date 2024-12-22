import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const isVerified = useSelector(state => state.auth.isVerified);

  if (!isVerified) {
    return <Navigate to="/verification-mode" replace />;
  }

  return children;
};

export default ProtectedRoute;
