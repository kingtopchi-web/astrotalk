import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import NotificationDropdown from './NotificationDropdown';
import LogoutModal from './LogoutModal';

function Header() {
  const { auth, logout } = useAuth();
  const { platformName, supportEmail, contactPhone } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('app_theme') === 'dark';
  });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (location.pathname === '/') {
      const savedTheme = localStorage.getItem('home_theme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.classList.remove('light-theme');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.add('light-theme');
        setIsDarkMode(false);
      }
    } else {
      document.documentElement.classList.add('light-theme');
      setIsDarkMode(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Fetch categories for the navbar dropdown
    fetch('https://astrotalk-hlg2.onrender.com/api/public/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.add('light-theme');
      setIsDarkMode(false);
      localStorage.setItem('home_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      setIsDarkMode(true);
      localStorage.setItem('home_theme', 'dark');
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  const getNavLinks = () => {
    const role = auth.user?.role;
    
    const categoryDropdown = categories.map(cat => ({
      name: cat.name,
      path: `/experts?categoryId=${cat._id}`,
      icon: cat.icon || 'category'
    }));

    // Add 'All Categories' option at the top
    const categoriesMenu = {
      name: 'Categories',
      path: '#',
      dropdown: [
        { name: 'All Categories', path: '/categories', icon: 'list' },
        ...categoryDropdown
      ]
    };
    
    // Core public links
    const publicLinks = [
      { name: 'Find Experts', path: '/experts' },
      categoriesMenu,
      { name: 'Free Services', path: '/free-services' },
      { name: 'Blog / Resources', path: '/blog' },
      { name: 'Contact', path: '/contact' },
    ];

    if (!auth.token) {
      return publicLinks;
    }

    if (role === 'EXPERT') {
      return [
        { name: 'Scheduled Consultations', path: '/expert/consultations' },
        { name: 'Upcoming Consultations', path: '/expert/consultations' },
        { name: 'Earnings', path: '/expert/earnings' },
        { name: 'Blog / Resources', path: '/blog' },
      ];
    }

    if (role === 'ADMIN') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Manage Experts', path: '/admin/experts' },
        { name: 'Manage Users', path: '/admin/users' },
      ];
    }

    // Default USER
    return [
      { name: 'Find Experts', path: '/experts' },
      categoriesMenu,
      { name: 'Free Services', path: '/free-services' },
      { 
        name: 'Consultations', 
        path: '#',
        dropdown: [
          { name: 'Chat with Expert', path: '/experts?mode=chat', icon: 'chat' },
          { name: 'Audio Call with Expert', path: '/experts?mode=audio', icon: 'call' },
          { name: 'Video Call with Expert', path: '/experts?mode=video', icon: 'videocam' },
          { name: 'My Consultations', path: '/bookings', icon: 'history' },
          { name: 'Upcoming Consultations', path: '/bookings?tab=upcoming', icon: 'event' },
          { name: 'Ongoing Consultations', path: '/bookings?tab=ongoing', icon: 'timelapse' },
          { name: 'Completed Consultations', path: '/bookings?tab=completed', icon: 'check_circle' },
        ]
      },
      { name: 'Blog / Resources', path: '/blog' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-panel-dark border-b border-border transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        {/* Logo & Mobile Back to Home */}
        <div className="flex items-center flex-1 gap-2.5">
          {location.pathname !== '/' && (
            <Link
              to="/"
              className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-on-surface hover:text-primary text-xs font-bold transition-all shadow-sm shrink-0"
              title="Back to Home"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Home</span>
            </Link>
          )}
          <Link to="/" className="flex items-center gap-2.5 group">
             <img 
               src="/logo.png" 
               alt={`${platformName || 'ExpertHub'} Logo`} 
               className="w-9 h-9 object-contain rounded-lg shrink-0 transform group-hover:scale-105 transition-transform" 
             />
             <span className="font-heading font-extrabold text-xl text-on-background tracking-tight">
               {platformName || 'ExpertHub'}
             </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8" ref={dropdownRef}>
          {navLinks.map((link, idx) => (
            <div key={idx} className="relative group h-full flex items-center">
              {link.dropdown ? (
                <button 
                  onClick={() => setDropdownOpen(dropdownOpen === link.name ? null : link.name)}
                  className="flex items-center font-body font-medium text-sm text-on-surface hover:text-primary transition-colors focus:outline-none h-full py-4"
                >
                  {link.name} 
                  <span className={`material-symbols-outlined text-[16px] align-middle transition-transform group-hover:rotate-180`}>
                    keyboard_arrow_down
                  </span>
                </button>
              ) : (
                <Link to={link.path} className="font-body font-medium text-sm text-on-surface hover:text-primary transition-colors h-full flex items-center py-4">
                  {link.name}
                </Link>
              )}
              
              {/* Dropdown Menu */}
              {link.dropdown && (
                <div className="absolute top-[80%] pt-2 left-1/2 -translate-x-1/2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-surface-card border border-border rounded-2xl shadow-card py-2">
                    {link.dropdown.map((dropItem, dIdx) => (
                      <Link 
                        key={dIdx} 
                        to={dropItem.path} 
                        onClick={() => setDropdownOpen(null)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">{dropItem.icon}</span>
                        {dropItem.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Section (Auth / Profile) */}
        <div className="hidden md:flex items-center justify-end gap-4 flex-1">
          {/* Theme Toggle Button - Only on Home */}
          {location.pathname === '/' && (
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
              title="Toggle Theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          )}
          
          {!auth.token ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-body font-bold text-sm bg-primary text-background hover:bg-primary-light transition-colors px-6 py-2 rounded-full shadow-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">person</span>
                Login
              </Link>
            </div>
          ) : (
             <div className="flex items-center gap-4 relative" ref={dropdownRef}>

               
               {/* Notifications */}
               <NotificationDropdown 
                 role={auth.user?.role || 'USER'} 
                 viewAllPath={auth.user?.role === 'EXPERT' ? '/expert/notifications' : '/notifications'} 
               />
               
               {/* Profile Dropdown Trigger */}
               <div className="relative group h-full flex items-center">
                 <button 
                   onClick={() => setDropdownOpen(dropdownOpen === 'profile' ? null : 'profile')}
                   className="flex items-center gap-2 focus:outline-none py-4"
                 >
                   <div className="w-10 h-10 rounded-full bg-secondary-light border border-secondary/20 overflow-hidden group-hover:border-secondary transition-colors relative">
                      <img 
                        src={auth.user?.profileImage || localStorage.getItem('user_avatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user?.name || 'User')}&background=2563eb&color=fff`} 
                        alt={auth.user?.name || 'Profile'}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user?.name || 'User')}&background=2563eb&color=fff`;
                        }}
                      />
                   </div>
                 </button>
  
                 {/* Profile Dropdown Menu */}
                 <div className="absolute top-[80%] pt-2 right-0 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                   <div className="bg-surface-card border border-border rounded-2xl shadow-card py-2">
                     <div className="px-4 py-3 border-b border-border mb-2">
                       <p className="text-sm font-bold text-on-background truncate">{auth.user?.name || 'User'}</p>
                       <p className="text-xs text-on-surface-variant truncate">{auth.user?.email}</p>
                     </div>
                     
                     {auth.user?.role === 'EXPERT' ? (
                       <>
                         <Link to="/expert/dashboard" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span> Dashboard
                         </Link>
                         <Link to="/expert/profile" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">person</span> My Profile
                         </Link>
                         <Link to="/expert/settings" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">settings</span> Settings
                         </Link>
                       </>
                     ) : auth.user?.role === 'ADMIN' ? (
                       <Link to="/admin/dashboard" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                         <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span> Admin Dashboard
                       </Link>
                     ) : (
                       <>
                         <Link to="/dashboard" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">dashboard</span> Dashboard
                         </Link>
                         <Link to="/profile" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">person</span> My Profile
                         </Link>
                         <Link to="/settings/edit-profile" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">edit</span> Edit Profile
                         </Link>
                         <Link to="/bookings" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">history</span> My Consultations
                         </Link>
                         <Link to="/wallet" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">account_balance_wallet</span> Wallet & Transactions
                         </Link>
                         <Link to="/settings" onClick={() => setDropdownOpen(null)} className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-on-surface">
                           <span className="material-symbols-outlined text-[18px] text-primary">settings</span> Account Settings
                         </Link>
                       </>
                     )}
                     
                     <div className="border-t border-border mt-2 pt-2">
                       <button onClick={() => { setDropdownOpen(null); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-error/10 hover:text-error transition-colors text-sm font-bold text-error">
                         <span className="material-symbols-outlined text-[18px]">logout</span> Logout
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Mobile Menu Toggle & Theme */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-primary"
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[22px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          
          {auth.token && (
            <NotificationDropdown 
              role={auth.user?.role || 'USER'} 
              viewAllPath={auth.user?.role === 'EXPERT' ? '/expert/notifications' : '/notifications'} 
            />
          )}

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-on-surface-variant p-2 -mr-2"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full max-h-[calc(100vh-4rem)] overflow-y-auto bg-surface border-b border-border shadow-card py-4 px-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link, idx) => (
            <div key={idx} className="flex flex-col">
              {link.dropdown ? (
                <>
                  <div className="font-heading font-semibold text-sm text-on-surface-variant uppercase tracking-wider py-2 mt-2">
                    {link.name}
                  </div>
                  <div className="flex flex-col gap-1 pl-4 border-l-2 border-border ml-2">
                    {link.dropdown.map((dropItem, dIdx) => (
                      <Link 
                        key={dIdx} 
                        to={dropItem.path} 
                        className="font-body font-medium text-base text-on-surface py-2 flex items-center gap-3"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="material-symbols-outlined text-[18px] text-primary">{dropItem.icon}</span>
                        {dropItem.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link 
                  to={link.path} 
                  className="font-heading font-semibold text-lg text-on-surface py-2 border-b border-border"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )}
            </div>
          ))}
          
          {!auth.token ? (
            <div className="flex flex-col gap-3 mt-4">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 text-center font-body font-bold text-background bg-primary py-3 rounded-full shadow-sm hover:bg-primary-light transition-colors">
                <span className="material-symbols-outlined text-[18px]">person</span>
                Login
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-body font-semibold text-primary border border-primary/30 hover:bg-primary/5 py-3 rounded-full transition-colors">
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
               <div className="font-heading font-semibold text-sm text-on-surface-variant uppercase tracking-wider py-2">
                 My Profile
               </div>
               
               {auth.user?.role === 'EXPERT' ? (
                 <>
                   <Link to="/expert/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span> Dashboard
                   </Link>
                   <Link to="/expert/profile" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">person</span> My Profile
                   </Link>
                   <Link to="/expert/settings" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">settings</span> Settings
                   </Link>
                 </>
               ) : auth.user?.role === 'ADMIN' ? (
                 <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                   <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span> Admin Dashboard
                 </Link>
               ) : (
                 <>
                   <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">dashboard</span> Dashboard
                   </Link>
                   <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">person</span> My Profile
                   </Link>
                   <Link to="/settings/edit-profile" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">edit</span> Edit Profile
                   </Link>
                   <Link to="/bookings" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">history</span> My Consultations
                   </Link>
                   <Link to="/wallet" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">account_balance_wallet</span> Wallet & Transactions
                   </Link>
                   <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="font-body font-medium text-lg text-on-surface py-2 flex items-center gap-3">
                     <span className="material-symbols-outlined text-[20px] text-primary">settings</span> Account Settings
                   </Link>
                 </>
               )}
               
               <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="text-left font-body font-bold text-lg text-error py-2 flex items-center gap-3 mt-2">
                 <span className="material-symbols-outlined text-[20px]">logout</span> Logout
               </button>
            </div>
          )}
        </div>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </header>
  );
}

export default Header;

