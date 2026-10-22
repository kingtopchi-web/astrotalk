import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, X, Loader2, ArrowRight, Star, Sparkles, Compass, 
  Calendar, Wallet, MessageSquare, HelpCircle, Gift, Settings, 
  User as UserIcon, BookOpen, ExternalLink, CheckCircle
} from 'lucide-react';

const API_BASE = 'https://experthub.nextgoodtechnologies.in/api';

const QUICK_LINKS = [
  { title: 'Find Experts', path: '/experts', icon: Compass, badge: 'Explore' },
  { title: 'My Bookings', path: '/bookings', icon: Calendar, badge: 'Sessions' },
  { title: 'My Wallet', path: '/wallet', icon: Wallet, badge: 'Recharge' },
  { title: 'Messages & Chat', path: '/messages', icon: MessageSquare, badge: 'Live' },
  { title: 'Free Services', path: '/free-services', icon: Gift, badge: 'Free' },
  { title: 'Help & Support', path: '/support', icon: HelpCircle, badge: '24/7' },
  { title: 'All Categories', path: '/categories', icon: BookOpen, badge: 'Browse' },
  { title: 'My Profile', path: '/profile', icon: UserIcon, badge: 'Account' },
  { title: 'Settings', path: '/settings', icon: Settings, badge: 'Prefs' },
  { title: 'Blog & Articles', path: '/blog', icon: BookOpen, badge: 'Read' },
];

const POPULAR_SEARCHES = [
  'Vedic Astrology',
  'Tarot Reading',
  'Career Advice',
  'Relationship Counseling',
  'Numerology',
  'Legal Advice'
];

