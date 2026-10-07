import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
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

const ExpertLayout = () => {
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
        const res = await axios.get('http://localhost:5000/api/expert/profile', {
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
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      socket.emit('join_user', expert._id);
    });
    socket.on('VIDEO_USER_WAITING', (data) => {
      setWaitingNotification(data);
    });
    return () => socket.disconnect();
  }, [expert]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/expert/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/expert/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Services & Pricing', path: '/expert/services', icon: <Briefcase size={20} /> },
    { name: 'Consultations', path: '/expert/consultations', icon: <CalendarDays size={20} /> },
    { name: 'Schedule', path: '/expert/schedule', icon: <Clock size={20} /> },
    { name: 'Messages', path: '/expert/messages', icon: <MessageSquare size={20} /> },
    { name: 'Earnings', path: '/expert/earnings', icon: <CreditCard size={20} /> },
    { name: 'Clients', path: '/expert/clients', icon: <Users size={20} /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const displayName = expert?.name || 'Expert';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-100 border-r border-slate-200 text-slate-800 h-screen fixed z-20">
        <div className="p-4 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 px-2 py-1">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">E</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ExpertHub</span>
          </Link>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Expert Portal</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <div className={isActive ? 'text-blue-600' : 'text-slate-500'}>
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-4 pb-6 mt-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Settings</div>
          <div className="space-y-1">
             <Link to="/expert/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900">
               <UserIcon size={18} />
               <span>My Profile</span>
             </Link>
             <Link to="/expert/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900">
               <Settings size={18} />
               <span>Settings</span>
             </Link>
             <button 
               onClick={handleLogout}
               className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full text-left"
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
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
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
               className="ml-4 px-4 py-2 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
             >
               Join Now
             </button>
             <button onClick={() => setWaitingNotification(null)} className="ml-2 text-blue-200 hover:text-white">
               <X size={20} />
             </button>
          </div>
        )}
        {/* Header - Desktop & Mobile */}
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 mr-2">
              <Menu size={24} />
            </button>
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">E</div>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 px-3 py-2 rounded-lg w-96 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none ml-2 text-sm w-full text-slate-700 placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <Link to="/expert/notifications" className="text-slate-500 hover:text-blue-600 transition-colors relative">
              <Bell size={20} />
            </Link>
            <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4 cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Expert</p>
              </div>
              <img
                src={expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full shadow-sm border border-slate-200 object-cover"
              />
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-slate-100 text-slate-800 h-screen shadow-2xl">
              <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">E</div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">ExpertHub</span>
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
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <div className={isActive ? 'text-blue-600' : 'text-slate-500'}>
                          {React.cloneElement(item.icon, { size: 18 })}
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="px-4 pb-6 mt-auto space-y-1 border-t border-slate-200 pt-4">
                 <Link onClick={() => setIsSidebarOpen(false)} to="/expert/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 w-full text-left">
                   <UserIcon size={18} />
                   <span>My Profile</span>
                 </Link>
                 <Link onClick={() => setIsSidebarOpen(false)} to="/expert/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 w-full text-left">
                   <Settings size={18} />
                   <span>Settings</span>
                 </Link>
                 <button 
                   onClick={() => { handleLogout(); setIsSidebarOpen(false); }}
                   className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full text-left"
                 >
                   <LogOut size={18} />
                   <span>Logout</span>
                 </button>
              </div>
            </aside>
          </div>
        )}

        {/* Page Content passed through Outlet */}
        <div className="flex-1 p-4 md:p-6 bg-slate-50 overflow-x-hidden">
          <Outlet context={{ expert, fetchProfile: () => {} }} />
        </div>
      </main>
    </div>
  );
};

export default ExpertLayout;
