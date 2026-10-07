import React from 'react';
import { Link } from 'react-router-dom';

function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-space-xs">
        <Link className="flex flex-col items-center justify-center min-w-[56px] h-12 text-primary font-bold transition-all gap-0.5" to="/">
          <span className="material-symbols-outlined text-[22px]">explore</span>
          <span className="font-label-sm text-label-sm">Explore</span>
        </Link>
        <Link className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-0.5" to="/experts">
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
          <span className="font-label-sm text-label-sm">Experts</span>
        </Link>
        <Link className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-0.5" to="/market">
          <span className="material-symbols-outlined text-[22px]">storefront</span>
          <span className="font-label-sm text-label-sm">Market</span>
        </Link>
        <Link className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-0.5 relative" to="/bookings">
          <span className="material-symbols-outlined text-[22px]">calendar_month</span>
          <span className="font-label-sm text-label-sm">Bookings</span>
          <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-secondary text-on-secondary font-label-sm text-[9px] flex items-center justify-center font-bold">2</span>
        </Link>
        <Link className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-0.5" to="/profile">
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
          <span className="font-label-sm text-label-sm">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

export default BottomNav;
