import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, X, Loader2, User as UserIcon, Calendar, 
  MessageSquare, DollarSign, Briefcase, Settings, Bell, 
  ExternalLink, ArrowRight, Clock, CheckCircle
} from 'lucide-react';

const API_BASE = 'https://astrotalk-hlg2.onrender.com/api';

const EXPERT_PAGES = [
  { title: 'Dashboard Overview', path: '/expert/dashboard', icon: Briefcase, badge: 'Home' },
  { title: 'My Consultations', path: '/expert/consultations', icon: Calendar, badge: 'Bookings' },
  { title: 'Schedule & Availability', path: '/expert/schedule', icon: Clock, badge: 'Calendar' },
  { title: 'Messages & Chats', path: '/expert/messages', icon: MessageSquare, badge: 'Chat' },
  { title: 'Earnings & Payouts', path: '/expert/earnings', icon: DollarSign, badge: 'Finance' },
  { title: 'Services & Pricing', path: '/expert/services', icon: Briefcase, badge: 'Rates' },
  { title: 'My Clients Directory', path: '/expert/clients', icon: UserIcon, badge: 'CRM' },
  { title: 'Edit Public Profile', path: '/expert/profile-edit', icon: UserIcon, badge: 'Bio' },
  { title: 'Account Settings', path: '/expert/settings', icon: Settings, badge: 'Security' },
  { title: 'Notifications', path: '/expert/notifications', icon: Bell, badge: 'Alerts' },
];

export default function ExpertSearchBar({ className = '' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [hasLoadedData, setHasLoadedData] = useState(false);
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

  // Fetch expert clients & consultations once on focus to provide instant client search
  const loadExpertData = async () => {
    if (hasLoadedData) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const [clientsRes, consultRes] = await Promise.all([
        axios.get(`${API_BASE}/experts/my-clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/expert/consultations`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
      setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
      setHasLoadedData(true);
    } catch (err) {
      console.error('Failed to pre-fetch expert search data:', err);
    } finally {
      setLoading(false);
    }
  };

  const qLower = query.toLowerCase().trim();

  // Filter Matching Clients
  const matchingClients = qLower
    ? clients.filter(c => 
        c.name?.toLowerCase().includes(qLower) || 
        c.email?.toLowerCase().includes(qLower) || 
        c.mobile?.includes(qLower)
      ).slice(0, 4)
    : [];

  // Filter Matching Consultations
  const matchingConsultations = qLower
    ? consultations.filter(c => 
        c.user?.name?.toLowerCase().includes(qLower) || 
        c.type?.toLowerCase().includes(qLower) ||
        c.status?.toLowerCase().includes(qLower)
      ).slice(0, 3)
    : [];

  // Filter Matching Pages
  const matchingPages = EXPERT_PAGES.filter(p => 
    !qLower || p.title.toLowerCase().includes(qLower) || p.badge.toLowerCase().includes(qLower)
  ).slice(0, qLower ? 4 : 6);

  // Flattened items for keyboard navigation
  const flatItems = [];
  if (qLower) {
    matchingClients.forEach(c => flatItems.push({ type: 'client', item: c, action: () => handleSelectClient(c) }));
    matchingConsultations.forEach(c => flatItems.push({ type: 'consultation', item: c, action: () => handleSelectConsultation(c) }));
    matchingPages.forEach(p => flatItems.push({ type: 'page', item: p, action: () => handleSelectPage(p) }));
  }

  const handleSelectClient = (client) => {
    setIsOpen(false);
    navigate(`/expert/messages?client=${client._id}`);
  };

  const handleSelectConsultation = () => {
    setIsOpen(false);
    navigate('/expert/consultations');
  };

  const handleSelectPage = (page) => {
    setIsOpen(false);
    navigate(page.path);
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
        navigate(`/expert/consultations`);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const totalResults = matchingClients.length + matchingConsultations.length + (qLower ? matchingPages.length : 0);

  return (
    <div ref={containerRef} className={`relative z-40 ${className}`}>
      {/* Input pill */}
      <div 
        className="flex items-center bg-white dark:bg-[#18181b] px-3.5 py-2 rounded-xl w-72 md:w-80 lg:w-96 border border-gray-200 dark:border-zinc-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-sm"
        style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
      >
        <Search size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" />
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            loadExpertData();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search clients, sessions, or pages..." 
          className="bg-transparent border-none outline-none ml-2 text-xs md:text-sm w-full text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 font-medium" 
        />
        
        {loading && (
          <Loader2 size={14} className="text-emerald-500 animate-spin shrink-0 ml-1.5" />
        )}

        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0"
            title="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Floating Dropdown Results */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-[999] opacity-100"
          style={{ backgroundColor: 'var(--color-surface, #ffffff)', opacity: 1 }}
        >
          <div 
            className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-[#18181b]"
            style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
          >
            
            {/* When NO query: Show Expert Quick Actions */}
            {!qLower && (
              <div className="p-3 bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[11px] font-bold text-on-surface/50 uppercase tracking-wider">
                    Quick Navigation
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Expert Workspace
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {matchingPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <button
                        key={page.title}
                        type="button"
                        onClick={() => handleSelectPage(page)}
                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-light text-left transition-colors border border-transparent hover:border-border-color/60 group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Icon size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-on-surface group-hover:text-emerald-600 truncate transition-colors">
                            {page.title}
                          </p>
                          <span className="text-[10px] text-on-surface/50">{page.badge}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty results */}
            {qLower && totalResults === 0 && (
              <div className="p-6 text-center bg-white dark:bg-[#18181b]">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-2">
                  <Search size={18} />
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-zinc-100">No matching clients or pages found</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                  Try searching by client name, email, or a portal section
                </p>
              </div>
            )}

            {/* RESULTS: CLIENTS */}
            {qLower && matchingClients.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]">
                <div className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon size={12} />
                  <span>Clients ({matchingClients.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchingClients.map((client) => (
                    <div
                      key={client._id}
                      onClick={() => handleSelectClient(client)}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-emerald-50/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={client.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name || 'Client')}&background=10b981&color=fff`}
                          alt={client.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                            {client.name}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate max-w-[180px]">
                            {client.email || client.mobile || 'Registered Client'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        Chat <ArrowRight size={10} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS: CONSULTATIONS */}
            {qLower && matchingConsultations.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]">
                <div className="px-2.5 py-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Sessions & Consultations ({matchingConsultations.length})</span>
                </div>
                <div className="space-y-1 mt-1">
                  {matchingConsultations.map((c) => (
                    <div
                      key={c._id}
                      onClick={handleSelectConsultation}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-blue-50/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Calendar size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                            {c.user?.name || 'Client Session'}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-zinc-400 capitalize">
                            {c.type} · {c.status}
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={13} className="text-gray-400 group-hover:text-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS: PAGES */}
            {qLower && matchingPages.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]">
                <div className="px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Pages
                </div>
                <div className="space-y-1 mt-1">
                  {matchingPages.map((page) => {
                    const Icon = page.icon;
                    return (
                      <div
                        key={page.title}
                        onClick={() => handleSelectPage(page)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-emerald-50/70 dark:hover:bg-zinc-800 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 flex items-center justify-center shrink-0">
                            <Icon size={13} />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                            {page.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 group-hover:text-emerald-600 flex items-center gap-1">
                          Go to <ExternalLink size={10} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
