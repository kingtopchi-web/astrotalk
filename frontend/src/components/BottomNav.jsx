import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { ThemeToggle } from './ThemeToggle';
import { getApiUrl } from '../utils/apiConfig';

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, auth, logout } = useAuth();
  const { platformName } = usePlatformSettings();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  const currentUser = user || auth?.user;
  const role = currentUser?.role?.toUpperCase();
  const isExpert = role === 'EXPERT';
  const isAdmin = role === 'ADMIN';

  // Routes where BottomNav must be hidden on mobile
  const hiddenRoutes = [
    '/wallet',
    '/messages',
    '/expert/messages',
    '/settings',
    '/expert/settings',
    '/live',
    '/login',
    '/register',
    '/expert/login',
    '/expert/register',
    '/forgot-password',
    '/reset-password'
  ];

  const isHidden = hiddenRoutes.some((route) => location.pathname.startsWith(route));

  // Lock scroll when full-cover account drawer is open
  useEffect(() => {
    if (isAccountOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAccountOpen]);

  // Close drawer on path change
  useEffect(() => {
    setIsAccountOpen(false);
  }, [location.pathname]);

  // Fetch quick balance for user when drawer is opened
  useEffect(() => {
    if (isAccountOpen && currentUser && !isExpert && !isAdmin) {
      const token = localStorage.getItem('token') || auth?.token;
      if (token) {
        axios
          .get(getApiUrl('/wallet'), {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then((res) => {
            if (res.data?.balance !== undefined) {
              setWalletBalance(res.data.balance);
            }
          })
          .catch(() => {});
      }
    }
  }, [isAccountOpen, currentUser, isExpert, isAdmin, auth?.token]);

  if (isHidden) {
    return null;
  }

  const handleLinkClick = (path) => {
    setIsAccountOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setIsAccountOpen(false);
    if (isExpert) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.patch(getApiUrl('/expert/profile'), { onlineStatus: 'offline' }, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
      } catch (e) {}
    }
    logout();
    navigate('/');
  };

  // Bottom navigation tab active states
  const isHome = location.pathname === '/' || location.pathname.startsWith('/categories');
  const isExperts = location.pathname.startsWith('/experts') || location.pathname.startsWith('/expert/');
  const isBookings = location.pathname.startsWith('/booking');
  const isExpertSessions = location.pathname.startsWith('/expert/consultation') || location.pathname.startsWith('/expert/schedule');
  const isExpertEarnings = location.pathname.startsWith('/expert/earnings');
  const isMarket = location.pathname.startsWith('/marketplace');

  return (
    <>
      {/* ========================================================= */}
      {/* FULL COVER MOBILE APP ACCOUNT DRAWER (MODAL LIKE NATIVE APP) */}
      {/* ========================================================= */}
      {isAccountOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-surface dark:bg-slate-950 flex flex-col overflow-y-auto animate-in slide-in-from-bottom duration-200">
          {/* Header Bar */}
          <div className="sticky top-0 z-10 bg-surface/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
              </div>
              <h2 className="text-base font-extrabold text-on-surface">Account</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsAccountOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-on-surface flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              aria-label="Close Account Menu"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex-1 p-4 pb-20 space-y-4">
            {/* User Profile Identity Card */}
            {currentUser ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-slate-50 to-indigo-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-primary/20 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage}
                        alt={currentUser.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/40 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-base text-on-surface truncate">
                        {currentUser.name || 'User'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25 shrink-0">
                        {isExpert ? 'Expert' : isAdmin ? 'Admin' : 'Client'}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {currentUser.phone || currentUser.email || 'Verified Account'}
                    </p>
                  </div>
                </div>

                {/* Live Wallet / Earnings Quick Bar */}
                {!isAdmin && (
                  <div className="mt-3.5 pt-3 border-t border-border/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                          {isExpert ? 'Earnings Hub' : 'Wallet Balance'}
                        </span>
                        <span className="text-sm font-black text-on-surface">
                          {isExpert ? 'Manage Payouts' : walletBalance !== null ? `₹${Number(walletBalance).toFixed(2)}` : 'Check Balance'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkClick(isExpert ? '/expert/earnings' : '/wallet')}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>{isExpert ? 'View' : 'Add Funds'}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Auth Banner */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-50/60 dark:from-slate-900 dark:to-slate-900 border border-border shadow-xs text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">person</span>
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-on-surface">Welcome to {platformName || 'ExpertHub'}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Login to book sessions, chat, and manage consultations.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/login')}
                    className="py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/register')}
                    className="py-2.5 px-3 rounded-xl bg-surface border border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 active:scale-95 cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* Quick Theme Switcher */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-xs font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">palette</span>
                Appearance Theme
              </span>
              <ThemeToggle variant="segmented" />
            </div>

            {/* Menu List */}
            <div className="rounded-2xl bg-surface-card border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
              {isExpert ? (
                /* Expert Options */
                <>
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/dashboard')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span>
                      <span className="text-sm font-semibold text-on-surface">Expert Dashboard</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/services')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">business_center</span>
                      <span className="text-sm font-semibold text-on-surface">Services & Pricing</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/consultations')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">event_available</span>
                      <span className="text-sm font-semibold text-on-surface">My Consultation Sessions</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/schedule')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                      <span className="text-sm font-semibold text-on-surface">Manage Availability & Rates</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/messages')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">chat</span>
                      <span className="text-sm font-semibold text-on-surface">Messages</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/earnings')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
                      <span className="text-sm font-semibold text-on-surface">Earnings & Payouts</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/clients')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">group</span>
                      <span className="text-sm font-semibold text-on-surface">Clients</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/marketplace/seller')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">storefront</span>
                      <span className="text-sm font-semibold text-on-surface">Digital Products Market</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/expert/profile')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">account_circle</span>
                      <span className="text-sm font-semibold text-on-surface">Edit Profile & Bio</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>
                </>
              ) : isAdmin ? (
                /* Admin Options */
                <>
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/admin/dashboard')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span>
                      <span className="text-sm font-semibold text-on-surface">Admin Dashboard</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/admin/experts')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">badge</span>
                      <span className="text-sm font-semibold text-on-surface">Manage Experts</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLinkClick('/marketplace-management')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">storefront</span>
                      <span className="text-sm font-semibold text-on-surface">Marketplace Catalog</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>
                </>
              ) : (
                /* Standard User / Client Options */
                <>
                  {currentUser && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleLinkClick('/dashboard')}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span>
                          <span className="text-sm font-semibold text-on-surface">My Dashboard</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLinkClick('/bookings')}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">history</span>
                          <span className="text-sm font-semibold text-on-surface">My Consultations</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLinkClick('/wallet')}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">account_balance_wallet</span>
                          <span className="text-sm font-semibold text-on-surface">Wallet & Transactions</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLinkClick('/marketplace/my-purchases')}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">shopping_bag</span>
                          <span className="text-sm font-semibold text-on-surface">Digital Purchases</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLinkClick('/profile?edit=true')}
                        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-primary">edit</span>
                          <span className="text-sm font-semibold text-on-surface">Edit Profile</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/categories')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">category</span>
                      <span className="text-sm font-semibold text-on-surface">Browse All Categories</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/marketplace')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">storefront</span>
                      <span className="text-sm font-semibold text-on-surface">Digital Marketplace</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkClick('/support')}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
                      <span className="text-sm font-semibold text-on-surface">Help & Support</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
                  </button>
                </>
              )}
            </div>

            {/* Settings (Near Logout) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => handleLinkClick(isExpert ? '/expert/settings' : '/settings')}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-surface-card border border-border hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
                  <span className="text-sm font-semibold text-on-surface">Settings</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
              </button>
            )}

            {/* Logout / Exit */}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-sm border border-red-200/80 dark:border-red-900/50 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Log Out</span>
              </button>
            )}

            <p className="text-center text-[11px] text-on-surface-variant/70 pt-2 font-medium">
              {platformName || 'ExpertHub'} App • 100% Encrypted & Verified
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PERSISTENT DOCKED MOBILE BOTTOM NAVIGATION BAR */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex justify-around items-center h-16 px-1.5">
          {isExpert ? (
            /* Expert Bottom Tabs */
            <>
              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isHome ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/"
              >
                <span className="material-symbols-outlined text-[22px]">home</span>
                <span className="text-[11px] font-medium">Home</span>
              </Link>

              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isExpertSessions ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/expert/consultations"
              >
                <span className="material-symbols-outlined text-[22px]">event_available</span>
                <span className="text-[11px] font-medium">Sessions</span>
              </Link>

              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isExpertEarnings ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/expert/earnings"
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                <span className="text-[11px] font-medium">Earnings</span>
              </Link>

              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isMarket ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/marketplace/seller"
              >
                <span className="material-symbols-outlined text-[22px]">storefront</span>
                <span className="text-[11px] font-medium">Market</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsAccountOpen(true)}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 cursor-pointer ${
                  isAccountOpen ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
                <span className="text-[11px] font-medium">Account</span>
              </button>
            </>
          ) : isAdmin ? (
            /* Admin Bottom Tabs */
            <>
              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isHome ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/"
              >
                <span className="material-symbols-outlined text-[22px]">home</span>
                <span className="text-[11px] font-medium">Home</span>
              </Link>

              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  location.pathname.startsWith('/marketplace') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/marketplace-management"
              >
                <span className="material-symbols-outlined text-[22px]">storefront</span>
                <span className="text-[11px] font-medium">Market</span>
              </Link>

              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  location.pathname.startsWith('/razorpay') ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/razorpay-accounts"
              >
                <span className="material-symbols-outlined text-[22px]">account_balance</span>
                <span className="text-[11px] font-medium">Payouts</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsAccountOpen(true)}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 cursor-pointer ${
                  isAccountOpen ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
                <span className="text-[11px] font-medium">Account</span>
              </button>
            </>
          ) : (
            /* Client / Guest Bottom Tabs */
            <>
              <Link
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 ${
                  isHome ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                to="/"
              >
                <span className="material-symbols-outlined text-[22px]">home</span>
                <span className="text-[11px] font-medium">Home</span>
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
                to={currentUser ? '/bookings' : '/login'}
              >
                <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                <span className="text-[11px] font-medium">Bookings</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsAccountOpen(true)}
                className={`flex flex-col items-center justify-center min-w-[56px] h-12 transition-all gap-0.5 cursor-pointer ${
                  isAccountOpen ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
                <span className="text-[11px] font-medium">Account</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}

export default BottomNav;
