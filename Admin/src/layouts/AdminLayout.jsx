import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, BarChart3, Users, UserCheck, ClipboardList, Tags,
  MessageSquare, Video, Bell, CreditCard, ArrowLeftRight, RefreshCw,
  TrendingUp, Star, Settings, User as UserIcon, LogOut, Menu, X,
  Search, ChevronDown, ChevronRight, CalendarClock, CheckCircle,
  XCircle, Clock
} from 'lucide-react';

const API = 'https://astrotalk-hlg2.onrender.com/api/admin';

// ─── Sidebar section + item config ───────────────────────────────────────────
const buildNav = (stats = {}) => [
  {
    section: 'MAIN',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'USERS & EXPERTS',
    icon: Users,
    badge: stats.pendingExperts > 0 ? stats.pendingExperts : undefined,
    badgeColor: 'orange',
    items: [
      { name: 'Users', path: '/users', icon: Users, badge: stats.totalUsers },
      { name: 'Experts', path: '/experts', icon: UserCheck, badge: stats.totalExperts },
      { name: 'Expert Applications', path: '/expert-applications', icon: ClipboardList, badge: stats.pendingExperts, badgeColor: 'orange' },
      { name: 'Categories', path: '/categories', icon: Tags },
      { name: 'Sub-Categories', path: '/sub-categories', icon: Tags },
    ],
  },
  {
    section: 'CONSULTATIONS',
    icon: CalendarClock,
    items: [
      { name: 'All Consultations', path: '/consultations', icon: CalendarClock, badge: stats.totalConsultations },
      { name: 'Upcoming', path: '/consultations/upcoming', icon: ChevronRight },
      { name: 'Completed', path: '/consultations/completed', icon: CheckCircle },
      { name: 'Cancelled', path: '/consultations/cancelled', icon: XCircle },
    ],
  },
  {
    section: 'COMMUNICATION',
    icon: MessageSquare,
    items: [
      { name: 'Support Tickets', path: '/messages', icon: MessageSquare },
      { name: 'Notifications', path: '/notifications', icon: Bell },
    ],
  },
  {
    section: 'FINANCE',
    icon: CreditCard,
    items: [
      { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
      { name: 'Revenue', path: '/revenue', icon: TrendingUp },
    ],
  },
  {
    section: 'CONTENT',
    icon: Star,
    items: [
      { name: 'Reviews & Ratings', path: '/reviews', icon: Star },
    ],
  },
  {
    section: 'SYSTEM',
    icon: Settings,
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
  {
    section: 'ADMIN',
    icon: UserIcon,
    items: [
      { name: 'Admin Profile', path: '/profile', icon: UserIcon },
    ],
  },
];

// ─── Badge component ──────────────────────────────────────────────────────────
const Badge = ({ count, color = 'blue' }) => {
  if (!count && count !== 0) return null;
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${colors[color] || colors.blue}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

// ─── Single nav item ──────────────────────────────────────────────────────────
const NavItem = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const Icon = item.icon;
  const isActive = location.pathname === item.path ||
    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

  return (
    <Link
      to={item.path}
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium group relative
        ${Number(isActive
          ? 'bg-blue-50 text-blue-700 font-semibold'
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        ).toFixed(2)} ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
        <Icon size={16} />
      </span>
      {!collapsed && <span className="truncate flex-1">{item.name}</span>}
      {!collapsed && item.badge !== undefined && (
        <Badge count={item.badge} color={item.badgeColor || 'blue'} />
      )}
      {/* Tooltip on collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap z-50 pointer-events-none">
          <span>{item.name}</span>
          {item.badge !== undefined && <Badge count={item.badge} color={item.badgeColor || 'blue'} />}
        </div>
      )}
    </Link>
  );
};

// ─── Collapsible Dropdown Section ─────────────────────────────────────────────
const SidebarSectionDropdown = ({
  section,
  items,
  icon: SectionIcon,
  badge,
  badgeColor,
  isOpen,
  onToggle,
  collapsed,
  onItemClick,
}) => {
  const location = useLocation();

  // Check if any child item matches current location
  const hasActiveChild = items.some(
    item => location.pathname === item.path ||
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  );

  // If collapsed (mini sidebar mode)
  if (collapsed) {
    return (
      <div className="relative group my-1">
        <button
          title={section}
          className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors relative ${Number(
            hasActiveChild
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          ).toFixed(2)}`}
        >
          <SectionIcon size={18} />
          {badge !== undefined && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
          )}
        </button>

        {/* Floating flyout dropdown on hover in collapsed mode */}
        <div className="absolute left-full ml-2 top-0 hidden group-hover:block bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-[210px] z-50">
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{section}</span>
            {badge !== undefined && <Badge count={badge} color={badgeColor || 'blue'} />}
          </div>
          <div className="py-1 px-1.5 space-y-0.5">
            {items.map(item => (
              <NavItem key={item.path} item={item} collapsed={false} onClick={onItemClick} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Normal expanded mode
  return (
    <div className="mb-1.5">
      {/* Dropdown Header Button ("Bade name ke upar dropdown") */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 select-none group ${Number(
          hasActiveChild
            ? 'text-blue-700 bg-blue-50/70'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
        ).toFixed(2)}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <SectionIcon
            size={16}
            className={`shrink-0 transition-colors ${Number(
              hasActiveChild ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
            ).toFixed(2)}`}
          />
          <span className="truncate text-[11px]">{section}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {badge !== undefined && <Badge count={badge} color={badgeColor || 'blue'} />}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${Number(
              isOpen ? 'rotate-180 text-blue-600' : ''
            ).toFixed(2)}`}
          />
        </div>
      </button>

      {/* Dropdown Items (Collapsible Content) */}
      {isOpen && (
        <div className="mt-1 ml-3.5 pl-2.5 border-l-2 border-slate-200/80 space-y-0.5 animate-in fade-in duration-150">
          {items.map(item => (
            <NavItem
              key={item.path}
              item={item}
              collapsed={false}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Sidebar content ──────────────────────────────────────────────────────────
const SidebarContent = ({
  collapsed,
  onItemClick,
  stats,
  adminUser,
  adminImage,
  onLogout,
  openSections,
  onToggleSection,
}) => {
  const navList = buildNav(stats);

  return (
    <div className={`flex flex-col h-full ${collapsed ? 'w-[60px]' : 'w-64'} transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-slate-200 shrink-0 ${collapsed ? 'justify-center py-4 px-2' : 'px-5 py-4'}`}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
          S
        </div>
        {!collapsed && (
          <div>
            <p className="text-base font-bold text-slate-900 leading-none">Stitch</p>
            <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Nav with Dropdowns */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-hide">
        {navList.map(sec => (
          <SidebarSectionDropdown
            key={sec.section}
            section={sec.section}
            items={sec.items}
            icon={sec.icon}
            badge={sec.badge}
            badgeColor={sec.badgeColor}
            isOpen={!!openSections[sec.section]}
            onToggle={() => onToggleSection(sec.section)}
            collapsed={collapsed}
            onItemClick={onItemClick}
          />
        ))}
      </div>

      {/* Bottom user card */}
      <div className={`border-t border-slate-200 p-3 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={adminImage}
              alt="Admin"
              className="w-9 h-9 rounded-full border border-slate-200 object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{adminUser?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 uppercase">Super Admin</p>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="shrink-0 text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [stats, setStats] = useState({});
  const dropdownRef = useRef(null);

  // Track accordion dropdown open/close state for each section
  const [openSections, setOpenSections] = useState({
    MAIN: true,
    'USERS & EXPERTS': true,
    'CONSULTATIONS': false,
    'COMMUNICATION': false,
    'FINANCE': false,
    'CONTENT': false,
    'SYSTEM': false,
    'ADMIN': false,
  });

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')?.user || {};
  const adminImage = adminUser?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.name || 'Admin')}&background=ea580c&color=fff`;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  // Toggle specific dropdown
  const handleToggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // Automatically expand the dropdown that contains the current active route
  useEffect(() => {
    const currentPath = location.pathname;
    const nav = buildNav(stats);
    const matched = nav.find(s =>
      s.items.some(
        i => i.path === currentPath || (i.path !== '/dashboard' && currentPath.startsWith(i.path))
      )
    );
    if (matched) {
      setOpenSections(prev => ({
        ...prev,
        [matched.section]: true,
      }));
    }
  }, [location.pathname, stats]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch sidebar stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/sidebar-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (e) {
        // Ignore - sidebar still renders without badges
      }
    };
    fetchStats();
    // Refresh every 60s
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 h-screen fixed z-20 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <SidebarContent
          collapsed={collapsed}
          stats={stats}
          adminUser={adminUser}
          adminImage={adminImage}
          onLogout={handleLogout}
          openSections={openSections}
          onToggleSection={handleToggleSection}
        />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex bg-white h-full shadow-2xl z-50">
            <SidebarContent
              collapsed={false}
              stats={stats}
              adminUser={adminUser}
              adminImage={adminImage}
              onLogout={() => { handleLogout(); setMobileOpen(false); }}
              onItemClick={() => setMobileOpen(false)}
              openSections={openSections}
              onToggleSection={handleToggleSection}
            />
          </aside>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 text-white z-50 p-2 rounded-lg bg-slate-800/60"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* ── Main ── */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'md:ml-[60px]' : 'md:ml-64'}`}>

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 h-14 flex items-center px-4 gap-3">

          {/* Collapse toggle (desktop) / Menu (mobile) */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu size={18} />
          </button>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-sm items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg gap-2">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search admin panel..."
              className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell size={18} />
              {stats.pendingConsultations > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-2 pl-3 border-l border-slate-200"
                onClick={() => setIsProfileDropdownOpen(o => !o)}
              >
                <img
                  src={adminImage}
                  alt="Admin"
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{adminUser?.name || 'Admin'}</p>
                  <p className="text-[10px] text-slate-400 uppercase">Super Admin</p>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <UserIcon size={15} className="text-slate-400" />
                    <span>Admin Profile</span>
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut size={15} className="text-red-400" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 lg:p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
