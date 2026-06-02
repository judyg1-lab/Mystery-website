import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {

    const token = localStorage.getItem('mystic_token');

  // if no token, alert and redirect to login page
    if (!token) {
        alert("【拒絕存取】請先進行身分認證儀式。");
        return <Navigate to="/" replace />;
    }

  // have token, allow access to the protected route
return children;
}