import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();

  const isExplore = location.pathname === '/';
  const isExperts = location.pathname.startsWith('/expert');
  const isBookings = location.pathname.startsWith('/booking');
  const isProfile = location.pathname.startsWith('/profile') || location.pathname.startsWith('/user');

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
          to="/profile"
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span className="text-[11px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNav;
