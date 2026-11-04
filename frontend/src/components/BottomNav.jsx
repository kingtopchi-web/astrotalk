import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BottomNav() {
  const location = useLocation();
  const { user, auth } = useAuth();

  const currentUser = user || auth?.user;
  const role = currentUser?.role?.toUpperCase();
  const isExpert = role === 'EXPERT';
  const isAdmin = role === 'ADMIN';

  // Expert navigation tabs
  if (isExpert) {
    const isDashboard = location.pathname === '/expert/dashboard';
    const isConsultations = location.pathname.startsWith('/expert/consultation') || location.pathname.startsWith('/expert/schedule');
    const isEarnings = location.pathname.startsWith('/expert/earnings');
    const isMarketplace = location.pathname.startsWith('/marketplace');
    const isProfile = location.pathname.startsWith('/expert/profile') || location.pathname.startsWith('/expert/settings');

    return (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 px-1">
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isDashboard ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/expert/dashboard"
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isConsultations ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/expert/consultations"
          >
            <span className="material-symbols-outlined text-[22px]">event_available</span>
            <span className="text-[11px] font-medium">Sessions</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isEarnings ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/expert/earnings"
          >
            <span className="material-symbols-outlined text-[22px]">payments</span>
            <span className="text-[11px] font-medium">Earnings</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isMarketplace ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/marketplace/seller"
          >
            <span className="material-symbols-outlined text-[22px]">storefront</span>
            <span className="text-[11px] font-medium">Market</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isProfile ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/expert/profile"
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <span className="text-[11px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Admin navigation tabs
  if (isAdmin) {
    const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard');
    const isMarketplace = location.pathname.startsWith('/marketplace');
    const isRazorpay = location.pathname.startsWith('/razorpay');

    return (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 px-1">
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isDashboard ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/admin/dashboard"
          >
            <span className="material-symbols-outlined text-[22px]">dashboard</span>
            <span className="text-[11px] font-medium">Dashboard</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isMarketplace ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/marketplace-management"
          >
            <span className="material-symbols-outlined text-[22px]">storefront</span>
            <span className="text-[11px] font-medium">Market</span>
          </Link>
          <Link 
            className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
              isRazorpay ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`} 
            to="/razorpay-accounts"
          >
            <span className="material-symbols-outlined text-[22px]">account_balance</span>
            <span className="text-[11px] font-medium">Payouts</span>
          </Link>
          <Link 
            className="flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 text-on-surface-variant hover:text-on-surface" 
            to="/settings"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-[11px] font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    );
  }

  // User / Guest navigation tabs
  const isExplore = location.pathname === '/' || location.pathname.startsWith('/categories');
  const isExperts = location.pathname.startsWith('/experts') || location.pathname.startsWith('/expert/');
  const isBookings = location.pathname.startsWith('/booking');
  const isProfile = location.pathname.startsWith('/profile') || location.pathname.startsWith('/wallet') || location.pathname.startsWith('/dashboard');

  const profileTarget = currentUser ? '/profile' : '/login';

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-16 px-2">
        <Link 
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
            isExplore ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`} 
          to="/"
        >
          <span className="material-symbols-outlined text-[22px]">explore</span>
          <span className="text-[11px] font-medium">Explore</span>
        </Link>
        <Link 
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
            isExperts ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`} 
          to="/experts"
        >
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
          <span className="text-[11px] font-medium">Experts</span>
        </Link>
        <Link 
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
            isBookings ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`} 
          to="/bookings"
        >
          <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          <span className="text-[11px] font-medium">Bookings</span>
        </Link>
        <Link 
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
            isProfile ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
          }`} 
          to={profileTarget}
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span className="text-[11px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNav;
