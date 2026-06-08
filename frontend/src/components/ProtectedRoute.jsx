import React from 'react';
import { Navigate } from 'react-router-dom';

function clearSession() {
  localStorage.removeItem('mystic_token');
  localStorage.removeItem('mystic_token_expires_at');
  localStorage.removeItem('user_info');
}

function getValidToken() {
  const token = localStorage.getItem('mystic_token');
  const expiresAt = Number(localStorage.getItem('mystic_token_expires_at') || 0);

  if (!token) return '';

  let jwtExpired = false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    jwtExpired = Boolean(payload?.exp && Date.now() >= payload.exp * 1000);
  } catch {
    jwtExpired = true;
  }

  if ((expiresAt > 0 && Date.now() >= expiresAt) || jwtExpired) {
    clearSession();
    return '';
  }

  return token;
}

export default function ProtectedRoute({ children }) {
  if (!getValidToken()) {
    alert('請先登入，或重新登入已過期的帳號。');
    return <Navigate to="/" replace />;
  }

  return children;
}
