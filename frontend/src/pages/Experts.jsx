import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, List, Video, Phone, X, MessageSquare, Heart, Wallet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { fetchFreeChatConfig, getApiUrl } from '../utils/apiConfig';

function ExpertDiscovery() {
  const { user } = useAuth();
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const queryParams = new URLSearchParams(useLocation().search);
  const modeParam = queryParams.get('mode');
  const catParam = queryParams.get('categoryId');
  const searchParam = queryParams.get('search');
  const [search, setSearch] = useState(searchParam || '');
  const [consultationMode, setConsultationMode] = useState(modeParam || '');
  const [selectedCategory, setSelectedCategory] = useState(catParam || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Admin-like toolbar state
  const [showSearch, setShowSearch] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callMinutes, setCallMinutes] = useState(15);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [savedExpertIds, setSavedExpertIds] = useState(new Set());
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [freeChatStatus, setFreeChatStatus] = useState(null);
  const [freeDurationMinutes, setFreeDurationMinutes] = useState(5);

  useEffect(() => {
    fetchFreeChatConfig().then(cfg => {
      if (cfg) {
        setFreeChatStatus(cfg);
        if (cfg.freeChatDurationMinutes) {
          setFreeDurationMinutes(cfg.freeChatDurationMinutes);
        }
      }
    }).catch(() => {});
  }, [user]);
  
  // Modern Toast and Shortfall Prompt state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const [showShortfallModal, setShowShortfallModal] = useState(false);
  const [shortfallData, setShortfallData] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const navigate = useNavigate();

  // Load saved experts for currently logged-in user
  useEffect(() => {
    const fetchSaved = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/user/saved-experts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setSavedExpertIds(new Set(res.data.map(exp => (typeof exp === 'object' ? exp._id : exp))));
        }
      } catch (err) {
        console.error('Failed to load saved experts:', err);
      }
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
        `https://astrotalk-hlg2.onrender.com/api/user/saved-experts/${expertId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.savedExperts) {
        setSavedExpertIds(new Set(res.data.savedExperts.map(id => id.toString())));
      }
    } catch (err) {
      console.error('Save expert error:', err);
      // Revert state on error
      setSavedExpertIds(prev => {
        const reverted = new Set(prev);
        if (isCurrentlySaved) reverted.add(expertId);
        else reverted.delete(expertId);
        return reverted;
      });
    }
  };

  const fetchUserWallet = async () => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      setLoadingWallet(true);
      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bal = Number(res.data?.balance || 0);
      setWalletBalance(bal);
      return bal;
    } catch (err) {
      console.error('Wallet fetch error:', err);
      return 0;
    } finally {
      setLoadingWallet(false);
    }
  };

  const hasUsedFreeChat = Boolean(user?.hasUsedFreeChat || freeChatStatus?.hasUsedFreeChat);
  const isFreeChatEnabled = freeChatStatus ? freeChatStatus.enableFreeChat !== false : true;
  const isFreeEligible = Boolean(user && !hasUsedFreeChat && isFreeChatEnabled);

  const openCallModal = async (expert, type) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast("Please login first", 'info');
      navigate('/login');
      return;
    }
    setSelectedExpert(expert);
    setCallType(type);
    
    const curBal = await fetchUserWallet();
    const rate = type === 'video' 
      ? (expert.rates?.video || expert.pricePerMinute || 50)
      : type === 'audio' 
      ? (expert.rates?.audio || expert.pricePerMinute || 30)
      : (expert.rates?.chat || expert.pricePerMinute || 20);

    // If chat and user has not used their free chat benefit yet, allow starting without balance!
    const isFreeChatEligible = type === 'chat' && isFreeEligible;

    // Require at least 1 minute rate to start (only for paid sessions)
    if (!isFreeChatEligible && curBal < rate) {
      setShortfallData({
        currentBalance: curBal,
        neededAmount: rate,
        shortfall: Math.ceil(rate - curBal)
      });
      setShowShortfallModal(true);
      return;
    }

    setShowCallModal(true);
  };

  const getPerMinuteRate = () => {
    if (!selectedExpert) return 30;
    if (callType === 'video') return selectedExpert.rates?.video || selectedExpert.pricePerMinute || 50;
    if (callType === 'audio') return selectedExpert.rates?.audio || selectedExpert.pricePerMinute || 30;
    if (callType === 'chat') return selectedExpert.rates?.chat || selectedExpert.pricePerMinute || 20;
    return 30;
  };

  const executeSessionBookingAndPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const isFreeChat = callType === 'chat' && isFreeEligible;

      // 1. Create booking (Free if eligible, or Pay-As-You-Go with NO upfront deduction)
      const bookingRes = await axios.post(
        getApiUrl('/bookings'),
        {
          expertId: selectedExpert._id,
          date: new Date().toISOString(),
          type: callType === 'audio' ? 'Audio' : callType === 'chat' ? 'Chat' : 'Video',
          duration: 60,
          isInstant: true,
          isFree: isFreeChat
        },
        { headers }
      );

      if (isFreeChat && user) {
        user.hasUsedFreeChat = true;
        localStorage.setItem('user', JSON.stringify({ ...user, hasUsedFreeChat: true }));
      }

      const consultationId = bookingRes.data._id;

      showToast(isFreeChat ? '🎁 Free Chat Connected! Enjoy your consultation.' : 'Connecting session... Billed per-second from wallet.', 'success');
      setShowCallModal(false);
      setShowShortfallModal(false);

      // Instant redirect
      if (callType === 'chat') {
        axios.post(
          getApiUrl('/messages/conversations'),
          { expertId: selectedExpert._id },
          { headers }
        ).catch(() => {});
        navigate('/messages');
      } else {
        navigate(`/live/${consultationId}?type=${callType}`);
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Connection failed', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmShortfallTopup = async () => {
    if (!shortfallData) return;
    try {
      setProcessingPayment(true);
      await handleTopupShortfall(shortfallData.shortfall);
      setShowShortfallModal(false);
      await executeSessionBookingAndPayment();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Wallet recharge was cancelled.', 'error');
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [catParam]);

  useEffect(() => {
    axios.get('https://astrotalk-hlg2.onrender.com/api/public/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      axios.get(`https://astrotalk-hlg2.onrender.com/api/public/categories/${selectedCategory}/subcategories`)
        .then(res => setSubCategories(res.data))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  const fetchExperts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubCategory) params.subCategoryId = selectedSubCategory;
      if (search.trim()) params.search = search.trim();

      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/public/experts', {
        params
      });
      setExperts(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      setError('Unable to load experts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParam !== null && searchParam !== undefined) {
      setSearch(searchParam);
      setPage(1);
    }
  }, [searchParam]);

  useEffect(() => { fetchExperts(); }, [page, selectedCategory, selectedSubCategory, searchParam]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExperts();
  };

  const exportToCSV = () => {
    if (!experts.length) return;
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Category,Specialty,Experience,Rate\n" +
      experts.map(e => `"${e.name || ''}","${e.categoryId?.name || ''}","${e.specialty || e.specialization || ''}","${e.experience || ''}","${e.rates?.chat || e.pricePerMinute || 0}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <UserLayout title="Find an Expert" subtitle="Browse verified professionals ready to help you.">
      <div className="bg-surface border border-border-color rounded-xl p-4 md:p-6 mb-6 shadow-sm">
        {/* Dynamic Toolbar */}
            <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {showSearch && (
                  <form onSubmit={handleSearch} className="relative">
                    <input 
                      type="text" 
                      placeholder="Search name, specialty..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 w-48"
                    />
                    <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-on-surface/50" />
                  </form>
                )}
                
                {showFilters && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedCategory}
                      onChange={e => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); setPage(1); }}
                      className="py-1.5 px-3 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-surface"
                    >
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>

                    {selectedCategory && (
                      <select
                        value={selectedSubCategory}
                        onChange={e => { setSelectedSubCategory(e.target.value); setPage(1); }}
                        className="py-1.5 px-3 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-400 bg-surface"
                      >
                        <option value="">All Sub-categories</option>
                        {subCategories.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="w-9 h-9 flex items-center justify-center bg-surface border border-border-color rounded-lg text-on-surface/80 hover:bg-surface-light transition" title="Toggle View">
                  {viewMode === 'grid' ? <List size={16} /> : <Columns size={16} />}
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`w-9 h-9 flex items-center justify-center border border-border-color rounded-lg transition ${showFilters ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-on-surface/80 hover:bg-surface-light'}`} title="Filter">
                  <Filter size={16} />
                </button>
                <button onClick={exportToCSV} className="w-9 h-9 flex items-center justify-center bg-surface border border-border-color rounded-lg text-on-surface/80 hover:bg-surface-light transition" title="Download CSV">
                  <Download size={16} />
                </button>
                <button onClick={() => setShowSearch(!showSearch)} className={`w-9 h-9 flex items-center justify-center border border-border-color rounded-lg transition ${showSearch ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-on-surface/80 hover:bg-surface-light'}`} title="Search">
                  <SearchIcon size={16} />
                </button>
              </div>
            </div>
      </div>

      {/* Expert Grid */}
      <div>
        {error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl shadow-sm p-4 animate-pulse border border-border-color">
                  <div className="flex gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-surface-light"></div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-surface-light rounded w-3/4"></div>
                      <div className="h-3 bg-surface-light rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-surface-light rounded w-full mb-2"></div>
                  <div className="h-8 bg-surface-light rounded-xl mt-3"></div>
                </div>
              ))}
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-on-surface mb-2">No experts found</h3>
              <p className="text-on-surface/60 text-sm">No experts matching your filters. Try adjusting your search.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-on-surface/60 mb-4">{total} expert(s) found</p>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "flex flex-col gap-4"}>
                {experts.map((expert) => (
                  <div
                    key={expert._id}
                    onClick={() => navigate(`/expert/${expert._id}`)}
                    className={`bg-surface rounded-2xl shadow-sm border border-border-color p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all relative group ${viewMode === 'list' ? 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4' : ''}`}
                  >
                    {/* Heart Save / Bookmark Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(expert._id, e)}
                      aria-label={savedExpertIds.has(expert._id) ? "Remove from saved" : "Save expert"}
                      title={savedExpertIds.has(expert._id) ? "Remove from saved" : "Save expert"}
                      className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
                        savedExpertIds.has(expert._id)
                          ? 'bg-rose-50 text-rose-500 border border-rose-200 shadow-sm'
                          : 'bg-surface-light/80 hover:bg-rose-50 text-on-surface/40 hover:text-rose-500 border border-border-color/60 hover:border-rose-200'
                      }`}
                    >
                      <Heart
                        size={17}
                        className={`transition-transform hover:scale-110 active:scale-90 ${
                          savedExpertIds.has(expert._id) ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                    {/* Avatar + Status */}
                    <div className={`flex items-start gap-3 ${viewMode === 'grid' ? 'mb-3' : 'min-w-[200px]'}`}>
                      <div className="relative shrink-0">
                        <img
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F97316&color=fff`}
                          alt={expert.name}
                          className="w-14 h-14 rounded-2xl object-cover"
                        />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${expert.onlineStatus === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-on-surface text-sm truncate">{expert.name}</h3>
                        <p className="text-xs text-on-surface/60 truncate">{expert.categoryId?.name || expert.specialty}</p>
                        {expert.subCategoryId && (
                          <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full mt-1">
                            {expert.subCategoryId.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className={viewMode === 'list' ? 'flex-1 hidden sm:block px-4' : ''}>
                      {expert.experience && (
                        <p className="text-xs text-on-surface/60 mb-2">📅 {expert.experience} exp</p>
                      )}
                      {expert.specialization && (
                        <p className="text-xs text-on-surface/80 mb-2 line-clamp-2">{expert.specialization}</p>
                      )}
                    </div>

                    {/* Rate & Button */}
                    <div className={viewMode === 'list' ? 'w-full sm:w-auto shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3' : 'flex flex-col'}>
                      <div className={viewMode === 'grid' ? 'flex flex-col mt-3 border-t border-border-color pt-3 gap-2' : 'flex flex-col gap-2'}>
                        {viewMode === 'grid' && (
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              {expert.rating > 0 && (
                                <span className="text-xs font-medium text-amber-600">⭐ {expert.rating}</span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-on-surface">
                                ₹{Number(expert.rates?.chat || expert.pricePerMinute || 0).toFixed(2)}
                              </span>
                              <span className="text-xs text-on-surface/50">/min</span>
                            </div>
                          </div>
                        )}
                        <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'chat'); }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Chat
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'audio'); }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1"
                          >
                            Audio
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'video'); }}
                            className="bg-primary hover:bg-primary-light text-background text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all flex-1"
                          >
                            Video
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-surface-light transition">
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-on-surface/60">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm border border-slate-300 rounded-xl disabled:opacity-40 hover:bg-surface-light transition">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
      </div>

      {/* Call Modal */}
      {showCallModal && selectedExpert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border-color">
            <div className="p-4 border-b border-border-color flex items-center justify-between">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                {callType === 'video' ? <Video size={20} className="text-primary"/> : callType === 'audio' ? <Phone size={20} className="text-emerald-500"/> : <MessageSquare size={20} className="text-blue-500" />}
                Instant {callType === 'video' ? 'Video' : callType === 'audio' ? 'Audio' : 'Chat'} with {selectedExpert.name}
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-on-surface/50 hover:text-on-surface/80">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {/* Pay as you go Rate Info or Free Chat Banner */}
              {callType === 'chat' && isFreeEligible ? (
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-xl p-4 mb-4 border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold inline-block mb-1">
                      🎁 1-Time Free Consultation
                    </span>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">₹0 <span className="text-sm font-medium text-on-surface/70">/ Free Chat</span></p>
                    <p className="text-xs text-on-surface/70 mt-0.5">Admin limit: {freeDurationMinutes} min{freeDurationMinutes === 1 ? '' : 's'} • Zero wallet deduction</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/20">
                      100% Free
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-primary/10 rounded-xl p-4 mb-4 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-surface/70 uppercase tracking-wider font-semibold">Consultation Rate</p>
                    <p className="text-2xl font-black text-primary">₹{getPerMinuteRate()}<span className="text-sm font-medium text-on-surface/70"> / min</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/20">
                      Per-Second Billing
                    </span>
                  </div>
                </div>
              )}
              
              {/* Wallet Status Info */}
              <div className="bg-surface-light border border-border-color rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface/60 font-medium">Your Wallet Balance</p>
                    <p className="text-base font-bold text-on-surface">₹{walletBalance.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface/60">{callType === 'chat' && isFreeEligible ? 'Session cost' : 'Estimated talk time'}</p>
                  <p className="text-sm font-bold text-emerald-600">{callType === 'chat' && isFreeEligible ? '₹0 (Free Session)' : `~${Math.max(1, Math.floor(walletBalance / (getPerMinuteRate() * 1.2)))} mins`}</p>
                </div>
              </div>

              {/* No Upfront payment guarantee notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                <span className="text-base mt-0.5">💡</span>
                <div>
                  <p className="font-bold">{callType === 'chat' && isFreeEligible ? 'यह सत्र 100% मुफ़्त है!' : 'पहले कोई एडवांस पैसा नहीं कटेगा!'}</p>
                  <p className="opacity-90 mt-0.5">
                    {callType === 'chat' && isFreeEligible 
                      ? `एडमिन द्वारा निर्धारित ${freeDurationMinutes} मिनट तक आप बिना किसी शुल्क के चैट कर सकते हैं। समय पूरा होते ही चैट समाप्त हो जाएगी।`
                      : 'कॉल तुरंत शुरू होगी। जितनी देर बात होगी, सिर्फ़ उतने समय का पैसा बात खत्म होने पर वॉलेट से कटेगा।'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={executeSessionBookingAndPayment}
                disabled={processingPayment}
                className="w-full bg-primary text-background font-bold py-3.5 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                {processingPayment ? (
                  'Connecting...'
                ) : callType === 'chat' && isFreeEligible ? (
                  <>
                    <MessageSquare size={18} />
                    <span>Start Free Chat ({freeDurationMinutes}m) / मुफ़्त चैट शुरू करें (₹0)</span>
                  </>
                ) : (
                  <>
                    <Phone size={18} />
                    <span>Start Session Now / अभी शुरू करें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortfall Modal */}
      {showShortfallModal && shortfallData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-color rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowShortfallModal(false)}
              className="absolute top-4 right-4 text-on-surface/50 hover:text-on-surface p-1 rounded-lg"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4">
              <Wallet size={28} />
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-1">Insufficient Wallet Balance</h3>
            <p className="text-xs text-amber-600 font-semibold mb-3">अपर्याप्त बैलेंस</p>
            <p className="text-sm text-on-surface/70 mb-4">
              इस विशेषज्ञ से बात शुरू करने के लिए आपके वॉलेट में कम से कम 1 मिनट का बैलेंस (<span className="font-bold text-on-surface">₹{shortfallData.neededAmount}</span>) होना आवश्यक है।
            </p>
            <div className="bg-surface-light rounded-xl p-3.5 border border-border-color mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface/60">वर्तमान वॉलेट बैलेंस:</span>
                <span className="font-bold text-on-surface">₹{shortfallData.currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border-color pt-2">
                <span className="text-on-surface/60">कम से कम जोड़ने योग्य राशि:</span>
                <span className="font-black text-primary text-base">₹{shortfallData.shortfall}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShortfallModal(false)}
                className="flex-1 py-3 px-4 border border-border-color rounded-xl font-bold text-on-surface/70 hover:bg-surface-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowShortfallModal(false);
                  navigate('/wallet');
                }}
                className="flex-1 py-3 px-4 bg-primary text-background rounded-xl font-bold hover:bg-primary-light transition-colors shadow-sm"
              >
                Recharge Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-semibold border ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800 backdrop-blur-md'
              : toast.type === 'info'
              ? 'bg-slate-900/95 text-slate-100 border-slate-700 backdrop-blur-md'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800 backdrop-blur-md'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}
    </UserLayout>
  );
}

export default ExpertDiscovery;
