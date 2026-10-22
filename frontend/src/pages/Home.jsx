import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Search, Star, ShieldCheck, ChevronRight, Video, Phone, MessageCircle, Heart, Clock, X } from 'lucide-react';
import { fetchFreeChatConfig, getApiUrl } from '../utils/apiConfig';

function Home() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [experts, setExperts] = useState([]);
  const [savedExpertIds, setSavedExpertIds] = useState(new Set());
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHeroImgIndex, setCurrentHeroImgIndex] = useState(0);
  const [platformStats, setPlatformStats] = useState({ usersCount: 0, verifiedExpertsCount: 0 });
  const [freeChatModalOpen, setFreeChatModalOpen] = useState(false);
  const [freeChatStatus, setFreeChatStatus] = useState(null);
  const [startingFreeChat, setStartingFreeChat] = useState(false);
  const [freeChatNotice, setFreeChatNotice] = useState(null);
  const navigate = useNavigate();

  // Load free chat settings on mount
  useEffect(() => {
    const loadInitialFreeChat = async () => {
      try {
        const config = await fetchFreeChatConfig();
        if (config) setFreeChatStatus(config);
      } catch (e) {}
    };
    loadInitialFreeChat();
  }, [user]);

  const handleStartFreeChatClick = async () => {
    if (!user) {
      navigate('/login?redirect=/');
      return;
    }
    if (user.role !== 'USER') {
      alert('Only client/user accounts can access free consultations.');
      return;
    }

    try {
      const config = await fetchFreeChatConfig();
      if (config) {
        setFreeChatStatus(config);
      }

      if (config && config.enableFreeChat === false) {
        setFreeChatNotice({
          type: 'disabled',
          title: 'Free Chat Unavailable',
          message: 'Free chat consultation is currently disabled by administrator.'
        });
        setFreeChatModalOpen(true);
        return;
      }

      if (config?.hasUsedFreeChat || user.hasUsedFreeChat) {
        setFreeChatNotice({
          type: 'already_used',
          title: 'Free Chat Already Used',
          message: 'You have already used your 1-time free consultation with an expert. Explore our verified experts to continue consultations.'
        });
        setFreeChatModalOpen(true);
        return;
      }

      setFreeChatNotice(null);
      setFreeChatModalOpen(true);
    } catch (err) {
      console.error(err);
      setFreeChatModalOpen(true);
    }
  };

  const handleSelectExpertForFreeChat = async (expertId) => {
    try {
      setStartingFreeChat(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl('/bookings/start-free-chat'), {
        expertId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (user) {
        user.hasUsedFreeChat = true;
        localStorage.setItem('user', JSON.stringify({ ...user, hasUsedFreeChat: true }));
      }

      setFreeChatModalOpen(false);
      navigate('/messages');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to start free chat session');
    } finally {
      setStartingFreeChat(false);
    }
  };

  const formatStat = (num) => {
    if (!num) return '0+';
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr+`;
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L+`;
    if (num >= 1000) return `${num.toLocaleString('en-IN')}+`;
    return `${num}+`;
  };

  const categoryFallbackImages = {
    astrologer: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=300&q=80',
    finance: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=300&q=80',
    career: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=300&q=80',
    doctors: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=300&q=80',
    legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=300&q=80',
    wellness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80',
    tech: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80'
  };

  const getCatImage = (cat) => {
    if (cat?.image) return cat.image;
    const s = (cat?.slug || '').toLowerCase();
    const n = (cat?.name || '').toLowerCase();
    if (categoryFallbackImages[s]) return categoryFallbackImages[s];
    for (const [k, url] of Object.entries(categoryFallbackImages)) {
      if (s.includes(k) || n.includes(k)) return url;
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80';
  };

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const res = await axios.get(getApiUrl('/public/stats'));
        if (res.data && res.data.success) {
          setPlatformStats({
            usersCount: res.data.usersCount || 0,
            verifiedExpertsCount: res.data.verifiedExpertsCount || 0
          });
          if (res.data.freeChatDurationMinutes) {
            setFreeChatStatus(prev => ({
              ...(prev || {}),
              freeChatDurationMinutes: res.data.freeChatDurationMinutes,
              enableFreeChat: res.data.enableFreeChat !== false
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch platform stats', err);
      }
    };
    fetchPlatformStats();
  }, []);

  const heroImages = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImgIndex((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      try {
        let url = getApiUrl('/public/experts?onlineStatus=online');
        if (activeCategory !== 'all') {
          url += `&categoryId=${activeCategory}`;
        }
        const res = await axios.get(url);
        if (res.data && res.data.data) {
          const onlineOnly = res.data.data.filter(exp => exp.onlineStatus === 'online');
          setExperts(onlineOnly);
        } else {
          setExperts([]);
        }
      } catch (err) {
        console.error('Failed to fetch experts', err);
        setExperts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [activeCategory]);

  useEffect(() => {
    const fetchSaved = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('https://experthub.nextgoodtechnologies.in/api/user/saved-experts', {
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
        `https://experthub.nextgoodtechnologies.in/api/user/saved-experts/${expertId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.savedExperts) {
        setSavedExpertIds(new Set(res.data.savedExperts.map(id => id.toString())));
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('https://experthub.nextgoodtechnologies.in/api/public/categories');
        if (res.data) setDbCategories(res.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0 overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-16 md:pt-20">

        {/* HERO SECTION - Carousel Concept */}
        <section className="relative overflow-hidden bg-background text-on-background pt-10 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-7xl mx-auto z-10">
            <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-muted rounded-[2rem] p-8 md:p-12 border border-border">
              {/* Left Content */}
              <div className="flex-1 space-y-6 text-center md:text-left">
                <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-on-background">
                  India's most accurate <br />
                  <span className="text-primary">
                    expert platform
                  </span>
                </h1>

                <div className="space-y-2 text-sm text-on-surface-variant font-medium pt-2">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-5 h-5 rounded-full bg-primary text-background flex items-center justify-center text-xs"><span className="material-symbols-outlined text-[14px]">check</span></div>
                    <span>Get Free initial consultation</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-5 h-5 rounded-full bg-primary text-background flex items-center justify-center text-xs"><span className="material-symbols-outlined text-[14px]">check</span></div>
                    <span>Average reply under 12 seconds</span>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleStartFreeChatClick}
                    className="px-8 py-3.5 bg-primary text-background rounded-full font-heading font-bold text-base hover:bg-primary-light transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 group cursor-pointer shadow-lg hover:shadow-primary/20 active:scale-95"
                  >
                    Start Free Chat <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>

                {/* Statistics */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 pt-10">
                  <div className="text-left">
                    <p className="text-2xl font-bold text-on-background">{formatStat(platformStats.usersCount)}</p>
                    <p className="text-xs text-on-surface-variant">Users guided</p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-on-background">{formatStat(platformStats.verifiedExpertsCount)}</p>
                    <p className="text-xs text-on-surface-variant">Verified experts</p>
                  </div>
                </div>
              </div>

              {/* Right Image area */}
              <div className="flex-1 relative w-full flex justify-center mt-8 md:mt-0">
                <div className="relative w-full max-w-[420px] h-[280px] flex items-center justify-center">
                  {heroImages.map((img, idx) => {
                    let positionClass = '';

                    if (idx === currentHeroImgIndex) {
                      positionClass = 'w-48 h-64 z-20 translate-x-0 border-4 border-primary shadow-2xl opacity-100 scale-100';
                    } else if (idx === (currentHeroImgIndex + 1) % heroImages.length) {
                      positionClass = 'w-32 h-48 z-10 translate-x-28 border-2 border-border shadow-xl opacity-70 scale-95';
                    } else {
                      positionClass = 'w-32 h-48 z-10 -translate-x-28 border-2 border-border shadow-xl opacity-70 scale-95';
                    }

                    return (
                      <div key={idx} className={`absolute rounded-[4rem] overflow-hidden transition-all duration-700 ease-in-out ${positionClass}`}>
                        <img src={img} alt={`Expert ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR EXPERTS SECTION (RECOMMENDED EXPERTS) */}
        {user?.role !== 'EXPERT' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-on-background">Recommended Experts</h2>
                <p className="text-sm text-on-surface-variant mt-1">Top-rated professionals ready to help you.</p>
              </div>
              <button onClick={() => navigate('/experts')} className="hidden md:flex px-5 py-2 bg-primary/20 text-primary rounded-full font-semibold text-sm hover:bg-primary hover:text-background transition-colors">
                See All Experts
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="bg-surface-muted rounded-3xl p-6 border border-border shadow-sm animate-pulse">
                    <div className="w-24 h-24 bg-surface-card rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-surface-card rounded w-2/3 mx-auto mb-2"></div>
                    <div className="h-3 bg-surface-card rounded w-1/2 mx-auto mb-6"></div>
                    <div className="h-10 bg-surface-card rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            ) : experts.length === 0 ? (
              <div className="bg-surface-muted border border-border shadow-sm rounded-3xl p-12 text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                <p>No experts available at the moment. Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {experts.slice(0, 4).map((expert) => (
                  <div key={expert._id} onClick={() => navigate(`/expert/${expert._id}`)} className="bg-surface-muted rounded-3xl border border-border shadow-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col overflow-hidden relative">

                    {/* Heart Save Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(expert._id, e)}
                      aria-label="Save expert"
                      title={savedExpertIds.has(expert._id) ? "Remove from saved" : "Save expert"}
                      className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 border ${
                        savedExpertIds.has(expert._id)
                          ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm'
                          : 'bg-background/90 backdrop-blur border-border text-on-surface/50 hover:text-rose-500 hover:bg-rose-50'
                      }`}
                    >
                      <Heart
                        size={16}
                        className={`transition-colors ${
                          savedExpertIds.has(expert._id) ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm z-10 border border-border">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span className="text-[10px] font-bold text-on-background uppercase tracking-wider">Online</span>
                    </div>

                    <div className="p-6 flex flex-col items-center text-center relative">
                      <div className="relative">
                        <img
                          className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-md relative z-10"
                          alt={expert.name}
                          src={expert.profileImage || `https://ui-avatars.com/api/?name=${expert.name}&background=FFD700&color=000&font-size=0.33&bold=true`}
                        />
                        {expert.isVerified && (
                          <div className="absolute bottom-1 right-1 bg-background rounded-full p-0.5 z-20 shadow-sm text-primary">
                            <ShieldCheck size={18} className="fill-primary text-background" />
                          </div>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-lg text-on-background mt-4 group-hover:text-primary transition-colors">
                        {expert.name}
                      </h3>

                      <p className="font-body text-xs font-medium text-primary mt-1 mb-1">
                        {expert.category?.name || expert.specialty || 'Professional Consultant'}
                      </p>

                      {expert.experience && (
                        <p className="text-[11px] text-on-surface-variant mb-3">{expert.experience} Years Exp.</p>
                      )}

                      <div className="flex items-center justify-center gap-2 text-xs mb-3 w-full">
                        <div className="flex items-center gap-1 bg-warning/10 text-warning px-2.5 py-1 rounded-lg">
                          <Star size={12} className="fill-warning text-warning" />
                          <span className="font-bold">{expert.rating || '4.9'}</span>
                        </div>
                        <span className="text-on-surface-variant text-[11px]">
                          ({expert.reviewsCount || 0} reviews)
                        </span>
                      </div>

                      {/* Dynamic Consultation Rates */}
                      <div className="grid grid-cols-3 gap-1.5 w-full mb-5 py-2 px-1.5 bg-surface-card rounded-xl border border-border/70 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                            <MessageCircle size={10} className="text-primary" /> Chat
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10)}
                            <span className="text-[9px] font-normal text-on-surface-variant">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center border-x border-border/60">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                            <Phone size={10} className="text-success" /> Audio
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 15)}
                            <span className="text-[9px] font-normal text-on-surface-variant">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                            <Video size={10} className="text-warning" /> Video
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20)}
                            <span className="text-[9px] font-normal text-on-surface-variant">/m</span>
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
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-background border border-border text-on-background hover:border-primary hover:text-primary rounded-xl font-bold text-xs transition-colors"
                        >
                          <MessageCircle size={14} /> Chat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expert/${expert._id}?action=audio`);
                          }}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-success/20 text-success hover:bg-success hover:text-background rounded-xl font-bold text-xs transition-colors"
                        >
                          <Phone size={14} /> Call
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 text-center md:hidden">
              <button onClick={() => navigate('/experts')} className="px-6 py-2.5 bg-background border border-border text-on-background rounded-full font-semibold text-sm transition-colors w-full">
                View All Experts
              </button>
            </div>
          </section>
        )}

        {/* QUICK ACTION BLOCKS / EXPERT WORKSPACE */}
        {user?.role === 'EXPERT' ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
            <h2 className="font-heading font-bold text-xl md:text-2xl text-on-background mb-4">
              Expert Workspace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => navigate('/expert/consultations')} 
                className="bg-surface-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-amber-500 text-[26px] mb-3 block group-hover:scale-110 transition-transform">
                  inbox
                </span>
                <h3 className="font-heading font-bold text-on-background text-base">New Requests</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">View and respond to consultation requests.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/schedule')} 
                className="bg-surface-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-amber-500 text-[26px] mb-3 block group-hover:scale-110 transition-transform">
                  calendar_month
                </span>
                <h3 className="font-heading font-bold text-on-background text-base">My Schedule</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Manage upcoming sessions.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/messages')} 
                className="bg-surface-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-amber-500 text-[26px] mb-3 block group-hover:scale-110 transition-transform">
                  forum
                </span>
                <h3 className="font-heading font-bold text-on-background text-base">Messages & Calls</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Open active chats and calls.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/earnings')} 
                className="bg-surface-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
              >
                <span className="material-symbols-outlined text-amber-500 text-[26px] mb-3 block group-hover:scale-110 transition-transform">
                  account_balance_wallet
                </span>
                <h3 className="font-heading font-bold text-on-background text-base">My Earnings</h3>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">View earnings and payout status.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              <div onClick={() => navigate('/experts?mode=chat')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Chat with Expert</h3>
                  <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Instant text consultation</p>
                </div>
              </div>

              <div onClick={() => navigate('/experts?mode=audio')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Call Expert</h3>
                  <p className="text-xs text-on-surface-variant mt-1 hidden md:block">One-on-one voice call</p>
                </div>
              </div>

              <div onClick={() => navigate('/blog')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Daily Articles</h3>
                  <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Your personalized reading</p>
                </div>
              </div>

              <div onClick={() => navigate('/free-services')} className="bg-surface-muted rounded-2xl p-6 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-36">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-sm md:text-base">Get Free Report</h3>
                  <p className="text-xs text-on-surface-variant mt-1 hidden md:block">Detailed issue analysis</p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* OUR SERVICES */}
        {user?.role !== 'EXPERT' && (
          <section className="bg-background py-12 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-heading font-extrabold text-4xl text-on-background mb-8 flex gap-2">
                Our <span className="text-secondary-dark">Services</span>
              </h2>

              <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">

                <div onClick={() => navigate('/free-services')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                    <span className="material-symbols-outlined text-[20px]">assignment</span>
                  </div>
                  <h3 className="font-bold text-on-background">Free Audit</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">Detailed project audit in 60 sec</p>
                  <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/blog')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                    <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                  </div>
                  <h3 className="font-bold text-on-background">Daily Tips</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">For all 12 industries</p>
                  <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                    <span className="material-symbols-outlined text-[20px]">analytics</span>
                  </div>
                  <h3 className="font-bold text-on-background">Career Reading</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">3-card, job, career, finance</p>
                  <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                    <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  </div>
                  <h3 className="font-bold text-on-background">Book a Mentor</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">Live session, verified guides</p>
                  <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[200px] md:min-w-[240px] bg-surface-card rounded-2xl p-5 shadow-sm snap-start cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-3 border border-secondary/20">
                    <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
                  </div>
                  <h3 className="font-bold text-on-background">Legal Consult</h3>
                  <p className="text-xs text-on-surface-variant mt-1 mb-4">For startup, business, tax</p>
                  <div className="w-8 h-8 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* CATEGORY EXPLORATION / EXPERT QUICK ACTIONS */}
        {user?.role === 'EXPERT' ? (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/expert/dashboard')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  grid_view
                </span>
                <span className="text-sm font-semibold text-on-background">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/consultations')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  event_available
                </span>
                <span className="text-sm font-semibold text-on-background">Consultations</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/messages')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  forum
                </span>
                <span className="text-sm font-semibold text-on-background">Messages</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/earnings')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  account_balance_wallet
                </span>
                <span className="text-sm font-semibold text-on-background">Earnings</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/schedule')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  calendar_clock
                </span>
                <span className="text-sm font-semibold text-on-background">Availability</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/profile')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-6 px-4 flex flex-col items-center justify-center gap-2.5 transition-all group cursor-pointer shadow-sm text-center"
              >
                <span className="material-symbols-outlined text-[30px] text-primary group-hover:scale-110 transition-transform">
                  person
                </span>
                <span className="text-sm font-semibold text-on-background">My Profile</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
            <div className="bg-surface-card rounded-3xl shadow-soft border border-border p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading font-bold text-xl md:text-2xl text-on-background">Explore Categories</h2>
                <button 
                  onClick={() => navigate('/categories')}
                  className="text-primary font-semibold text-sm hover:text-primary-dark flex items-center gap-1 transition-colors cursor-pointer"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                <button 
                    onClick={() => setActiveCategory('all')}
                    className={`flex flex-col items-center min-w-[100px] shrink-0 gap-3 p-4 rounded-2xl border transition-all group snap-start cursor-pointer ${activeCategory === 'all' ? 'bg-primary-light/30 border-primary' : 'bg-surface-muted hover:bg-primary-light/50 border-transparent hover:border-primary/20'}`}
                  >
                    <div className={`w-14 h-14 rounded-full overflow-hidden shadow-sm border-2 transition-all ${activeCategory === 'all' ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-border group-hover:scale-110'}`}>
                      <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80" 
                        alt="All Categories" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight ${activeCategory === 'all' ? 'text-primary' : 'text-on-surface group-hover:text-primary-dark'}`}>All</span>
                </button>
                {dbCategories.map((cat) => (
                  <button 
                    key={cat._id} 
                    onClick={() => setActiveCategory(cat._id)}
                    className={`flex flex-col items-center min-w-[100px] shrink-0 gap-3 p-4 rounded-2xl border transition-all group snap-start cursor-pointer ${activeCategory === cat._id ? 'bg-primary-light/30 border-primary' : 'bg-surface-muted hover:bg-primary-light/50 border-transparent hover:border-primary/20'}`}
                  >
                    <div className={`w-14 h-14 rounded-full overflow-hidden shadow-sm border-2 transition-all ${activeCategory === cat._id ? 'border-primary ring-2 ring-primary/40 scale-110' : 'border-border group-hover:scale-110'}`}>
                      <img 
                        src={getCatImage(cat)} 
                        alt={cat.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-semibold text-center leading-tight ${activeCategory === cat._id ? 'text-primary' : 'text-on-surface group-hover:text-primary-dark'}`}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* HOW IT WORKS - Premium Cards */}
        <section className="bg-surface-muted py-20 border-y border-border mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-on-background mb-4">Simple, Fast, and Secure</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto mb-16 font-medium">Get the answers you need in three simple steps. Our platform ensures complete privacy and seamless connections.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-primary transition-all duration-300 mb-6 shadow-lg">
                  <Search size={32} className="text-primary" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">1. Choose an Expert</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Browse verified profiles, read user reviews, and find the perfect match for your specific needs.</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-secondary transition-all duration-300 mb-6 shadow-lg">
                  <ShieldCheck size={32} className="text-secondary" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">2. Recharge Securely</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Add balance to your wallet instantly using our encrypted and safe payment gateway.</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-accent transition-all duration-300 mb-6 shadow-lg">
                  <Video size={32} className="text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl text-on-background mb-2">3. Connect Live</h3>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed">Start your consultation immediately via high-quality video, audio, or instant chat.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Free Chat Modal */}
      {freeChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-surface dark:bg-[#18181b] border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setFreeChatModalOpen(false)}
              className="absolute top-5 right-5 text-on-surface/50 hover:text-on-surface p-1.5 rounded-full hover:bg-surface-variant transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {freeChatNotice ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl">
                  {freeChatNotice.type === 'already_used' ? '🎁' : 'ℹ️'}
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-on-surface">
                    {freeChatNotice.title}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-2 leading-relaxed px-4">
                    {freeChatNotice.message}
                  </p>
                </div>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setFreeChatModalOpen(false);
                      navigate('/experts');
                    }}
                    className="px-6 py-2.5 bg-primary text-background rounded-xl font-bold text-sm hover:bg-primary-light transition-all shadow-md cursor-pointer"
                  >
                    Browse Verified Experts
                  </button>
                  <button
                    onClick={() => setFreeChatModalOpen(false)}
                    className="px-5 py-2.5 bg-surface-variant text-on-surface rounded-xl font-semibold text-sm hover:bg-border transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">
                    🎁
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-bold text-on-surface">
                      Start 1-Time Free Chat
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Clock size={13} />
                      Time limit: {freeChatStatus?.freeChatDurationMinutes || 5} {(freeChatStatus?.freeChatDurationMinutes || 5) === 1 ? 'Minute' : 'Minutes'} • ₹0 Charged
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <p>
                    <strong>Special Welcome Benefit:</strong> You can chat with an expert for <strong>{freeChatStatus?.freeChatDurationMinutes || 5} {(freeChatStatus?.freeChatDurationMinutes || 5) === 1 ? 'minute' : 'minutes'}</strong> completely free. The session will automatically terminate once time expires.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                    Select an expert to begin:
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {experts.slice(0, 6).map((expert) => (
                      <div
                        key={expert._id}
                        className="flex items-center justify-between p-3 rounded-2xl border border-border bg-surface-variant/30 hover:bg-surface-variant transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F7C83C&color=fff`}
                            alt={expert.name}
                            className="w-11 h-11 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-on-surface leading-tight">
                              {expert.name}
                            </h4>
                            <p className="text-xs text-on-surface-variant">
                              {expert.specialty || expert.categoryId?.name || 'Verified Expert'}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                              <Star size={11} className="fill-amber-500" />
                              <span>{expert.rating ? expert.rating.toFixed(1) : '5.0'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={startingFreeChat}
                          onClick={() => handleSelectExpertForFreeChat(expert._id)}
                          className="px-4 py-2 bg-primary text-background rounded-xl font-bold text-xs hover:bg-primary-light transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>
                            {startingFreeChat 
                              ? 'Connecting...' 
                              : `Chat Free (${freeChatStatus?.freeChatDurationMinutes || 5}m)`}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={() => {
                      setFreeChatModalOpen(false);
                      navigate('/experts');
                    }}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    View all experts &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
