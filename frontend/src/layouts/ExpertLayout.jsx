import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createSocket } from '../utils/socket';
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
  X
} from 'lucide-react';

const ExpertLayout = ({ children, title = '', subtitle = '' }) => {
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
        const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/expert/profile', {
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
    });

    return () => socket.disconnect();
  }, [expert?._id]);

  const handleLogout = () => {
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
          <Link to="/" className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background font-bold">E</div>
            <span className="text-xl font-bold text-on-surface tracking-tight">ExpertHub</span>
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
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-background px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
             <div className="w-10 h-10 bg-surface/20 rounded-full flex items-center justify-center">
                <Video size={20} />
             </div>
             <div>
                <h4 className="font-bold">Client is Waiting!</h4>
                <p className="text-sm text-blue-100">A client is waiting for consultation in the video room.</p>
             </div>
             <button 
               onClick={() => {
                 setWaitingNotification(null);
                 navigate(`/live/${waitingNotification.consultationId}`);
               }}
               className="ml-4 px-4 py-2 bg-surface text-primary font-bold rounded-xl hover:bg-primary/10 transition-colors"
             >
               Join Now
             </button>
             <button onClick={() => setWaitingNotification(null)} className="ml-2 text-blue-200 hover:text-background">
               <X size={20} />
             </button>
          </div>
        )}
        {/* Header - Desktop & Mobile */}
        <header className="bg-surface border-b border-border-color p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-on-surface/80 mr-2">
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background font-bold">E</div>
          </div>
          
          <div className="hidden md:flex items-center bg-surface-light px-3 py-2 rounded-lg w-96 border border-border-color focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-on-surface/50" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none ml-2 text-sm w-full text-on-surface placeholder:text-on-surface/50" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Link to="/expert/notifications" className="text-on-surface/60 hover:text-primary transition-colors relative">
              <Bell size={20} />
            </Link>
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
              <div className="p-4 border-b border-border-color flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-background font-bold">E</div>
                <span className="text-xl font-bold text-on-surface tracking-tight">ExpertHub</span>
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
    </div>
  );
};

export default ExpertLayout;