export default function UserSearchBar({ className = '' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'experts', 'categories', 'pages'
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
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

  // Keyboard shortcut '/' to focus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setExperts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Try new /api/public/search endpoint first
        const searchRes = await axios.get(`${API_BASE}/public/search?q=${encodeURIComponent(query.trim())}`).catch(() => null);
        
        if (searchRes && searchRes.data) {
          setExperts(searchRes.data.experts || []);
          setCategories(searchRes.data.categories || []);
        } else {
          // Fallback to standard endpoints
          const [expRes, catRes] = await Promise.all([
            axios.get(`${API_BASE}/public/experts?search=${encodeURIComponent(query.trim())}&limit=5`).catch(() => ({ data: { data: [] } })),
            axios.get(`${API_BASE}/public/categories`).catch(() => ({ data: [] }))
          ]);

          const foundExperts = expRes.data?.data || expRes.data?.experts || [];
          const allCats = Array.isArray(catRes.data) ? catRes.data : [];
          const qLower = query.toLowerCase();
          const foundCats = allCats.filter(c => 
            c.name?.toLowerCase().includes(qLower) || 
            c.description?.toLowerCase().includes(qLower)
          ).slice(0, 4);

          setExperts(foundExperts.slice(0, 5));
          setCategories(foundCats);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Filtered quick links matching query
  const matchingLinks = QUICK_LINKS.filter(l => 
    !query.trim() || l.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  // Flat list of selectable items for keyboard arrow navigation
  const flatItems = [];
  if (query.trim()) {
    if (activeTab === 'all' || activeTab === 'experts') {
      experts.forEach(e => flatItems.push({ type: 'expert', item: e, action: () => handleSelectExpert(e) }));
    }
    if (activeTab === 'all' || activeTab === 'categories') {
      categories.forEach(c => flatItems.push({ type: 'category', item: c, action: () => handleSelectCategory(c) }));
    }
    if (activeTab === 'all' || activeTab === 'pages') {
      matchingLinks.forEach(l => flatItems.push({ type: 'link', item: l, action: () => handleSelectLink(l) }));
    }
  }

  const handleSelectExpert = (expert) => {
    setIsOpen(false);
    navigate(`/expert/${expert._id}`);
  };

  const handleSelectCategory = (category) => {
    setIsOpen(false);
    navigate(`/experts?categoryId=${category._id}`);
  };

  const handleSelectLink = (link) => {
    setIsOpen(false);
    navigate(link.path);
  };

  const handleSubmitSearch = (e) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && flatItems[selectedIndex]) {
      flatItems[selectedIndex].action();
      return;
    }
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/experts?search=${encodeURIComponent(query.trim())}`);
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
      handleSubmitSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const totalResults = experts.length + categories.length + (query.trim() ? matchingLinks.length : 0);

  return (
    <div ref={containerRef} className={`relative z-40 ${className}`}>
      {/* Search Input Bar - Solid background */}
      <form 
        onSubmit={handleSubmitSearch}
        className="flex items-center bg-white dark:bg-[#18181b] px-4 py-2.5 rounded-2xl w-full sm:w-[380px] lg:w-[440px] shadow-sm border border-gray-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-amber-400/30 focus-within:border-amber-400 transition-all duration-200"
        style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
      >
        <Search size={18} className="text-gray-400 dark:text-zinc-500 shrink-0 transition-colors" />
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
          placeholder="Search experts, categories, or anything..." 
          className="bg-transparent border-none outline-none ml-3 text-sm w-full text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500" 
        />
        
        {loading && (
          <Loader2 size={16} className="text-amber-500 animate-spin shrink-0 ml-2" />
        )}

        {query && !loading && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 shrink-0 transition-colors"
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}

        {!query && (
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shrink-0 ml-2">
            /
          </kbd>
        )}
      </form>

      {/* Dropdown Floating Results - 100% Solid Non-Transparent Background */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 sm:right-auto sm:w-[440px] mt-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden z-[999] opacity-100"
          style={{ backgroundColor: 'var(--color-surface, #ffffff)', opacity: 1 }}
        >
          
          {/* Header Filters / Category Tabs if query typed */}
          {query.trim() && (
            <div className="flex items-center gap-1.5 p-2.5 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-amber-400 text-gray-900 font-bold shadow-sm' 
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-200/60 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                All ({totalResults})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('experts')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'experts' 
                    ? 'bg-amber-400 text-gray-900 font-bold shadow-sm' 
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-200/60 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                Experts ({experts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'categories' 
                    ? 'bg-amber-400 text-gray-900 font-bold shadow-sm' 
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-200/60 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                Categories ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pages')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'pages' 
                    ? 'bg-amber-400 text-gray-900 font-bold shadow-sm' 
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-200/60 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                Quick Links ({matchingLinks.length})
              </button>
            </div>
          )}

          <div 
            className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-[#18181b]"
            style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
          >
            {/* If query is EMPTY: Show Trending & Quick Navigation */}
            {!query.trim() && (
              <div className="p-4 space-y-4 bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          navigate(`/experts?search=${encodeURIComponent(term)}`);
                          setIsOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 dark:hover:bg-zinc-700 text-xs font-medium text-gray-800 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-700 transition-all flex items-center gap-1.5"
                      >
                        <Search size={12} className="opacity-50" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2">
                    <Compass size={14} className="text-amber-500" />
                    <span>Quick Navigation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_LINKS.slice(0, 6).map((link) => {
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.title}
                          type="button"
                          onClick={() => handleSelectLink(link)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-amber-50/60 dark:hover:bg-zinc-800 text-left transition-colors border border-gray-200/60 dark:border-zinc-800"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Icon size={14} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">{link.title}</p>
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400">{link.badge}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* If query has NO results */}
            {query.trim() && !loading && totalResults === 0 && (
              <div className="p-8 text-center bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 flex items-center justify-center mx-auto mb-3">
                  <Search size={22} />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">No results found for "{query}"</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Try searching by specialty, career, astrology, or legal advice
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/experts');
                    setIsOpen(false);
                  }}
                  className="mt-4 px-4 py-2 bg-amber-400 text-gray-900 font-bold rounded-xl text-xs hover:bg-amber-500 transition-colors shadow-sm"
                >
                  Browse All Experts
                </button>
              </div>
            )}

            {/* RESULTS: EXPERTS */}
            {query.trim() && (activeTab === 'all' || activeTab === 'experts') && experts.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div className="px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Experts
                </div>
                <div className="space-y-1 mt-1">
                  {experts.map((expert) => {
                    const price = expert.rates?.chat || expert.rates?.call || expert.pricePerMinute || 25;
                    const rating = expert.rating ? Number(expert.rating).toFixed(1) : '5.0';
                    return (
                      <div
                        key={expert._id}
                        onClick={() => handleSelectExpert(expert)}
                        className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-amber-50/70 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group border border-transparent hover:border-amber-200 dark:hover:border-zinc-700"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'Expert')}&background=2563eb&color=fff`}
                            alt={expert.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-zinc-700"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'Expert')}&background=2563eb&color=fff`;
                            }}
                          />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900"></span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                              {expert.name}
                            </h4>
                            <CheckCircle size={12} className="text-amber-500 shrink-0" />
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate">
                            {expert.specialty || expert.categoryId?.name || 'Consultant'}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 justify-end">
                            <Star size={11} fill="currentColor" />
                            <span>{rating}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                            ₹{price}/min
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESULTS: CATEGORIES */}
            {query.trim() && (activeTab === 'all' || activeTab === 'categories') && categories.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div className="px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Categories
                </div>
                <div className="space-y-1 mt-1">
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      onClick={() => handleSelectCategory(category)}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-amber-50/70 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group border border-transparent hover:border-amber-200 dark:hover:border-zinc-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {category.icon || category.name?.charAt(0) || '✦'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {category.name}
                          </p>
                          {category.description && (
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate max-w-[240px]">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS: QUICK PAGES */}
            {query.trim() && (activeTab === 'all' || activeTab === 'pages') && matchingLinks.length > 0 && (
              <div className="p-2 bg-white dark:bg-[#18181b]" style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}>
                <div className="px-2.5 py-1 text-[11px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Pages & Navigation
                </div>
                <div className="space-y-1 mt-1">
                  {matchingLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <div
                        key={link.title}
                        onClick={() => handleSelectLink(link)}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#18181b] hover:bg-amber-50/70 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group border border-transparent hover:border-amber-200 dark:hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 group-hover:bg-amber-100 group-hover:text-amber-800 flex items-center justify-center shrink-0 transition-colors">
                            <Icon size={14} />
                          </div>
                          <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                            {link.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 group-hover:text-amber-600 flex items-center gap-1">
                          Jump to <ExternalLink size={10} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer - Full search submit */}
          {query.trim() && (
            <div 
              onClick={handleSubmitSearch}
              className="p-3 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between hover:bg-amber-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors group text-xs font-bold text-amber-700 dark:text-amber-400"
            >
              <div className="flex items-center gap-2">
                <Search size={14} />
                <span>See all results for "{query}"</span>
              </div>
              <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Search <ArrowRight size={13} />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
