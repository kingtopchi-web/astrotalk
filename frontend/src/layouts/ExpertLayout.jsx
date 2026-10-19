import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createSocket } from '../utils/socket';
import { soundService } from '../utils/soundService';
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
  Phone
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import LogoutModal from '../components/LogoutModal';
import ExpertSearchBar from '../components/ExpertSearchBar';

const ExpertLayout = ({ children, title = '', subtitle = '' }) => {
  const { platformName, supportEmail, contactPhone, address } = usePlatformSettings();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [waitingNotification, setWaitingNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(getApiUrl('/expert/profile'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpert(res.data);
      } catch (err) {
        if (err.response?.status === 401) navigate('/expert/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  useEffect(() => {
    if (!expert) return;
    const socket = createSocket();

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      socket.emit('join_user', expert._id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error (server may be waking up):', err.message);
    });

    socket.on('VIDEO_USER_WAITING', (data) => {
      setWaitingNotification(data);
      soundService.playIncomingRing();
    });

    socket.on('VIDEO_USER_LEFT', () => {
      setWaitingNotification(null);
      soundService.stopRing();
    });

    socket.on('VIDEO_SESSION_ENDED', () => {
      setWaitingNotification(null);
      soundService.stopRing();
    });

    return () => {
      soundService.stopRing();
      socket.disconnect();
    };
  }, [expert?._id]);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/expert/login');
  };
  const navItems = [
    { name: 'Home', path: '/expert/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Services & Pricing', path: '/expert/services', icon: <Briefcase size={20} /> },
    { name: 'Consultations', path: '/expert/consultations', icon: <CalendarDays size={20} /> },
    { name: 'Schedule', path: '/expert/schedule', icon: <Clock size={20} /> },
    { name: 'Messages', path: '/expert/messages', icon: <MessageSquare size={20} /> },
    { name: 'Earnings', path: '/expert/earnings', icon: <CreditCard size={20} /> },
    { name: 'Clients', path: '/expert/clients', icon: <Users size={20} /> },
  ];

  // We don't block render on loading anymore so sidebar appears instantly

  const displayName = expert?.name || 'Expert';

  return (
    <div className="min-h-screen bg-surface-light flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-light border-r border-border-color text-on-surface h-screen fixed z-20">
        <div className="p-4 border-b border-border-color">
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1">
            <img src="/logo.png" alt="ExpertHub" className="w-8 h-8 object-contain rounded-lg shrink-0" />
            <span className="text-xl font-bold text-on-surface tracking-tight">{platformName || 'ExpertHub'}</span>
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
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {waitingNotification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">
                  {waitingNotification.type === 'video' ? 'videocam' : 'call'}
                </span>
             </div>
             <div>
                <h4 className="font-bold text-white">
                  {waitingNotification.type === 'video' ? 'Incoming Video Call' : 'Incoming Audio Call'}
                </h4>
                <p className="text-sm text-slate-300">
                  {waitingNotification.userName || 'Client'} is calling for a consultation.
                </p>
             </div>
             <button 
               onClick={() => {
                 soundService.stopRing();
                 setWaitingNotification(null);
                 const callType = waitingNotification.type === 'video' ? 'video' : 'audio';
                 navigate(`/live/${waitingNotification.consultationId}?type=${callType}&incoming=true`);
               }}
               className="ml-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-md flex items-center gap-1.5 shrink-0"
             >
               <span className="material-symbols-outlined text-base">call</span>
               Accept Call
             </button>
             <button onClick={() => {
               soundService.stopRing();
               setWaitingNotification(null);
             }} className="ml-2 text-slate-400 hover:text-white shrink-0">
               <X size={20} />
             </button>
          </div>
        )}
        {/* Header - Desktop & Mobile */}
        <header className="bg-surface border-b border-border-color p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2.5 md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-on-surface/80 p-1 -ml-1">
              <Menu size={22} />
            </button>
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted border border-border text-on-surface hover:text-primary text-xs font-bold transition-all shadow-sm shrink-0"
              title="Back to Home"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Home</span>
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt={platformName || 'ExpertHub'} className="w-7 h-7 object-contain rounded-md shrink-0" />
              <span className="font-heading font-extrabold text-base text-on-surface">{platformName || 'ExpertHub'}</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-light border border-border text-on-surface hover:text-primary text-xs font-semibold transition-colors shadow-sm"
              title="View Public Site / Home"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              <span>Back to Home</span>
            </Link>
            <ExpertSearchBar />
          </div>

          <div className="flex items-center gap-3 ml-auto">
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
            <div className="hidden md:flex items-center gap-3 border-l border-border-color pl-4 cursor-pointer">
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
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-surface-light text-on-surface h-screen shadow-2xl">
              <div className="p-4 border-b border-border-color flex items-center gap-2.5">
                <img src="/logo.png" alt={platformName || 'ExpertHub'} className="w-8 h-8 object-contain rounded-lg shrink-0" />
                <span className="text-xl font-bold text-on-surface tracking-tight">{platformName || 'ExpertHub'}</span>
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
        <div className="flex-1 p-4 md:p-6 bg-surface-light overflow-x-hidden">
          {title && (
            <div className="mb-6 max-w-6xl mx-auto">
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-on-surface/60 mt-1">{subtitle}</p>}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : children ? children : <Outlet context={{ expert, fetchProfile: () => {} }} />}
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
