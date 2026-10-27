import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, X, Loader2, Users, Award, FileText, 
  Layers, Calendar, CreditCard, RefreshCw, LifeBuoy, 
  DollarSign, BarChart2, Sliders, User, ArrowRight, 
  ExternalLink, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

import { ADMIN_API_URL } from '../utils/apiConfig';

const API = ADMIN_API_URL;

const ADMIN_PAGES = [
  { title: 'Dashboard', path: '/', icon: BarChart2, category: 'Overview', desc: 'KPIs, real-time metrics & charts' },
  { title: 'Users Management', path: '/users', icon: Users, category: 'Users', desc: 'Manage registered users, status & accounts' },
  { title: 'Experts Directory', path: '/experts', icon: Award, category: 'Experts', desc: 'Approved & active consultants' },
  { title: 'Expert Applications', path: '/expert-applications', icon: FileText, category: 'Experts', desc: 'Review, approve & reject pending applicants' },
  { title: 'Categories', path: '/categories', icon: Layers, category: 'Taxonomy', desc: 'Manage marketplace parent categories' },
  { title: 'Sub-Categories', path: '/sub-categories', icon: Layers, category: 'Taxonomy', desc: 'Manage specialized niche sub-categories' },
  { title: 'Consultations & Bookings', path: '/consultations', icon: Calendar, category: 'Operations', desc: 'Scheduled, ongoing & finished sessions' },
  { title: 'Transactions', path: '/transactions', icon: CreditCard, category: 'Finance', desc: 'Wallet credits, debits & session payouts' },
  { title: 'Refund Requests', path: '/refunds', icon: RefreshCw, category: 'Finance', desc: 'Process customer refund claims' },
  { title: 'Support Tickets', path: '/support-tickets', icon: LifeBuoy, category: 'Support', desc: 'Help desk & client dispute resolution' },
  { title: 'Revenue Analytics', path: '/revenue', icon: DollarSign, category: 'Finance', desc: 'Platform fees, commission & breakdown' },
  { title: 'Performance Analytics', path: '/analytics', icon: BarChart2, category: 'Overview', desc: 'Growth, conversion & retention stats' },
  { title: 'Platform Settings', path: '/settings', icon: Sliders, category: 'System', desc: 'Commission rates, razorpay & app config' },
  { title: 'Admin Profile', path: '/profile', icon: User, category: 'System', desc: 'Personal details & credentials' },
];

