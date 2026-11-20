import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, BarChart3, Users, UserCheck, ClipboardList, Tags,
  MessageSquare, Video, Bell, CreditCard, ArrowLeftRight, RefreshCw,
  TrendingUp, Star, Settings, User as UserIcon, LogOut, Menu, X,
  Search, ChevronDown, ChevronRight, CalendarClock, CheckCircle,
  XCircle, Clock, Mail, ShoppingBag, ShieldCheck, Ticket
} from 'lucide-react';
import AdminNotificationDropdown from '../components/AdminNotificationDropdown';
import AdminSearchBar from '../components/AdminSearchBar';
import AdminThemeToggle from '../components/AdminThemeToggle';
import LogoutModal from '../components/LogoutModal';
import { ADMIN_API_URL } from '../utils/apiConfig';

const API = ADMIN_API_URL;

// ─── Module Permission Mapping ────────────────────────────────────────────────
export const ROUTE_PERMISSION_MAP = {
  '/dashboard': 'dashboard',
  '/analytics': 'dashboard',
  '/users': 'users',
  '/experts': 'experts',
  '/expert-applications': 'experts',
  '/categories': 'categories',
  '/sub-categories': 'categories',
  '/consultations': 'consultations',
  '/consultations/upcoming': 'consultations',
  '/consultations/completed': 'consultations',
  '/consultations/cancelled': 'consultations',
  '/messages': 'support',
  '/contact-inquiries': 'inquiries',
  '/reviews': 'reviews',
  '/video-sessions': 'consultations',
  '/notifications': 'notifications',
  '/transactions': 'finance',
  '/refunds': 'finance',
  '/revenue': 'finance',
  '/coupons': 'coupons',
  '/razorpay-accounts': 'finance',
  '/marketplace-management': 'marketplace',
  '/settings': 'settings',
  '/profile': 'profile', // always allowed to logged-in admin
  '/administrators': 'administrators', // strictly SUPER_ADMIN only
};

export const canAccessPath = (pathname, adminUser) => {
  if (!adminUser) return false;
  const isSuperAdmin = adminUser.role === 'SUPER_ADMIN';
  if (isSuperAdmin) return true;
  if (pathname === '/profile') return true;
  if (pathname === '/administrators') return false; // Strictly Super Admin only

  const permissions = Array.isArray(adminUser.permissions) ? adminUser.permissions : [];
  if (permissions.includes('*')) return true;

  // Match root or sub-routes
  for (const [route, moduleKey] of Object.entries(ROUTE_PERMISSION_MAP)) {
    if (pathname === route || (route !== '/dashboard' && pathname.startsWith(route))) {
      return permissions.includes(moduleKey);
    }
  }
  return true;
};

