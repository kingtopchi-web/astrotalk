import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route wrapper that prevents authenticated users from viewing redundant login pages.
 * - If user is logged in as USER:
 *   - visiting /login or /register redirects to /dashboard
 *   - visiting /expert/login or /expert/register is ALLOWED (they can log into / register for their expert account)
 * - If user is logged in as EXPERT:
 *   - visiting /expert/login redirects to /expert/dashboard
 *   - visiting /login or /register is ALLOWED (they can log into their client account)
 */
const GuestRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (user) {
    const isExpertRoute = location.pathname.startsWith('/expert/');

    // Logged in as EXPERT
    if (user.role === 'EXPERT') {
      if (isExpertRoute) {
        return <Navigate to="/expert/dashboard" replace />;
      }
      // Allowed to view client /login or /register to log in / switch to client account
      return <Outlet />;
    }

    // Logged in as USER
    if (user.role === 'USER') {
      if (!isExpertRoute) {
        return <Navigate to="/dashboard" replace />;
      }
      // Allowed to view /expert/login or /expert/register to log into / register as expert
      return <Outlet />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
