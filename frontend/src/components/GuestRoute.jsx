import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that prevents authenticated users from viewing guest-only pages
 * like /login, /register, /expert/login, /expert/register.
 * If user presses back/forward button to these pages, they are redirected to their dashboard.
 */
const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    if (user.role === 'EXPERT') {
      return <Navigate to="/expert/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