// ─── Sidebar section + item config ───────────────────────────────────────────
const buildNav = (stats = {}, adminUser = {}) => {
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
  const permissions = Array.isArray(adminUser?.permissions) ? adminUser.permissions : [];

  const canAccessItem = (item) => {
    if (item.path === '/profile') return true;
    if (item.path === '/administrators') return isSuperAdmin;
    if (isSuperAdmin || permissions.includes('*')) return true;
    const moduleKey = ROUTE_PERMISSION_MAP[item.path];
    return moduleKey ? permissions.includes(moduleKey) : true;
  };

  const rawSections = [
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
      badge: (stats.pendingInquiries > 0 || stats.flaggedReviews > 0) ? (stats.pendingInquiries || 0) + (stats.flaggedReviews || 0) : undefined,
      badgeColor: 'orange',
      items: [
        { name: 'Support Tickets', path: '/messages', icon: MessageSquare },
        { name: 'Contact Inquiries', path: '/contact-inquiries', icon: Mail, badge: stats.pendingInquiries, badgeColor: 'orange' },
        { name: 'Review Moderation', path: '/reviews', icon: Star, badge: stats.flaggedReviews > 0 ? stats.flaggedReviews : undefined, badgeColor: 'orange' },
        { name: 'Notifications', path: '/notifications', icon: Bell },
      ],
    },
    {
      section: 'FINANCE',
      icon: CreditCard,
      items: [
        { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
        { name: 'Revenue', path: '/revenue', icon: TrendingUp },
        { name: 'Coupons & Vouchers', path: '/coupons', icon: Ticket },
        { name: 'Razorpay Accounts', path: '/razorpay-accounts', icon: CreditCard },
      ],
    },
    {
      section: 'MARKETPLACE',
      icon: ShoppingBag,
      items: [
        { name: 'Digital Marketplace', path: '/marketplace-management', icon: ShoppingBag },
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
        { name: 'Administrators', path: '/administrators', icon: ShieldCheck },
      ],
    },
  ];

  return rawSections
    .map(sec => ({
      ...sec,
      items: sec.items.filter(canAccessItem)
    }))
    .filter(sec => sec.items.length > 0);
};

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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium group relative ${
        isActive
          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <span className={`shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
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
          className={`w-10 h-10 mx-auto flex items-center justify-center rounded-lg transition-colors relative ${
            hasActiveChild
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <SectionIcon size={18} />
          {badge !== undefined && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
          )}
        </button>

        {/* Floating flyout dropdown on hover in collapsed mode */}
        <div className="absolute left-full ml-2 top-0 hidden group-hover:block bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 min-w-[210px] z-50">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white tracking-wide uppercase">{section}</span>
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
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 select-none group ${
          hasActiveChild
            ? 'text-blue-700 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <SectionIcon
            size={16}
            className={`shrink-0 transition-colors ${
              hasActiveChild ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <span className="truncate text-[11px]">{section}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {badge !== undefined && <Badge count={badge} color={badgeColor || 'blue'} />}
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
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
  platformLogo,
}) => {
  const navList = buildNav(stats, adminUser);

  return (
    <div className={`flex flex-col h-full ${collapsed ? 'w-[60px]' : 'w-64'} transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b border-slate-200 shrink-0 ${collapsed ? 'justify-center py-4 px-2' : 'px-5 py-4'}`}>
        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
          <img
            src={platformLogo || "/logo.png"}
            alt="ExpertHub Real Guidance"
            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div>
            <p className="text-base font-bold text-slate-900 leading-none tracking-tight">ExpertHub</p>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">Real Guidance • Admin</p>
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
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{adminUser?.name || 'Admin'}</p>
              <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                adminUser?.role === 'SUPER_ADMIN'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {adminUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub-Admin'}
              </span>
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

  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
    'SYSTEM': false,
    'ADMIN': false,
  });

  const rawAdminStored = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
      return {};
    }
  })();
  const adminUser = rawAdminStored?.user || rawAdminStored || {};
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';
  const adminImage = adminUser?.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser?.name || 'Admin')}&background=ea580c&color=fff`;

  const [platformLogo, setPlatformLogo] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const res = await axios.get(`${API}/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.platformLogo) {
          setPlatformLogo(res.data.platformLogo);
        }
      } catch (err) {
        // fallback to /logo.png
      }
    };
    fetchLogo();
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login', { replace: true });
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex w-full max-w-full overflow-x-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen fixed z-20 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-64'}`}>
        <SidebarContent
          collapsed={collapsed}
          stats={stats}
          adminUser={adminUser}
          adminImage={adminImage}
          onLogout={handleLogout}
          openSections={openSections}
          onToggleSection={handleToggleSection}
          platformLogo={platformLogo}
        />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex bg-white dark:bg-slate-900 h-full shadow-2xl z-50 border-r border-slate-200 dark:border-slate-800">
            <SidebarContent
              collapsed={false}
              stats={stats}
              adminUser={adminUser}
              adminImage={adminImage}
              onLogout={() => { handleLogout(); setMobileOpen(false); }}
              onItemClick={() => setMobileOpen(false)}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              platformLogo={platformLogo}
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
      <main className={`flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-[#0B0F19] transition-all duration-300 w-full min-w-0 overflow-x-hidden ${collapsed ? 'md:ml-[60px]' : 'md:ml-64'}`}>

        {/* Top Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 h-14 flex items-center px-4 gap-3">

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

          {/* Dynamic Global Admin Search */}
          <AdminSearchBar className="hidden md:flex" />

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle (Dark / Light) */}
            <AdminThemeToggle />

            {/* Notifications bell */}
            <AdminNotificationDropdown />

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
                  <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none">{adminUser?.name || 'Admin'}</p>
                  <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded mt-1 ${
                    isSuperAdmin
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {isSuperAdmin ? 'Super Admin' : 'Sub-Admin'}
                  </span>
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
        <div className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto pb-24 md:pb-6 min-w-0">
          {canAccessPath(location.pathname, adminUser) ? (
            <Outlet />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
                <ShieldCheck size={32} />
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 mb-3">
                Access Restricted
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Module Access Restricted</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Your administrator account does not have permission to view or edit this platform section. 
                Please contact the platform <strong>Super Administrator</strong> to assign permissions for this module.
              </p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Admin Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1.5 shadow-lg flex items-center justify-around">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-center transition-all ${
            location.pathname === '/dashboard'
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard size={19} className={location.pathname === '/dashboard' ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Home</span>
        </Link>

        <Link
          to="/consultations"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-center transition-all ${
            location.pathname.startsWith('/consultations')
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarClock size={19} className={location.pathname.startsWith('/consultations') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Consults</span>
        </Link>

        <Link
          to="/coupons"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-center transition-all ${
            location.pathname.startsWith('/coupons')
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Ticket size={19} className={location.pathname.startsWith('/coupons') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Coupons</span>
        </Link>

        <Link
          to="/marketplace-management"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-center transition-all ${
            location.pathname.startsWith('/marketplace-management')
              ? 'text-blue-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag size={19} className={location.pathname.startsWith('/marketplace-management') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Market</span>
        </Link>

        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-center text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
        >
          <Menu size={19} />
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Menu</span>
        </button>
      </nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default AdminLayout;
