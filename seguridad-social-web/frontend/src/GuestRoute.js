// src/GuestRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Si el usuario YA está verificado (isVerified = true), 
 * redirige a /dashboard. Caso contrario, renderiza la ruta normal.
 */
const GuestRoute = ({ children }) => {
    const isVerified = useSelector((state) => state.auth.isVerified);

    if (isVerified) {
        // Si está logueado y trata de acceder a /login, por ejemplo,
        // lo redirigimos al dashboard.
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default GuestRoute;
