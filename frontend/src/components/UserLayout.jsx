import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Compass, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  User,
  HelpCircle,
  Home
} from 'lucide-react';

const UserLayout = ({ children, title = '', subtitle = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="min-h-screen bg-background flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border-color text-on-surface h-screen fixed z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ExpertHub" className="w-8 h-8 object-contain rounded-lg shrink-0 shadow-sm" />
            <span className="text-xl font-bold text-on-surface tracking-tight">ExpertHub</span>
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
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${Number(
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface/60 hover:bg-surface-light hover:text-on-surface'
                  ).toFixed(2)}`}
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
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-surface border-b border-border-color p-4 flex justify-between items-center sticky top-0 z-10">
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
              <h1 className="text-lg font-bold text-on-surface">ExpertHub</h1>
            </Link>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-on-surface/80">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-surface-light text-on-surface h-screen shadow-2xl">
              <div className="p-4 border-b border-border-color">
                <div className="flex items-center gap-2.5 px-2 py-1">
                  <img src="/logo.png" alt="ExpertHub" className="w-8 h-8 object-contain rounded-lg shrink-0" />
                  <span className="text-xl font-bold text-on-surface tracking-tight">ExpertHub</span>
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
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${Number(
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-on-surface/60 hover:bg-surface-light hover:text-on-surface'
                        ).toFixed(2)}`}
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
        <header className="hidden md:flex bg-background p-6 justify-between items-center sticky top-0 z-10">
          <div className="flex items-center bg-surface px-4 py-2.5 rounded-2xl w-[400px] shadow-sm border-0 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-on-surface/50" />
            <input type="text" placeholder="Search experts, categories, or anything..." className="bg-transparent border-none outline-none ml-3 text-sm w-full text-on-surface placeholder:text-on-surface/50" />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-on-surface/60 hover:text-primary transition-colors relative">
              <Bell size={20} />
            </button>
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
                className={`absolute right-0 top-full pt-2 w-60 z-30 transition-all duration-200 transform ${
                  isDropdownOpen 
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
                      to="/support" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-light hover:text-primary transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <HelpCircle size={16} className="text-on-surface/50" />
                      <span>Help & Support</span>
                    </Link>
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
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-on-surface/60 mt-1">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
