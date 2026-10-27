import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Search,
  User,
  HelpCircle,
  Home,
  X,
  Phone,
  Mail
} from 'lucide-react';
import UserSearchBar from './UserSearchBar';
import NotificationDropdown from './NotificationDropdown';
import LogoutModal from './LogoutModal';

const UserLayout = ({ children, title = '', subtitle = '', hideTitleOnMobile = false }) => {
  const { user, logout } = useAuth();
  const { platformName, supportEmail, contactPhone, address } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  React.useEffect(() => {
    // User dashboard must never have black background theme
    document.documentElement.classList.add('light-theme');
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Find Experts', path: '/experts', icon: <Compass size={20} /> },
    { name: 'My Appointments', path: '/bookings', icon: <MessageSquare size={20} /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare size={20} /> },
    { name: 'Wallet', path: '/wallet', icon: <CreditCard size={20} /> },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    { name: 'Help & Support', path: '/support', icon: <HelpCircle size={20} /> },
  ];

  const displayName = user?.name || 'User';

  return (
    <div className="light-theme min-h-screen bg-background flex font-sans w-full max-w-full">

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border-color text-on-surface h-screen fixed z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ExpertHub" className="w-8 h-8 object-contain rounded-lg shrink-0 shadow-sm" />
            <span className="text-xl font-bold text-on-surface tracking-tight">{platformName || 'ExpertHub'}</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 scrollbar-hide py-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/profile'); // Fallback if needed
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface/60 hover:bg-surface-light hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-primary' : 'text-on-surface/50'}>
                      {React.cloneElement(item.icon, { size: 18 })}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4 py-3 border-t border-border-color bg-surface-light/40">
          <p className="text-[10px] font-bold text-on-surface/50 uppercase tracking-wider mb-1">Support Desk</p>
          <a href={`mailto:${supportEmail || 'support@stitchplatform.com'}`} className="text-xs text-primary font-medium hover:underline block truncate">
            {supportEmail || 'support@stitchplatform.com'}
          </a>
          <a href={`tel:${contactPhone || '+91 98765 43210'}`} className="text-xs text-on-surface/60 hover:underline block mt-0.5">
            {contactPhone || '+91 98765 43210'}
          </a>
        </div>

        <div className="p-4 border-t border-border-color">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-colors text-sm font-medium text-on-surface/60 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} className="text-on-surface/50" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen w-full min-w-0 max-w-full">

        {/* Mobile Header */}
        <header className="md:hidden bg-surface border-b border-border-color p-4 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Link
                to="/"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-on-surface hover:text-primary text-xs font-bold transition-all shadow-sm shrink-0"
                title="Back to Home"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Home</span>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="ExpertHub" className="w-7 h-7 object-contain rounded-md shrink-0" />
                <h1 className="text-lg font-bold text-on-surface">{platformName || 'ExpertHub'}</h1>
              </Link>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <NotificationDropdown role="USER" viewAllPath="/notifications" />
              <button
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="p-2 rounded-xl text-on-surface/70 hover:text-on-surface hover:bg-surface-light"
                title="Search"
              >
                {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-xl text-on-surface/80 hover:bg-surface-light">
                <Menu size={22} />
              </button>
            </div>
          </div>
          {isMobileSearchOpen && (
            <div className="mt-3 pt-3 border-t border-border-color animate-in fade-in slide-in-from-top-1 duration-150">
              <UserSearchBar className="w-full" />
            </div>
          )}
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-surface-light text-on-surface h-screen shadow-2xl">
              <div className="p-4 border-b border-border-color">
                <div className="flex items-center gap-2.5 px-2 py-1">
                  <img src="/logo.png" alt="ExpertHub" className="w-8 h-8 object-contain rounded-lg shrink-0" />
                  <span className="text-xl font-bold text-on-surface tracking-tight">{platformName || 'ExpertHub'}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/profile');
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface/60 hover:bg-surface-light hover:text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-primary' : 'text-on-surface/50'}>
                            {React.cloneElement(item.icon, { size: 18 })}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="px-4 pb-6 mt-auto space-y-1">
                <button
                  onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-red-50 hover:text-red-600 w-full text-left"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop Topbar */}
        <header className="hidden md:flex bg-background px-6 py-3.5 justify-between items-center sticky top-0 z-30 border-b border-border-color/60 backdrop-blur-md bg-background/95">
          <UserSearchBar />
          <div className="flex items-center gap-4">
            <NotificationDropdown role="USER" viewAllPath="/notifications" />
            {/* User Profile Trigger & Dropdown */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div
                className="flex items-center gap-3 border-l border-border-color pl-4 cursor-pointer select-none"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-on-surface leading-snug">{displayName}</p>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                    {user?.role === 'ADMIN' ? 'SUPER ADMIN' : user?.role || 'User'}
                  </p>
                </div>
                <div className="relative">
                  <img
                    src={user?.profileImage || localStorage.getItem('user_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`}
                    alt={displayName}
                    className="w-10 h-10 rounded-full shadow-sm border-2 border-border-color group-hover:border-primary object-cover transition-colors"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-surface"></span>
                </div>
              </div>

              {/* Hover & Click Dropdown Menu */}
              <div
                className={`absolute right-0 top-full pt-2 w-60 z-30 transition-all duration-200 transform ${isDropdownOpen
                    ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                    : 'opacity-0 invisible -translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:pointer-events-auto'
                  }`}
              >
                <div className="bg-surface rounded-2xl shadow-xl border border-border-color py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-color bg-surface-light/40">
                    <p className="text-sm font-bold text-on-surface truncate">{displayName}</p>
                    <p className="text-xs text-on-surface/60 truncate mt-0.5">{user?.email || 'Logged in'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary uppercase">
                      {user?.role === 'ADMIN' ? 'SUPER ADMIN' : user?.role || 'User'}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User size={16} className="text-on-surface/50" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <MessageSquare size={16} className="text-on-surface/50" />
                      <span>My Appointments</span>
                    </Link>
                    <Link
                      to="/wallet"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <CreditCard size={16} className="text-on-surface/50" />
                      <span>Wallet & Balance</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings size={16} className="text-on-surface/50" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/contact"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <HelpCircle size={16} className="text-on-surface/50" />
                      <span>Contact Us</span>
                    </Link>
                  </div>

                  <div className="px-4 py-2 border-t border-border-color bg-surface-light/50 text-[11px]">
                    <p className="font-semibold text-on-surface/70">Support Helpdesk:</p>
                    <p className="truncate text-primary font-medium">{supportEmail || 'support@stitchplatform.com'}</p>
                    <p className="text-on-surface/60">{contactPhone || '+91 98765 43210'}</p>
                  </div>

                  <div className="border-t border-border-color pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left font-medium"
                    >
                      <LogOut size={16} className="text-red-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-3.5 sm:p-5 md:p-6 w-full max-w-full min-w-0">
          <div className="max-w-7xl mx-auto">
            {title && (
              <div className={`mb-3 sm:mb-4 md:mb-5 ${hideTitleOnMobile ? 'hidden md:block' : ''}`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-on-surface/60 mt-0.5 md:mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default UserLayout;