export default function AdminSearchBar({ className = '' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pages', 'users', 'experts'
  const [users, setUsers] = useState([]);
  const [experts, setExperts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUsers([]);
      setExperts([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        // Try global-search first
        const globalRes = await axios.get(`${API}/global-search?q=${encodeURIComponent(q)}`, { headers }).catch(() => null);

        if (globalRes && globalRes.data) {
          setUsers(globalRes.data.users || []);
          setExperts(globalRes.data.experts || []);
        } else {
          // Parallel fallback
          const [uRes, eRes] = await Promise.all([
            axios.get(`${API}/users?search=${encodeURIComponent(q)}&limit=4`, { headers }).catch(() => ({ data: { data: [] } })),
            axios.get(`${API}/experts?search=${encodeURIComponent(q)}&limit=4`, { headers }).catch(() => ({ data: { data: [] } }))
          ]);
          setUsers(uRes.data?.data || []);
          setExperts(eRes.data?.data || []);
        }
      } catch (err) {
        console.error('Admin search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const qLower = query.toLowerCase().trim();

  // Filter matching pages
  const matchingPages = ADMIN_PAGES.filter(p => 
    !qLower || 
    p.title.toLowerCase().includes(qLower) || 
    p.category.toLowerCase().includes(qLower) ||
    p.desc.toLowerCase().includes(qLower)
  ).slice(0, qLower ? 5 : 8);

  // Flatten items for arrow keys navigation
  const flatItems = [];
  if (qLower) {
    if (activeTab === 'all' || activeTab === 'pages') {
      matchingPages.forEach(p => flatItems.push({ type: 'page', item: p, action: () => handleSelectPage(p) }));
    }
    if (activeTab === 'all' || activeTab === 'users') {
      users.forEach(u => flatItems.push({ type: 'user', item: u, action: () => handleSelectUser(u) }));
    }
    if (activeTab === 'all' || activeTab === 'experts') {
      experts.forEach(e => flatItems.push({ type: 'expert', item: e, action: () => handleSelectExpert(e) }));
    }
  }

  const handleSelectPage = (page) => {
    setIsOpen(false);
    navigate(page.path);
  };

  const handleSelectUser = (user) => {
    setIsOpen(false);
    navigate(`/users?search=${encodeURIComponent(user.name || user.email)}`);
  };

  const handleSelectExpert = (expert) => {
    setIsOpen(false);
    if (expert.verificationStatus === 'PENDING') {
      navigate(`/expert-applications?search=${encodeURIComponent(expert.name || expert.email)}`);
    } else {
      navigate(`/experts?search=${encodeURIComponent(expert.name || expert.email)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && flatItems[selectedIndex]) {
        flatItems[selectedIndex].action();
      } else if (flatItems.length > 0) {
        flatItems[0].action();
      } else if (qLower) {
        navigate(`/users?search=${encodeURIComponent(qLower)}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const totalResults = matchingPages.length + users.length + experts.length;

  return (
    <div ref={containerRef} className={`relative flex-1 max-w-md ${className}`}>
      {/* Top Search Input */}
      <div className="flex items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg gap-2 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search admin panel (Ctrl+K)..."
          className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
        />

        {loading && (
          <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />
        )}

        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}

        {!query && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded shrink-0">
            <span>Ctrl</span><span>K</span>
          </kbd>
        )}
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Tabs if query active */}
          {qLower && (
            <div className="flex items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({totalResults})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'pages' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pages ({matchingPages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Users ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('experts')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeTab === 'experts' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Experts ({experts.length})
              </button>
            </div>
          )}

          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {/* When NO query: Quick Navigation */}
            {!qLower && (
              <div className="p-3">
                <div className="flex items-center justify-between px-2 py-1 mb-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Navigation
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                    Shortcuts
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {matchingPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.title}
                        type="button"
                        onClick={() => handleSelectPage(page)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200 group"
                      >
                        <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                          <Icon size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 truncate transition-colors">
                            {page.title}
                          </p>
                          <span className="text-[10px] text-slate-400">{page.category}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty results */}
            {qLower && !loading && totalResults === 0 && (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Search size={18} />
                </div>
                <p className="text-sm font-semibold text-slate-700">No matching records found</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Try searching by name, email, or a module title
                </p>
              </div>
            )}

            {/* RESULTS: PAGES */}
            {qLower && (activeTab === 'all' || activeTab === 'pages') && matchingPages.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Modules & Pages
                </div>
                <div className="space-y-1 mt-1">
                  {matchingPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <div
                        key={page.title}
                        onClick={() => handleSelectPage(page)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                            <Icon size={14} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                              {page.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[260px]">
                              {page.desc}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-600 flex items-center gap-1">
                          Open <ExternalLink size={10} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESULTS: USERS */}
            {qLower && (activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={12} />
                  <span>Users ({users.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      onClick={() => handleSelectUser(u)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563eb&color=fff`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'ACTIVE' 
                          ? 'bg-green-50 text-green-700' 
                          : u.status === 'SUSPENDED' 
                          ? 'bg-amber-50 text-amber-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {u.status || 'ACTIVE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS: EXPERTS */}
            {qLower && (activeTab === 'all' || activeTab === 'experts') && experts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={12} />
                  <span>Experts ({experts.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {experts.map((e) => (
                    <div
                      key={e._id}
                      onClick={() => handleSelectExpert(e)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={e.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || 'Expert')}&background=10b981&color=fff`}
                          alt={e.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                            {e.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {e.specialty || e.categoryId?.name || e.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        e.verificationStatus === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : e.verificationStatus === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {e.verificationStatus || 'APPROVED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </span>
            <span className="text-blue-600 font-medium">Quick search</span>
          </div>
        </div>
      )}
    </div>
  );
}
