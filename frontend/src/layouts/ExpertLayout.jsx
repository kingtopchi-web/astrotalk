import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  LogOut, 
  Menu, 
  Bell, 
  Search,
  User as UserIcon,
  Video,
  Users,
  BarChart,
  CalendarDays,
  Clock,
  Briefcase,
  X,
  HelpCircle,
  Mail,
  Phone,
  ShoppingBag
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LogoutModal from '../components/LogoutModal';
import ExpertSearchBar from '../components/ExpertSearchBar';

const ExpertLayout = ({ children, title = '', subtitle = '', hideTitleOnMobile = false }) => {
  const { platformName, supportEmail, contactPhone, address } = usePlatformSettings();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Expert dashboard must never have black background theme
    document.documentElement.classList.add('light-theme');
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(getApiUrl('/expert/profile'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpert(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/expert/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);

  const toggleOnlineStatus = async () => {
    if (!expert) return;
    const currentStatus = expert.onlineStatus || 'offline';
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    
    // Instant optimistic update
    setExpert(prev => ({ ...prev, onlineStatus: newStatus }));

    try {
      const token = localStorage.getItem('token');
      await axios.patch(getApiUrl('/expert/profile'), { onlineStatus: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to toggle status', err);
      setExpert(prev => ({ ...prev, onlineStatus: currentStatus }));
    }
  };


  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.patch(getApiUrl('/expert/profile'), { onlineStatus: 'offline' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/expert/login', { replace: true });
  };
  const navItems = [
    { name: 'Home', path: '/expert/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Services & Pricing', path: '/expert/services', icon: <Briefcase size={20} /> },
    { name: 'Consultations', path: '/expert/consultations', icon: <CalendarDays size={20} /> },
    { name: 'Schedule', path: '/expert/schedule', icon: <Clock size={20} /> },
    { name: 'Messages', path: '/expert/messages', icon: <MessageSquare size={20} /> },
    { name: 'Earnings', path: '/expert/earnings', icon: <CreditCard size={20} /> },
    { name: 'Clients', path: '/expert/clients', icon: <Users size={20} /> },
    { name: 'Marketplace Seller Hub', path: '/marketplace/seller', icon: <ShoppingBag size={20} /> },
  ];

  // We don't block render on loading anymore so sidebar appears instantly

  const displayName = expert?.name || 'Expert';

  return (
    <div className="light-theme min-h-screen bg-surface-light flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-light border-r border-border-color text-on-surface h-screen fixed z-20">
        <div className="p-4 border-b border-border-color">
          <Link to="/" className="flex items-center gap-3 group select-none">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
              <img src="/logo.png" alt="ExpertHub" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-on-surface tracking-tight leading-none">
                {platformName || 'ExpertHub'}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mt-1 leading-none">
                Expert Partner Portal
              </span>
            </div>
          </Link>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2 px-3">Expert Portal</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-on-surface/80 hover:bg-slate-200 hover:text-on-surface'
                  }`}
                >
                  <div className={isActive ? 'text-primary' : 'text-on-surface/60'}>
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4 pb-6 mt-auto">
          {/* Expert Support Desk */}
          {(supportEmail || contactPhone) && (
            <div className="mb-3 p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs shadow-sm">
              <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                <HelpCircle size={14} className="text-blue-600 shrink-0" />
                <span>Expert Support</span>
              </div>
              {supportEmail && (
                <a 
                  href={`mailto:${supportEmail}`} 
                  className="flex items-center gap-1.5 text-blue-800 hover:text-blue-900 hover:underline truncate py-0.5"
                  title={`Email support: ${supportEmail}`}
                >
                  <Mail size={12} className="shrink-0 text-blue-600" />
                  <span className="truncate">{supportEmail}</span>
                </a>
              )}
              {contactPhone && (
                <a 
                  href={`tel:${contactPhone}`} 
                  className="flex items-center gap-1.5 text-blue-800 hover:text-blue-900 hover:underline truncate py-0.5"
                  title={`Call support: ${contactPhone}`}
                >
                  <Phone size={12} className="shrink-0 text-blue-600" />
                  <span className="truncate">{contactPhone}</span>
                </a>
              )}
            </div>
          )}

          <div className="text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2 px-3">Settings</div>
          <div className="space-y-1">
             <Link to="/expert/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-slate-200 hover:text-on-surface">
               <UserIcon size={18} />
               <span>My Profile</span>
             </Link>
             <Link to="/expert/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-slate-200 hover:text-on-surface">
               <Settings size={18} />
               <span>Settings</span>
             </Link>
             <button 
               onClick={handleLogout}
               className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-red-50 hover:text-red-600 w-full text-left"
             >
               <LogOut size={18} />
               <span>Logout</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen w-full max-w-full min-w-0">

        {/* Header - Desktop & Mobile */}
        <header className="bg-surface border-b border-border-color px-4 sm:px-6 py-3 sticky top-0 z-10 backdrop-blur-md bg-surface/95">
          {/* Mobile Centered Brand Header */}
          <div className="flex items-center justify-between w-full md:hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              {!(location.pathname.startsWith('/expert/earnings') || location.pathname.startsWith('/expert/consultation') || location.pathname.startsWith('/expert/schedule')) && (
                <button onClick={() => setIsSidebarOpen(true)} className="text-on-surface/80 p-1 -ml-1 cursor-pointer" aria-label="Open sidebar">
                  <Menu size={22} />
                </button>
              )}
              {/* Quick Status Pill Mobile */}
              <button
                type="button"
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 cursor-pointer touch-manipulation select-none border ${
                  expert?.onlineStatus === 'online'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
                title="Tap to toggle Online/Offline"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${expert?.onlineStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{expert?.onlineStatus === 'online' ? 'Online' : 'Offline'}</span>
              </button>
            </div>

            <Link to="/" className="flex items-center gap-1.5 justify-center">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                <img src="/logo.png" alt={platformName || 'ExpertHub'} className="w-full h-full object-cover" />
              </div>
              <span className="font-heading font-black text-sm text-on-surface leading-none truncate max-w-[110px]">{platformName || 'ExpertHub'}</span>
            </Link>

            <div className="flex items-center justify-end">
              <NotificationDropdown role="EXPERT" viewAllPath="/expert/notifications" />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <ExpertSearchBar />
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Real-time Online/Offline Status Switch */}
              <button
                type="button"
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer touch-manipulation select-none border shadow-2xs ${
                  expert?.onlineStatus === 'online'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                }`}
                title={`You are currently ${expert?.onlineStatus === 'online' ? 'Online' : 'Offline'}. Click to toggle.`}
              >
                <span className={`w-2 h-2 rounded-full ${expert?.onlineStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{expert?.onlineStatus === 'online' ? 'Online' : 'Offline'}</span>
              </button>

              {/* Quick Contact & Helpdesk */}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/60 text-blue-800 text-xs font-semibold hover:bg-blue-100/80 transition-colors shadow-xs"
                  title={`Contact Support: ${supportEmail}`}
                >
                  <Mail size={13} className="text-blue-600 shrink-0" />
                  <span className="truncate max-w-[170px]">{supportEmail}</span>
                </a>
              )}

              <NotificationDropdown role="EXPERT" viewAllPath="/expert/notifications" />
              <div className="flex items-center gap-3 border-l border-border-color pl-4 cursor-pointer">
                <div className="text-right">
                  <p className="text-sm font-bold text-on-surface">{displayName}</p>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Expert</p>
                </div>
                <img
                  src={expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full shadow-sm border border-border-color object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-surface-light text-on-surface h-screen shadow-2xl">
              <div className="p-4 border-b border-border-color flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt={platformName || 'ExpertHub'} className="w-full h-full object-cover" />
                </div>
                <span className="text-lg font-black text-on-surface tracking-tight">{platformName || 'ExpertHub'}</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                          isActive
                            ? 'bg-blue-100 text-primary font-semibold'
                            : 'text-on-surface/80 hover:bg-slate-200 hover:text-on-surface'
                        }`}
                      >
                        <div className={isActive ? 'text-primary' : 'text-on-surface/60'}>
                          {React.cloneElement(item.icon, { size: 18 })}
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="px-4 pb-6 mt-auto space-y-1 border-t border-border-color pt-4">
                 {/* Support Desk in mobile sidebar */}
                 {(supportEmail || contactPhone) && (
                   <div className="mb-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs">
                     <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                       <HelpCircle size={13} className="text-blue-600 shrink-0" />
                       <span>Expert Support</span>
                     </div>
                     {supportEmail && (
                       <a href={`mailto:${supportEmail}`} className="flex items-center gap-1.5 text-blue-800 hover:underline truncate py-0.5">
                         <Mail size={11} className="shrink-0 text-blue-600" />
                         <span className="truncate">{supportEmail}</span>
                       </a>
                     )}
                     {contactPhone && (
                       <a href={`tel:${contactPhone}`} className="flex items-center gap-1.5 text-blue-800 hover:underline truncate py-0.5">
                         <Phone size={11} className="shrink-0 text-blue-600" />
                         <span>{contactPhone}</span>
                       </a>
                     )}
                   </div>
                 )}
                 <Link onClick={() => setIsSidebarOpen(false)} to="/expert/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-slate-200 hover:text-on-surface w-full text-left">
                   <UserIcon size={18} />
                   <span>My Profile</span>
                 </Link>
                 <Link onClick={() => setIsSidebarOpen(false)} to="/expert/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-on-surface/80 hover:bg-slate-200 hover:text-on-surface w-full text-left">
                   <Settings size={18} />
                   <span>Settings</span>
                 </Link>
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

        {/* Page Content passed through Outlet */}
        <div className="flex-1 p-3.5 sm:p-5 md:p-6 pb-28 sm:pb-32 md:pb-8 bg-surface-light min-w-0 max-w-full">
          <div className="max-w-7xl mx-auto">
            {/* Page Top-Left Back Arrow */}
            <div className="mb-3 sm:mb-4 flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                }}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:text-primary dark:hover:text-amber-400 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 group"
                title="Go Back"
                aria-label="Go Back"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-amber-400">arrow_back</span>
              </button>
            </div>
            {title && (
              <div className={`mb-3 sm:mb-4 md:mb-5 ${hideTitleOnMobile ? 'hidden md:block' : ''}`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-on-surface/60 mt-0.5 md:mt-1">{subtitle}</p>}
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : children ? children : <Outlet context={{ expert, setExpert, fetchProfile, toggleOnlineStatus }} />}
          </div>
        </div>
      </main>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Logout Expert Portal"
        message="Are you sure you want to log out of your expert dashboard?"
      />
    </div>
  );
};

export default ExpertLayout;
