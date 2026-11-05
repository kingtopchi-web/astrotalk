import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Columns, Filter, Download, Search as SearchIcon, List, Video, Phone, X, MessageSquare, Heart, Wallet, CheckCircle2, AlertCircle, ArrowRight, Globe, MapPin, Bell } from 'lucide-react';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { fetchFreeChatConfig, getApiUrl } from '../utils/apiConfig';
import { getCachedUserLocation, requestUserLocation } from '../utils/userLocation';
import { createSocket } from '../utils/socket';

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
  const [userLocation, setUserLocation] = useState(getCachedUserLocation);
  
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
  const [notifiedExpertIds, setNotifiedExpertIds] = useState(new Set());
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

  // Request actual user coordinates for accurate geographic distance filtering
  useEffect(() => {
    requestUserLocation((coords) => {
      setUserLocation(coords);
    });
  }, []);

  // Real-time listener for expert status changes
  useEffect(() => {
    let socket;
    try {
      socket = createSocket();
      socket.on('expert_status_changed', (data) => {
        if (!data?.expertId) return;
        setExperts(prev => prev.map(exp => {
          if (exp._id?.toString() === data.expertId.toString()) {
            return { ...exp, onlineStatus: data.onlineStatus };
          }
          return exp;
        }));
      });
    } catch (e) {
      console.warn('Socket connect failed on Experts', e);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);
  
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
        const res = await axios.get(getApiUrl('/user/saved-experts'), {
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
        getApiUrl(`/user/saved-experts/${expertId}`),
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
      const res = await axios.get(getApiUrl('/wallet'), {
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

  const isFreeChatEnabled = freeChatStatus ? freeChatStatus.enableFreeChat !== false : true;
  const isExpertFreeEligible = (expertId) => {
    if (!user || user.role !== 'USER' || !expertId) return false;
    if (!isFreeChatEnabled) return false;
    const usedList = freeChatStatus?.usedExpertIds || [];
    const hasUsedToday = Boolean(freeChatStatus?.hasUsedToday);
    if (hasUsedToday) return false;
    if (usedList.includes(expertId)) return false;
    return true;
  };

  const isSelectedExpertFree = Boolean(
    callType === 'audio' && selectedExpert && isExpertFreeEligible(selectedExpert._id)
  );
  const isSelectedExpertClaimed = Boolean(
    selectedExpert && (freeChatStatus?.usedExpertIds || []).includes(selectedExpert._id)
  );
  const isDailyLimitReached = Boolean(freeChatStatus?.hasUsedToday);

  const handleNotifyExpert = async (expertId, expertName, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      showToast("Please login first to notify this expert", "info");
      navigate('/login');
      return;
    }
    try {
      setNotifiedExpertIds(prev => new Set([...prev, expertId]));
      await axios.post(getApiUrl(`/public/experts/${expertId}/notify-connect`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`सूचना भेज दी गई! ${expertName || 'एक्सपर्ट'} को कनेक्ट रिक्वेस्ट भेज दी गई है।`, 'success');
    } catch (err) {
      console.error('Failed to notify expert', err);
      showToast('अनुरोध भेज दिया गया है।', 'success');
    }
  };

  const openCallModal = async (expert, type) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast("Please login first", 'info');
      navigate('/login');
      return;
    }

    if (expert.onlineStatus !== 'online') {
      showToast(`${expert.name || 'Expert'} is currently offline. Please send a connect notification.`, 'info');
      return;
    }

    setSelectedExpert(expert);
    setCallType(type);
    
    const curBal = await fetchUserWallet();
    const rate = type === 'video' 
      ? Math.max(20, expert.rates?.video || expert.pricePerMinute || 20)
      : type === 'audio' 
      ? Math.max(10, expert.rates?.audio || expert.pricePerMinute || 10)
      : Math.max(5, expert.rates?.chat || expert.pricePerMinute || 5);

    // If audio and user has free consultation eligibility for this expert today, allow starting without balance!
    const isFreeCallEligible = type === 'audio' && isExpertFreeEligible(expert._id);

    // Require at least 1 minute rate to start (only for paid sessions)
    if (!isFreeCallEligible && curBal < rate) {
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
    if (!selectedExpert) return 20;
    if (callType === 'video') return Math.max(20, selectedExpert.rates?.video || selectedExpert.pricePerMinute || 20);
    if (callType === 'audio') return Math.max(10, selectedExpert.rates?.audio || selectedExpert.pricePerMinute || 10);
    if (callType === 'chat') return Math.max(5, selectedExpert.rates?.chat || selectedExpert.pricePerMinute || 5);
    return 20;
  };

  const executeSessionBookingAndPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const isFreeCall = callType === 'audio' && isExpertFreeEligible(selectedExpert._id);

      // 1. Create booking (Free if eligible, or Pay-As-You-Go with NO upfront deduction)
      const bookingRes = await axios.post(
        getApiUrl('/bookings'),
        {
          expertId: selectedExpert._id,
          date: new Date().toISOString(),
          type: callType === 'audio' ? 'Audio' : callType === 'chat' ? 'Chat' : 'Video',
          duration: 60,
          isInstant: true,
          isFree: isFreeCall
        },
        { headers }
      );

      if (isFreeCall) {
        setFreeChatStatus(prev => ({
          ...(prev || {}),
          usedExpertIds: [...(prev?.usedExpertIds || []), selectedExpert._id],
          hasUsedToday: true,
          hasUsedFreeChat: true
        }));
      }

      const consultationId = bookingRes.data._id;

      showToast(isFreeCall ? '🎁 Free Audio Call Connected! Connecting your session...' : 'Connecting session... Billed per-second from wallet.', 'success');
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
    axios.get(getApiUrl('/public/categories')).then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      axios.get(getApiUrl(`/public/categories/${selectedCategory}/subcategories`))
        .then(res => setSubCategories(res.data))
        .catch(() => setSubCategories([]));
    } else {
      setSubCategories([]);
      setSelectedSubCategory('');
    }
  }, [selectedCategory]);

  const fetchExperts = async (overrideSearch = null) => {
    setLoading(true);
    setError('');
    try {
      const activeSearch = overrideSearch !== null 
        ? overrideSearch 
        : (searchParam !== null && searchParam !== undefined ? searchParam : search);

      const params = { page, limit: 12 };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedSubCategory) params.subCategoryId = selectedSubCategory;
      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();
      if (userLocation?.lat && userLocation?.lng) {
        params.latitude = userLocation.lat;
        params.longitude = userLocation.lng;
      }

      const res = await axios.get(getApiUrl('/public/experts'), {
        params
      });
      const data = res.data?.data || res.data?.experts || [];
      setExperts(data);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total ?? data.length);
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

  useEffect(() => { 
    fetchExperts(searchParam); 
  }, [page, selectedCategory, selectedSubCategory, searchParam, userLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    navigate(`/experts?search=${encodeURIComponent(search.trim())}`);
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
      <div className="bg-surface border border-border-color rounded-xl p-3.5 sm:p-4 mb-4 shadow-sm">
        {/* Dynamic Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
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
            <div className="text-center py-12 sm:py-16">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-on-surface mb-1.5">No experts found</h3>
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
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {expert.subCategoryId && (
                            <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                              {expert.subCategoryId.name}
                            </span>
                          )}
                          {typeof expert.distanceKm === 'number' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 font-semibold px-2 py-0.5 rounded-full" title={`Distance from your location: ${expert.distanceKm} KM`}>
                              <MapPin size={10} className="text-emerald-600 shrink-0" />
                              <span>{Math.round(expert.distanceKm)} km</span>
                            </span>
                          )}
                          {expert.languages && expert.languages.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 font-medium px-2 py-0.5 rounded-full" title={expert.languages.join(', ')}>
                              <Globe size={10} className="text-amber-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{expert.languages.slice(0, 2).join(', ')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className={viewMode === 'list' ? 'flex-1 hidden sm:block px-4' : ''}>
                      {expert.experience && (
                        <p className="text-xs text-on-surface/60 mb-1">📅 {expert.experience} exp</p>
                      )}
                      {expert.languages && expert.languages.length > 0 && (
                        <p className="text-xs text-slate-600 mb-1 flex items-center gap-1.5 font-medium">
                          <Globe size={12} className="text-amber-500 shrink-0" />
                          <span>Languages: {expert.languages.join(', ')}</span>
                        </p>
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
                                ₹{Number(Math.max(5, expert.rates?.chat || expert.pricePerMinute || 5)).toFixed(2)}
                              </span>
                              <span className="text-xs text-on-surface/50">/min</span>
                            </div>
                          </div>
                        )}
                        {expert.onlineStatus === 'online' ? (
                          <div className={`flex items-center gap-2 ${viewMode === 'grid' ? 'w-full' : ''}`}>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'chat'); }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1 cursor-pointer active:scale-95 touch-manipulation"
                            >
                              Chat
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'audio'); }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1 transition-all flex-1 cursor-pointer active:scale-95 touch-manipulation"
                            >
                              Audio
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openCallModal(expert, 'video'); }}
                              className="bg-primary hover:bg-primary-light text-background text-xs font-bold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all flex-1 cursor-pointer active:scale-95 touch-manipulation"
                            >
                              Video
                            </button>
                          </div>
                        ) : (
                          <div className={viewMode === 'grid' ? 'w-full' : 'min-w-[180px]'}>
                            <button
                              type="button"
                              onClick={(e) => handleNotifyExpert(expert._id, expert.name, e)}
                              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 touch-manipulation border shadow-2xs ${
                                notifiedExpertIds.has(expert._id)
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                              title="एक्सपर्ट अभी ऑफलाइन है। कनेक्ट अनुरोध भेजें।"
                            >
                              <Bell size={13} className={notifiedExpertIds.has(expert._id) ? 'text-emerald-600' : 'text-amber-600 shrink-0'} />
                              <span>{notifiedExpertIds.has(expert._id) ? '✓ Request Sent' : 'Notify Expert / अनुरोध भेजें'}</span>
                            </button>
                          </div>
                        )}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md overflow-hidden border border-border-color">
            <div className="p-3 sm:p-4 border-b border-border-color flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                {callType === 'video' ? <Video size={18} className="text-primary"/> : callType === 'audio' ? <Phone size={18} className="text-emerald-500"/> : <MessageSquare size={18} className="text-blue-500" />}
                Instant {callType === 'video' ? 'Video' : callType === 'audio' ? 'Audio' : 'Chat'} with {selectedExpert.name}
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-on-surface/50 hover:text-on-surface/80 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
              {/* Pay as you go Rate Info or Free Chat Banner */}
              {isSelectedExpertFree ? (
                <div className="bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-xl p-2.5 sm:p-3 border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold inline-block mb-0.5">
                      🎁 1-Time Free Consultation
                    </span>
                    <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">₹0 <span className="text-xs sm:text-sm font-medium text-on-surface/70">/ Free Call</span></p>
                    <p className="text-[10px] sm:text-xs text-on-surface/70 mt-0.5">Admin limit: {freeDurationMinutes} min{freeDurationMinutes === 1 ? '' : 's'} • Zero wallet deduction</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/20">
                      100% Free
                    </span>
                  </div>
                </div>
              ) : (
                <>
                <div className="bg-primary/10 rounded-xl p-2.5 sm:p-3 border border-primary/20 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] sm:text-xs text-on-surface/70 uppercase tracking-wider font-semibold">Consultation Rate</p>
                    <p className="text-lg sm:text-xl font-black text-primary">₹{getPerMinuteRate()}<span className="text-xs sm:text-sm font-medium text-on-surface/70"> / min</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/20">
                      Per-Second Billing
                    </span>
                  </div>
                </div>
                {callType === 'audio' && (
                  isSelectedExpertClaimed ? (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      ℹ️ You have already used your 1-time free consultation with {selectedExpert?.name}. Regular per-minute rates apply.
                    </div>
                  ) : isDailyLimitReached ? (
                    <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      ℹ️ Daily free consultation limit reached (1/day). You can call {selectedExpert?.name} for free tomorrow, or continue now at regular rates.
                    </div>
                  ) : null
                )}
                </>
              )}
              
              {/* Wallet Status Info */}
              <div className="bg-surface-light border border-border-color rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-on-surface/60 font-medium">Your Wallet Balance</p>
                    <p className="text-xs sm:text-sm font-bold text-on-surface">₹{walletBalance.toFixed(2)}</p>
                  </div>
                </div>
                {(() => {
                  const rate = getPerMinuteRate();
                  const totalSecs = rate > 0 ? Math.floor((walletBalance / rate) * 60) : 0;
                  const m = Math.floor(totalSecs / 60);
                  const s = totalSecs % 60;
                  const formattedTime = m > 0 ? (s > 0 ? `~${m}m ${s}s` : `~${m} mins`) : `~${s}s`;
                  return (
                    <div className="text-right">
                      <p className="text-[10px] sm:text-xs text-on-surface/60">{isSelectedExpertFree ? 'Session cost' : 'Estimated talk time'}</p>
                      <p className="text-xs sm:text-sm font-bold text-emerald-600">{isSelectedExpertFree ? '₹0 (Free Session)' : formattedTime}</p>
                    </div>
                  );
                })()}
              </div>

              {/* No Upfront payment guarantee notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 sm:p-3 text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <span className="text-sm mt-0.5">💡</span>
                <div>
                  <p className="font-bold text-[11px] sm:text-xs">{isSelectedExpertFree ? 'यह सत्र 100% मुफ़्त है!' : 'पहले कोई एडवांस पैसा नहीं कटेगा!'}</p>
                  <p className="opacity-90 mt-0.5 text-[10px] sm:text-[11px] leading-tight">
                    {isSelectedExpertFree 
                      ? `एडमिन द्वारा निर्धारित ${freeDurationMinutes} मिनट तक आप बिना किसी शुल्क के ऑडियो कॉल कर सकते हैं। समय पूरा होते ही कॉल समाप्त हो जाएगी।`
                      : 'कॉल तुरंत शुरू होगी। जितनी देर बात होगी, सिर्फ़ उतने समय का पैसा बात खत्म होने पर वॉलेट से कटेगा।'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={executeSessionBookingAndPayment}
                disabled={processingPayment}
                className="w-full bg-primary text-background font-bold py-2.5 sm:py-3 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                {processingPayment ? (
                  'Connecting...'
                ) : isSelectedExpertFree ? (
                  <>
                    <Phone size={16} />
                    <span>Start Free Call ({freeDurationMinutes}m) / मुफ़्त कॉल शुरू करें (₹0)</span>
                  </>
                ) : (
                  <>
                    <Phone size={16} />
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
