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
  HelpCircle
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
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 text-slate-800 h-screen fixed z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
              E
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ExpertHub</span>
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
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                      {React.cloneElement(item.icon, { size: 18 })}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-colors text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} className="text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">E</div>
            <h1 className="text-xl font-bold text-slate-900">ExpertHub</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            <aside className="relative flex flex-col w-64 bg-slate-100 text-slate-800 h-screen shadow-2xl">
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">E</div>
                  <span className="text-xl font-bold text-slate-900 tracking-tight">ExpertHub</span>
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
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                            {React.cloneElement(item.icon, { size: 18 })}
                          </span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 w-full text-left"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop Topbar */}
        <header className="hidden md:flex bg-[#f8fafc] p-6 justify-between items-center sticky top-0 z-10">
          <div className="flex items-center bg-white px-4 py-2.5 rounded-2xl w-[400px] shadow-sm border-0 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Search experts, categories, or anything..." className="bg-transparent border-none outline-none ml-3 text-sm w-full text-slate-700 placeholder:text-slate-400" />
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-blue-600 transition-colors relative">
              <Bell size={20} />
            </button>
            <div className="relative">
              <div 
                className="flex items-center gap-3 border-l border-slate-200 pl-4 cursor-pointer"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{displayName}</p>
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                    {user?.role === 'ADMIN' ? 'SUPER ADMIN' : user?.role || 'User'}
                  </p>
                </div>
                <img
                  src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full shadow-sm border border-slate-200 object-cover"
                />
              </div>

              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20">
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User size={16} className="text-slate-400" />
                      <span>Profile</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut size={16} className="text-red-400" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {title && (
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
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
