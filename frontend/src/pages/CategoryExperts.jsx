import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import { getCachedUserLocation, requestUserLocation } from '../utils/userLocation';
import {
  Search,
  Star,
  ShieldCheck,
  Video,
  Phone,
  MessageCircle,
  Heart,
  X,
  Globe,
  MapPin,
  RotateCcw,
  ArrowLeft,
  Users,
  Grid
} from 'lucide-react';

const categoryFallbackImages = {
  astrologer: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=800&q=80',
  finance: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
  career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80',
  doctors: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
  health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
  wellness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  tech: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80'
};

const getCatImage = (cat) => {
  if (cat?.image) return cat.image;
  const s = (cat?.slug || '').toLowerCase();
  const n = (cat?.name || '').toLowerCase();
  if (categoryFallbackImages[s]) return categoryFallbackImages[s];
  for (const [k, url] of Object.entries(categoryFallbackImages)) {
    if (s.includes(k) || n.includes(k)) return url;
  }
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80';
};

export default function CategoryExperts() {
  const { id } = useParams();
  const navigate = useNavigate();
  useAuth();

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategoryByCat, setSelectedSubCategoryByCat] = useState({});
  const [experts, setExperts] = useState([]);
  const [, setLoadingCategories] = useState(true);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingExperts, setLoadingExperts] = useState(true);

  // Dynamic Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');

  // Bookmarking / Saved
  const [savedExpertIds, setSavedExpertIds] = useState(new Set());
  const [userLocation, setUserLocation] = useState(getCachedUserLocation);

  useEffect(() => {
    requestUserLocation((coords) => {
      setUserLocation(coords);
    });
  }, []);

  // 1. Fetch all categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      setLoadingCategories(true);
      try {
        const res = await axios.get(getApiUrl('/public/categories'));
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCats();
  }, []);

  // Determine current active category
  const currentCategory = useMemo(() => {
    if (!id || id === 'all') return null;
    return categories.find(c => c._id === id || c.slug === id) || null;
  }, [id, categories]);

  const activeCategoryId = currentCategory ? currentCategory._id : (id === 'all' ? 'all' : id);
  const activeSubCategory = selectedSubCategoryByCat[activeCategoryId] || 'all';
  const setActiveSubCategory = (subId) => {
    setSelectedSubCategoryByCat(prev => ({ ...prev, [activeCategoryId]: subId }));
  };

  // 2. Fetch Sub-Categories whenever category changes
  useEffect(() => {
    if (!activeCategoryId || activeCategoryId === 'all') {
      setSubCategories([]);
      return;
    }

    const fetchSubs = async () => {
      setLoadingSubCategories(true);
      try {
        const res = await axios.get(getApiUrl(`/public/categories/${activeCategoryId}/subcategories`));
        setSubCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load subcategories', err);
        setSubCategories([]);
      } finally {
        setLoadingSubCategories(false);
      }
    };

    fetchSubs();
  }, [activeCategoryId]);

  // 3. Fetch Experts whenever category or sub-category changes
  useEffect(() => {
    const fetchCategoryExperts = async () => {
      setLoadingExperts(true);
      try {
        let url = getApiUrl('/public/experts?limit=100');
        if (activeCategoryId && activeCategoryId !== 'all') {
          url += `&categoryId=${activeCategoryId}`;
        }
        if (activeSubCategory && activeSubCategory !== 'all') {
          url += `&subCategoryId=${activeSubCategory}`;
        }
        if (userLocation?.lat && userLocation?.lng) {
          url += `&latitude=${userLocation.lat}&longitude=${userLocation.lng}`;
        }

        const res = await axios.get(url);
        const data = res.data?.data || res.data?.experts || [];
        setExperts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch experts', err);
        setExperts([]);
      } finally {
        setLoadingExperts(false);
      }
    };

    fetchCategoryExperts();
  }, [activeCategoryId, activeSubCategory, userLocation]);

  // 4. Load Saved Experts
  useEffect(() => {
    const fetchSaved = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(getApiUrl('/user/saved-experts'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setSavedExpertIds(new Set(res.data.map(exp => (typeof exp === 'object' ? exp._id : exp))));
        }
      } catch {}
    };
    fetchSaved();
  }, []);

  const handleToggleSave = async (expertId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const isCurrentlySaved = savedExpertIds.has(expertId);
    setSavedExpertIds(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) next.delete(expertId);
      else next.add(expertId);
      return next;
    });

    try {
      const res = await axios.post(
        getApiUrl(`/user/saved-experts/${expertId}`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.savedExperts) {
        setSavedExpertIds(new Set(res.data.savedExperts.map(i => i.toString())));
      }
    } catch {
      setSavedExpertIds(prev => {
        const reverted = new Set(prev);
        if (isCurrentlySaved) reverted.add(expertId);
        else reverted.delete(expertId);
        return reverted;
      });
    }
  };

  // Dynamic Countries extracted from current experts
  const availableCountries = useMemo(() => {
    const set = new Set();
    experts.forEach(exp => {
      if (exp.country && typeof exp.country === 'string' && exp.country.trim()) {
        set.add(exp.country.trim());
      }
    });
    return Array.from(set).sort();
  }, [experts]);

  // Dynamic Languages extracted from current experts
  const availableLanguages = useMemo(() => {
    const set = new Set();
    experts.forEach(exp => {
      if (Array.isArray(exp.languages)) {
        exp.languages.forEach(l => {
          if (typeof l === 'string' && l.trim()) set.add(l.trim());
        });
      } else if (typeof exp.languages === 'string' && exp.languages.trim()) {
        exp.languages.split(',').forEach(l => {
          if (l.trim()) set.add(l.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [experts]);

  // Filtered & Sorted Experts
  const filteredExperts = useMemo(() => {
    return experts
      .filter(exp => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = exp.name?.toLowerCase().includes(q);
          const matchSpecialty = (exp.specialty || exp.specialization || '').toLowerCase().includes(q);
          const matchSub = exp.subCategoryId?.name?.toLowerCase().includes(q);
          if (!matchName && !matchSpecialty && !matchSub) return false;
        }

        // 2. Online Only
        if (onlineOnly && exp.onlineStatus !== 'online') {
          return false;
        }

        // 3. Country Filter
        if (selectedCountry !== 'all') {
          const c = (exp.country || '').toLowerCase().trim();
          if (c !== selectedCountry.toLowerCase().trim()) return false;
        }

        // 4. Language Filter
        if (selectedLanguage !== 'all') {
          const langStr = Array.isArray(exp.languages)
            ? exp.languages.join(' ').toLowerCase()
            : String(exp.languages || '').toLowerCase();
          if (!langStr.includes(selectedLanguage.toLowerCase().trim())) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        }
        if (sortBy === 'experience') {
          return (Number(b.experience) || 0) - (Number(a.experience) || 0);
        }
        if (sortBy === 'price_asc') {
          const rateA = a.rates?.chat || a.pricePerMinute || 0;
          const rateB = b.rates?.chat || b.pricePerMinute || 0;
          return rateA - rateB;
        }
        if (sortBy === 'price_desc') {
          const rateA = a.rates?.chat || a.pricePerMinute || 0;
          const rateB = b.rates?.chat || b.pricePerMinute || 0;
          return rateB - rateA;
        }
        // Recommended default: online first, then higher rating
        if (a.onlineStatus === 'online' && b.onlineStatus !== 'online') return -1;
        if (b.onlineStatus === 'online' && a.onlineStatus !== 'online') return 1;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });
  }, [experts, searchQuery, onlineOnly, selectedCountry, selectedLanguage, sortBy]);

  const hasActiveFilters = searchQuery || selectedCountry !== 'all' || selectedLanguage !== 'all' || onlineOnly || activeSubCategory !== 'all' || sortBy !== 'recommended';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedLanguage('all');
    setOnlineOnly(false);
    setActiveSubCategory('all');
    setSortBy('recommended');
  };

  const activeSubCategoryObj = useMemo(() => {
    if (activeSubCategory === 'all') return null;
    return subCategories.find(s => s._id === activeSubCategory) || null;
  }, [activeSubCategory, subCategories]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0 overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-24 pb-16">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6">
          
          {/* Top-Left Back Button & Breadcrumb */}
          <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-on-surface-variant">
              <button
                type="button"
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/categories')}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-on-surface hover:text-primary transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                title="Go Back"
                aria-label="Go Back"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                Categories
              </button>
              <span>/</span>
              <span className="text-on-background font-semibold truncate max-w-[180px] sm:max-w-xs">
                {currentCategory ? currentCategory.name : 'All Experts'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/categories')}
              className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Grid size={15} /> All Categories
            </button>
          </div>

          {/* Category Banner Card */}
          <div className="bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-xs overflow-hidden mb-6 sm:mb-8">
            <div className="p-5 sm:p-7 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6">
              
              {/* Category Image */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary/50 shadow-md shrink-0">
                <img
                  src={currentCategory ? getCatImage(currentCategory) : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80'}
                  alt={currentCategory?.name || 'All Categories'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Category Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-2">
                  <Users size={12} />
                  <span>{currentCategory ? 'Specialized Domain' : 'Complete Marketplace'}</span>
                </div>

                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-on-background">
                  {currentCategory ? currentCategory.name : 'All Consultation Experts'}
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-2xl leading-relaxed">
                  {currentCategory?.description || 'Connect instantly with verified experts, advisors, and licensed professionals for 1-on-1 personalized guidance.'}
                </p>

                {/* Quick Meta Badges */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 mt-4">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-muted text-on-surface border border-border">
                    {experts.length} Verified {experts.length === 1 ? 'Expert' : 'Experts'}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {experts.filter(e => e.onlineStatus === 'online').length} Online Now
                  </span>
                  {subCategories.length > 0 && (
                    <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-surface-muted text-on-surface border border-border">
                      {subCategories.length} Sub-Categories
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switch to other categories */}
            <div className="bg-surface-muted/60 border-t border-border px-4 sm:px-6 py-2.5 overflow-x-auto flex items-center gap-2 hide-scrollbar">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
                Switch Domain:
              </span>
              <button
                type="button"
                onClick={() => navigate('/category/all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryId === 'all'
                    ? 'bg-primary text-background font-bold shadow-xs'
                    : 'bg-surface-card hover:bg-surface text-on-surface border border-border'
                }`}
              >
                All Domains
              </button>
              {categories.map((cat) => {
                const isActive = activeCategoryId === cat._id;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => navigate(`/category/${cat._id}`)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-background font-bold shadow-xs'
                        : 'bg-surface-card hover:bg-surface text-on-surface border border-border'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Categories Pills Row */}
          {(loadingSubCategories || subCategories.length > 0) && (
            <div className="bg-surface-card rounded-2xl border border-border p-4 sm:p-5 mb-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-bold text-sm sm:text-base text-on-background uppercase tracking-wide">
                    {currentCategory?.name || 'Category'} Sub-Categories
                  </h2>
                  {loadingSubCategories && (
                    <span className="text-xs text-primary animate-pulse">Loading...</span>
                  )}
                </div>
                {subCategories.length > 0 && (
                  <span className="text-xs text-on-surface-variant font-medium">
                    {subCategories.length} available
                  </span>
                )}
              </div>

              {loadingSubCategories ? (
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-8 w-24 bg-surface-muted rounded-full animate-pulse shrink-0" />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 hide-scrollbar">
                  {/* All in Category */}
                  <button
                    type="button"
                    onClick={() => setActiveSubCategory('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeSubCategory === 'all'
                        ? 'bg-primary text-background font-bold shadow-xs scale-102'
                        : 'bg-surface-muted hover:bg-surface text-on-surface border border-border'
                    }`}
                  >
                    All {currentCategory?.name || 'Subcategories'} ({experts.length})
                  </button>

                  {/* Subcategories */}
                  {subCategories.map((sub) => {
                    const isSubActive = activeSubCategory === sub._id;
                    return (
                      <button
                        key={sub._id}
                        type="button"
                        onClick={() => setActiveSubCategory(sub._id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isSubActive
                            ? 'bg-primary text-background font-bold shadow-xs scale-102'
                            : 'bg-surface-muted hover:bg-surface text-on-surface border border-border'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Search & Filter Toolbar */}
          <div className="bg-surface-card rounded-2xl border border-border p-4 sm:p-5 mb-6 shadow-xs">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Search Input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${currentCategory ? currentCategory.name : 'experts'} by name, specialty...`}
                  className="w-full pl-9 pr-9 py-2.5 bg-surface-muted border border-border rounded-xl text-xs sm:text-sm text-on-background placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-background cursor-pointer"
                    title="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5">
                
                {/* Online Only Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlineOnly(!onlineOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    onlineOnly
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'bg-surface-muted border-border text-on-surface hover:bg-surface'
                  }`}
                  title="Toggle online only experts"
                >
                  <span className={`w-2 h-2 rounded-full ${onlineOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>Online Only</span>
                </button>

                {/* Country Filter */}
                <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full appearance-none pl-8 pr-7 py-2 sm:py-2.5 bg-surface-muted border border-border rounded-xl text-xs sm:text-sm text-on-background font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                  >
                    <option value="all">All Countries</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>

                {/* Language Filter */}
                <div className="relative flex-1 sm:flex-none sm:min-w-[140px]">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full appearance-none pl-8 pr-7 py-2 sm:py-2.5 bg-surface-muted border border-border rounded-xl text-xs sm:text-sm text-on-background font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                  >
                    <option value="all">All Languages</option>
                    {availableLanguages.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <Globe size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" />
                  <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>

                {/* Sort Filter */}
                <div className="relative flex-1 sm:flex-none sm:min-w-[150px]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none pl-3 pr-7 py-2 sm:py-2.5 bg-surface-muted border border-border rounded-xl text-xs sm:text-sm text-on-background font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                  >
                    <option value="recommended">Sort: Recommended</option>
                    <option value="rating">Highest Rated</option>
                    <option value="experience">Most Experienced</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <span className="material-symbols-outlined text-[16px] absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="flex items-center gap-1 px-3 py-2 sm:py-2.5 bg-surface-muted hover:bg-surface border border-border hover:border-primary/50 text-xs text-on-surface-variant hover:text-primary rounded-xl font-medium transition-colors cursor-pointer shrink-0"
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section Header with count */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-on-background">
                {activeSubCategoryObj
                  ? `${activeSubCategoryObj.name} Experts`
                  : currentCategory
                  ? `${currentCategory.name} Experts`
                  : 'All Experts'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                {filteredExperts.length}
              </span>
            </div>
          </div>

          {/* Experts Grid */}
          {loadingExperts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-surface-card rounded-2xl p-5 border border-border shadow-xs animate-pulse">
                  <div className="w-20 h-20 bg-surface-muted rounded-full mx-auto mb-3" />
                  <div className="h-4 bg-surface-muted rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-surface-muted rounded w-1/2 mx-auto mb-3" />
                  <div className="h-9 bg-surface-muted rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredExperts.length === 0 ? (
            <div className="bg-surface-card border border-border rounded-3xl p-8 sm:p-14 text-center text-on-surface-variant flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs">
              <span className="material-symbols-outlined text-5xl mb-3 text-on-surface-variant/50">person_search</span>
              <h3 className="font-heading font-bold text-lg sm:text-xl text-on-background mb-1">
                No experts found
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mb-5 leading-relaxed">
                {hasActiveFilters
                  ? 'We could not find any experts matching your active filters. Try adjusting your search query, country, or language selection.'
                  : 'No verified experts are currently listed under this category or sub-category. Please check back soon or browse other categories.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 bg-primary text-background rounded-full font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Clear Filters & View All
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredExperts.map((expert) => {
                const isOnline = expert.onlineStatus === 'online';
                return (
                  <div
                    key={expert._id}
                    onClick={() => navigate(`/expert/${expert._id}`)}
                    className="bg-surface-card rounded-2xl border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col relative group cursor-pointer"
                  >
                    {/* Heart Bookmark */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(expert._id, e)}
                      aria-label="Save expert"
                      title={savedExpertIds.has(expert._id) ? "Remove from saved" : "Save expert"}
                      className={`absolute top-3.5 left-3.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 border ${
                        savedExpertIds.has(expert._id)
                          ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-xs'
                          : 'bg-background/90 backdrop-blur border-border text-on-surface/50 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <Heart
                        size={14}
                        className={`transition-colors ${
                          savedExpertIds.has(expert._id) ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>

                    {/* Status Badge */}
                    <div className="absolute top-3.5 right-3.5 bg-background/90 backdrop-blur px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs z-10 border border-border">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-slate-400'}`}></div>
                      <span className="text-[9px] font-bold text-on-background uppercase tracking-wider">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 flex flex-col items-center text-center relative flex-1">
                      {/* Avatar */}
                      <div className="relative mt-1">
                        <img
                          className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary shadow-sm relative z-10"
                          alt={expert.name}
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=FFD700&color=000&font-size=0.33&bold=true`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=FFD700&color=000&font-size=0.33&bold=true`;
                          }}
                        />
                        {expert.isVerified && (
                          <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5 z-20 shadow-xs text-primary">
                            <ShieldCheck size={16} className="fill-primary text-background" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="font-heading font-bold text-base text-on-background mt-3 group-hover:text-primary transition-colors truncate max-w-full text-center">
                        {expert.name}
                      </h3>

                      {/* Specialty / Category */}
                      <p className="font-body text-xs font-semibold text-primary mt-0.5 truncate max-w-full text-center h-4.5 flex items-center justify-center">
                        {expert.subCategoryId?.name || expert.category?.name || expert.specialty || 'Professional Consultant'}
                      </p>

                      {/* Experience */}
                      <div className="h-4 flex items-center justify-center mt-0.5 mb-1.5">
                        <p className="text-[11px] font-medium text-on-surface-variant">
                          {expert.experience ? `${expert.experience} Years Exp.` : 'Verified Expert'}
                        </p>
                      </div>

                      {/* Ratings */}
                      <div className="flex items-center justify-center gap-1.5 text-xs mb-2 w-full">
                        <div className="flex items-center gap-1 bg-warning/15 text-warning px-2 py-0.5 rounded-full font-bold">
                          <Star size={11} className="fill-warning text-warning" />
                          <span className="text-xs">{expert.rating || '4.9'}</span>
                        </div>
                        <span className="text-on-surface-variant text-[11px] font-medium">
                          ({expert.reviewsCount || 0} reviews)
                        </span>
                      </div>

                      {/* Country & Languages Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3 w-full">
                        {typeof expert.distanceKm === 'number' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60" title={`Geographical distance from your live location: ${expert.distanceKm} KM`}>
                            <MapPin size={10} className="text-emerald-600 shrink-0" />
                            <span>{Math.round(expert.distanceKm)} km</span>
                          </span>
                        )}
                        {expert.country && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-border/60">
                            <MapPin size={10} className="text-primary shrink-0" />
                            <span className="truncate max-w-[90px]">{expert.country}</span>
                          </span>
                        )}
                        <span 
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-border/60 truncate max-w-[140px]"
                          title={Array.isArray(expert.languages) && expert.languages.length > 0 ? expert.languages.join(', ') : 'English, Hindi'}
                        >
                          <Globe size={10} className="text-amber-500 shrink-0" />
                          <span className="truncate">
                            {Array.isArray(expert.languages) && expert.languages.length > 0 
                              ? (expert.languages.length <= 2 
                                  ? expert.languages.join(', ') 
                                  : `${expert.languages.slice(0, 2).join(', ')} +${expert.languages.length - 2}`)
                              : 'English, Hindi'}
                          </span>
                        </span>
                      </div>

                      {/* Dynamic Consultation Rates */}
                      <div className="grid grid-cols-3 gap-1 w-full mb-3.5 py-1.5 px-1 bg-surface-muted rounded-xl border border-border/70 text-center">
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-0.5">
                            <MessageCircle size={10} className="text-primary shrink-0" /> Chat
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5 flex items-baseline justify-center">
                            ₹{Math.max(5, expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 5))}
                            <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-0.5 border-x border-border/60">
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-0.5">
                            <Phone size={10} className="text-success shrink-0" /> Audio
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5 flex items-baseline justify-center">
                            ₹{Math.max(10, expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10))}
                            <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-0.5">
                            <Video size={10} className="text-warning shrink-0" /> Video
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5 flex items-baseline justify-center">
                            ₹{Math.max(20, expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20))}
                            <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-auto w-full grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expert/${expert._id}?action=chat`);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 bg-surface hover:bg-primary/10 border border-border text-on-background hover:text-primary hover:border-primary/50 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                        >
                          <MessageCircle size={13} className="text-primary" /> Chat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expert/${expert._id}?action=call`);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary/90 text-background rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-xs"
                        >
                          <Phone size={13} /> Call
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
