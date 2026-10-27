import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { Search, Star, ShieldCheck, ChevronRight, ChevronLeft, Video, Phone, MessageCircle, Heart, Clock, X } from 'lucide-react';
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
  const expertScrollRef = useRef(null);
  const categoryScrollRef = useRef(null);

  const scrollCategory = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const defaultTestimonials = [
    {
      _id: 'seed-1',
      rating: 5,
      feedback: "This app helped me to get a job in my dream company. I was stressed about not getting a career opportunity after my graduation. One prediction from an astrologer gave me a ray of hope and within a few months, I had a job offer in hand. Thank you so much AstroTalk for helping me out.",
      userName: "Amar Thakur",
      userLocation: "Pune · India",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-2',
      rating: 5,
      feedback: "Dr. Ananya's preventive care consultation was life-changing. She patiently listened to my health concerns and gave practical lifestyle changes that improved my energy levels within weeks.",
      userName: "Pooja Sharma",
      userLocation: "Bengaluru · India",
      userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-3',
      rating: 5,
      feedback: "Arjun Mehta helped us architect our entire cloud infrastructure. His technical depth and real-world experience saved our startup months of trial and error.",
      userName: "Vikram Malhotra",
      userLocation: "Delhi · India",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-4',
      rating: 5,
      feedback: "The legal consultation regarding our angel round term sheet was crisp and highly strategic. Adv. Rajesh spotted clauses that protected our founder equity.",
      userName: "Neha Bansal",
      userLocation: "Mumbai · India",
      userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-5',
      rating: 5,
      feedback: "Got instant response in under 12 seconds for my urgent consultation. The video call was crystal clear and the expert gave actionable advice on the spot.",
      userName: "Rahul Verma",
      userLocation: "Hyderabad · India",
      userAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-6',
      rating: 5,
      feedback: "Sneha Kapoor's pitch deck strategy transformed our investor presentation. We secured our pre-seed funding within 3 weeks of implementing her feedback.",
      userName: "Ankit Jain",
      userLocation: "Jaipur · India",
      userAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-7',
      rating: 5,
      feedback: "The cognitive behavioral session helped me manage work anxiety effectively. Truly grateful for the empathy and professional conduct.",
      userName: "Divya Nair",
      userLocation: "Kochi · India",
      userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-8',
      rating: 5,
      feedback: "Honest and transparent consultation. The expert didn't try to upsell anything, just gave honest valuation insights for our business.",
      userName: "Suresh Patel",
      userLocation: "Ahmedabad · India",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
    },
    {
      _id: 'seed-9',
      rating: 5,
      feedback: "Best consultation marketplace in India. Seamless recharge, instant connection, and verified experts who actually know their domains.",
      userName: "Meera Krishnan",
      userLocation: "Chennai · India",
      userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
    }
  ];

  const [testimonials, setTestimonials] = useState(defaultTestimonials);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [testimonialStats, setTestimonialStats] = useState({ averageRating: 4.7, totalReviews: 1900000 });

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get(getApiUrl('/public/testimonials'));
        if (res.data && res.data.success && res.data.testimonials?.length) {
          setTestimonials(res.data.testimonials);
          if (res.data.stats) setTestimonialStats(res.data.stats);
        }
      } catch (err) {
        // Fallback already in state
      }
    };
    fetchTestimonials();
  }, []);

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0));
  };

  const scrollExperts = (direction) => {
    if (expertScrollRef.current) {
      const scrollAmount = 300;
      expertScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0">
      <Header />

      <main className="flex-1 w-full pt-[72px]">

        {/* HERO SECTION - Carousel Concept */}
        <section className="relative overflow-hidden bg-background text-on-background pt-2 sm:pt-4 pb-0 sm:pb-1 px-3 sm:px-5 lg:px-6">
          <div className="relative max-w-screen-2xl mx-auto z-10">
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 pt-1 sm:pt-2 pb-2 sm:pb-3 px-1 sm:px-2">
              {/* Left Content */}
              <div className="flex-1 space-y-3.5 text-center md:text-left">
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] text-on-background">
                  India's most accurate <br />
                  <span className="text-primary">
                    expert platform
                  </span>
                </h1>

                <div className="space-y-1 text-xs sm:text-sm text-on-surface-variant font-medium pt-0.5">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-4 h-4 rounded-full bg-primary text-background flex items-center justify-center text-[11px] shrink-0"><span className="material-symbols-outlined text-[12px]">check</span></div>
                    <span>Get Free initial consultation</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <div className="w-4 h-4 rounded-full bg-primary text-background flex items-center justify-center text-[11px] shrink-0"><span className="material-symbols-outlined text-[12px]">check</span></div>
                    <span>Average reply under 12 seconds</span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-3">
                  <button 
                    onClick={handleStartFreeChatClick}
                    className="px-6 py-2.5 sm:px-7 sm:py-3 bg-primary text-background rounded-full font-heading font-bold text-sm sm:text-base hover:bg-primary-light transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 group cursor-pointer shadow-md hover:shadow-primary/20 active:scale-95"
                  >
                    Start Free Chat <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>

                {/* Statistics */}
                <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 lg:gap-8 pt-3 sm:pt-4">
                  <div className="text-left">
                    <p className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-on-background tracking-tight">
                      {formatStat(platformStats.usersCount)}
                    </p>
                    <p className="text-xs sm:text-[13px] text-on-surface-variant font-normal mt-1 whitespace-nowrap">
                      Users guided
                    </p>
                  </div>

                  <div className="h-8 sm:h-10 w-px bg-border/80 shrink-0"></div>

                  <div className="text-left">
                    <p className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-on-background tracking-tight">
                      {formatStat(platformStats.verifiedExpertsCount)}
                    </p>
                    <p className="text-xs sm:text-[13px] text-on-surface-variant font-normal mt-1 whitespace-nowrap">
                      Verified experts
                    </p>
                  </div>

                  <div className="h-8 sm:h-10 w-px bg-border/80 shrink-0"></div>

                  <div className="text-left">
                    <p className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-on-background tracking-tight">
                      13+
                    </p>
                    <p className="text-xs sm:text-[13px] text-on-surface-variant font-normal mt-1 whitespace-nowrap">
                      Languages
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Image area */}
              <div className="flex-1 relative w-full flex justify-center mt-3 md:mt-0">
                <div className="relative w-full max-w-[460px] lg:max-w-[540px] h-[240px] sm:h-[280px] md:h-[320px] flex items-center justify-center">
                  {heroImages.map((img, idx) => {
                    let positionClass = '';

                    if (idx === currentHeroImgIndex) {
                      positionClass = 'w-40 h-52 sm:w-48 sm:h-64 md:w-56 md:h-72 z-20 translate-x-0 border-3 sm:border-4 border-primary shadow-[0_12px_32px_rgba(247,200,60,0.3)] opacity-100 scale-100';
                    } else if (idx === (currentHeroImgIndex + 1) % heroImages.length) {
                      positionClass = 'w-32 h-44 sm:w-40 sm:h-52 md:w-44 md:h-60 z-10 translate-x-20 sm:translate-x-28 md:translate-x-32 border-2 border-primary/35 shadow-lg opacity-85 scale-95';
                    } else {
                      positionClass = 'w-32 h-44 sm:w-40 sm:h-52 md:w-44 md:h-60 z-10 -translate-x-20 sm:-translate-x-28 md:-translate-x-32 border-2 border-primary/35 shadow-lg opacity-85 scale-95';
                    }

                    return (
                      <div key={idx} className={`absolute rounded-[50%] overflow-hidden transition-all duration-700 ease-in-out ${positionClass}`}>
                        <img src={img} alt={`Expert ${idx}`} className="w-full h-full object-cover rounded-[50%]" />
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
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pt-1 sm:pt-2 pb-5 sm:pb-6">
            <div className="flex items-center justify-between mb-3.5 sm:mb-4">
              <div>
                <h2 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-on-background">Recommended Experts</h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">Top-rated professionals ready to help you.</p>
              </div>
              <div className="flex items-center gap-2">
                {experts.length > 2 && (
                  <div className="flex items-center gap-1.5 mr-1 sm:mr-2">
                    <button
                      type="button"
                      onClick={() => scrollExperts('left')}
                      className="w-8 h-8 rounded-full bg-surface-muted hover:bg-primary/20 text-on-surface border border-border flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Scroll left"
                      title="Scroll left"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollExperts('right')}
                      className="w-8 h-8 rounded-full bg-surface-muted hover:bg-primary/20 text-on-surface border border-border flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Scroll right"
                      title="Scroll right"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
                <button onClick={() => navigate('/experts')} className="hidden md:flex px-4 py-1.5 bg-primary/15 text-primary rounded-full font-semibold text-xs sm:text-sm hover:bg-primary hover:text-background transition-colors">
                  See All Experts
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-stretch gap-4 sm:gap-5 overflow-x-hidden pb-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="w-[260px] sm:w-[280px] shrink-0 bg-surface-muted rounded-2xl p-5 border border-border shadow-xs animate-pulse">
                    <div className="w-20 h-20 bg-surface-card rounded-full mx-auto mb-3"></div>
                    <div className="h-4 bg-surface-card rounded w-2/3 mx-auto mb-2"></div>
                    <div className="h-3 bg-surface-card rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-9 bg-surface-card rounded-xl w-full"></div>
                  </div>
                ))}
              </div>
            ) : experts.length === 0 ? (
              <div className="bg-surface-muted border border-border shadow-xs rounded-2xl p-8 sm:p-10 text-center text-on-surface-variant flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
                <p className="text-sm">No experts available at the moment. Please check back later.</p>
              </div>
            ) : (
              <div 
                ref={expertScrollRef}
                className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"
                style={{ scrollbarWidth: 'thin' }}
              >
                {experts.map((expert) => (
                  <div 
                    key={expert._id} 
                    onClick={() => navigate(`/expert/${expert._id}`)} 
                    className="w-[260px] sm:w-[280px] shrink-0 snap-start bg-surface-muted rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden relative"
                  >

                    {/* Heart Save Button */}
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
                      <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                      <span className="text-[9px] font-bold text-on-background uppercase tracking-wider">Online</span>
                    </div>

                    <div className="p-5 flex flex-col items-center text-center relative flex-1">
                      <div className="relative mt-1">
                        <img
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm relative z-10"
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

                      <h3 className="font-heading font-bold text-base text-on-background mt-3 group-hover:text-primary transition-colors truncate max-w-full">
                        {expert.name}
                      </h3>

                      <p className="font-body text-xs font-medium text-primary mt-0.5 mb-1 truncate max-w-full">
                        {expert.category?.name || expert.specialty || 'Professional Consultant'}
                      </p>

                      {expert.experience && (
                        <p className="text-[11px] text-on-surface-variant mb-2">{expert.experience} Years Exp.</p>
                      )}

                      <div className="flex items-center justify-center gap-1.5 text-xs mb-3 w-full">
                        <div className="flex items-center gap-1 bg-warning/10 text-warning px-2 py-0.5 rounded-md">
                          <Star size={11} className="fill-warning text-warning" />
                          <span className="font-bold text-xs">{expert.rating || '4.9'}</span>
                        </div>
                        <span className="text-on-surface-variant text-[11px]">
                          ({expert.reviewsCount || 0} reviews)
                        </span>
                      </div>

                      {/* Dynamic Consultation Rates */}
                      <div className="grid grid-cols-3 gap-1 w-full mb-4 py-1.5 px-1 bg-surface-card rounded-xl border border-border/70 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-on-surface-variant flex items-center gap-0.5">
                            <MessageCircle size={9} className="text-primary" /> Chat
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10)}
                            <span className="text-[8px] font-normal text-on-surface-variant">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center border-x border-border/60">
                          <span className="text-[9px] text-on-surface-variant flex items-center gap-0.5">
                            <Phone size={9} className="text-success" /> Audio
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 15)}
                            <span className="text-[8px] font-normal text-on-surface-variant">/m</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-on-surface-variant flex items-center gap-0.5">
                            <Video size={9} className="text-warning" /> Video
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5">
                            ₹{expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20)}
                            <span className="text-[8px] font-normal text-on-surface-variant">/m</span>
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
                          className="flex items-center justify-center gap-1 py-2 bg-background border border-border text-on-background hover:border-primary hover:text-primary rounded-xl font-bold text-xs transition-colors"
                        >
                          <MessageCircle size={13} /> Chat
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/expert/${expert._id}?action=audio`);
                          }}
                          className="flex items-center justify-center gap-1 py-2 bg-success/20 text-success hover:bg-success hover:text-background rounded-xl font-bold text-xs transition-colors"
                        >
                          <Phone size={13} /> Call
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 text-center md:hidden">
              <button onClick={() => navigate('/experts')} className="px-5 py-2 bg-background border border-border text-on-background rounded-full font-semibold text-xs sm:text-sm transition-colors w-full">
                View All Experts
              </button>
            </div>
          </section>
        )}

        {/* QUICK ACTION BLOCKS / EXPERT WORKSPACE */}
        {user?.role === 'EXPERT' ? (
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-6 relative z-20">
            <h2 className="font-heading font-bold text-lg sm:text-xl md:text-2xl text-on-background mb-3">
              Expert Workspace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div 
                onClick={() => navigate('/expert/consultations')} 
                className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <span className="material-symbols-outlined text-amber-500 text-[24px] mb-2 block group-hover:scale-110 transition-transform">
                  inbox
                </span>
                <h3 className="font-heading font-bold text-on-background text-sm sm:text-base">New Requests</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">View and respond to consultation requests.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/schedule')} 
                className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <span className="material-symbols-outlined text-amber-500 text-[24px] mb-2 block group-hover:scale-110 transition-transform">
                  calendar_month
                </span>
                <h3 className="font-heading font-bold text-on-background text-sm sm:text-base">My Schedule</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Manage upcoming sessions.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/messages')} 
                className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <span className="material-symbols-outlined text-amber-500 text-[24px] mb-2 block group-hover:scale-110 transition-transform">
                  forum
                </span>
                <h3 className="font-heading font-bold text-on-background text-sm sm:text-base">Messages & Calls</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Open active chats and calls.</p>
              </div>

              <div 
                onClick={() => navigate('/expert/earnings')} 
                className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border hover:border-primary/50 transition-all cursor-pointer group shadow-xs hover:shadow-sm"
              >
                <span className="material-symbols-outlined text-amber-500 text-[24px] mb-2 block group-hover:scale-110 transition-transform">
                  account_balance_wallet
                </span>
                <h3 className="font-heading font-bold text-on-background text-sm sm:text-base">My Earnings</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">View earnings and payout status.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pt-2 sm:pt-3 pb-1.5 sm:pb-2 relative z-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">

              <div onClick={() => navigate('/experts?mode=chat')} className="bg-surface-muted rounded-2xl p-3.5 sm:p-4 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-24 sm:h-28">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-xs sm:text-sm md:text-base leading-tight">Chat with Expert</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 hidden md:block">Instant text consultation</p>
                </div>
              </div>

              <div onClick={() => navigate('/experts?mode=audio')} className="bg-surface-muted rounded-2xl p-3.5 sm:p-4 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-24 sm:h-28">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-xs sm:text-sm md:text-base leading-tight">Call Expert</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 hidden md:block">One-on-one voice call</p>
                </div>
              </div>

              <div onClick={() => navigate('/blog')} className="bg-surface-muted rounded-2xl p-3.5 sm:p-4 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-24 sm:h-28">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-xs sm:text-sm md:text-base leading-tight">Daily Articles</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 hidden md:block">Your personalized reading</p>
                </div>
              </div>

              <div onClick={() => navigate('/free-services')} className="bg-surface-muted rounded-2xl p-3.5 sm:p-4 border border-border hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between h-24 sm:h-28">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-background text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>calculate</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-on-background text-xs sm:text-sm md:text-base leading-tight">Get Free Report</h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 hidden md:block">Detailed issue analysis</p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* OUR SERVICES */}
        {user?.role !== 'EXPERT' && (
          <section className="bg-background pt-1 sm:pt-2 pb-1.5 sm:pb-2">
            <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6">
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-on-background mb-3 sm:mb-4 flex items-center gap-2">
                Our <span className="text-secondary-dark">Services</span>
              </h2>

              <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3 sm:gap-3.5 pb-1.5 snap-x hide-scrollbar">

                <div onClick={() => navigate('/free-services')} className="min-w-[190px] sm:min-w-[210px] lg:min-w-0 w-full bg-surface-card rounded-2xl p-4 shadow-xs snap-start cursor-pointer hover:shadow-sm transition-all border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-2.5 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                    </div>
                    <h3 className="font-bold text-on-background text-sm">Free Audit</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">Detailed project audit in 60 sec</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/blog')} className="min-w-[190px] sm:min-w-[210px] lg:min-w-0 w-full bg-surface-card rounded-2xl p-4 shadow-xs snap-start cursor-pointer hover:shadow-sm transition-all border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-2.5 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    </div>
                    <h3 className="font-bold text-on-background text-sm">Daily Tips</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">For all 12 industries</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[190px] sm:min-w-[210px] lg:min-w-0 w-full bg-surface-card rounded-2xl p-4 shadow-xs snap-start cursor-pointer hover:shadow-sm transition-all border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-2.5 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">analytics</span>
                    </div>
                    <h3 className="font-bold text-on-background text-sm">Career Reading</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">3-card, job, career, finance</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[190px] sm:min-w-[210px] lg:min-w-0 w-full bg-surface-card rounded-2xl p-4 shadow-xs snap-start cursor-pointer hover:shadow-sm transition-all border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-2.5 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    </div>
                    <h3 className="font-bold text-on-background text-sm">Book a Mentor</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">Live session, verified guides</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>

                <div onClick={() => navigate('/experts')} className="min-w-[190px] sm:min-w-[210px] lg:min-w-0 w-full bg-surface-card rounded-2xl p-4 shadow-xs snap-start cursor-pointer hover:shadow-sm transition-all border border-border/50 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-secondary-light rounded-lg flex items-center justify-center text-secondary mb-2.5 border border-secondary/20">
                      <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                    </div>
                    <h3 className="font-bold text-on-background text-sm">Legal Consult</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 mb-3">For startup, business, tax</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary flex items-center justify-center ml-auto">
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* CATEGORY EXPLORATION / EXPERT QUICK ACTIONS */}
        {user?.role === 'EXPERT' ? (
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pt-1 sm:pt-2 pb-5 sm:pb-6 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => navigate('/expert/dashboard')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  grid_view
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/consultations')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  event_available
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">Consultations</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/messages')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  forum
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">Messages</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/earnings')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  account_balance_wallet
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">Earnings</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/schedule')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  calendar_clock
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">Availability</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/expert/profile')}
                className="bg-surface-card hover:bg-surface-muted border border-border hover:border-primary/50 rounded-2xl py-5 px-4 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer shadow-xs text-center"
              >
                <span className="material-symbols-outlined text-[26px] text-primary group-hover:scale-110 transition-transform">
                  person
                </span>
                <span className="text-xs sm:text-sm font-semibold text-on-background">My Profile</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 pt-1 sm:pt-2 pb-5 sm:pb-6 relative z-20">
            <div className="bg-surface-card rounded-2xl sm:rounded-3xl shadow-xs border border-border p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                  <h2 className="font-heading font-bold text-lg sm:text-xl md:text-2xl text-on-background">Explore Categories</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">Find experts specialized in your domain</p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Category Horizontal Scroll Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => scrollCategory('left')}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border bg-surface-muted hover:bg-surface text-on-surface hover:text-primary flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                      aria-label="Scroll categories left"
                      title="Previous categories"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollCategory('right')}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border bg-surface-muted hover:bg-surface text-on-surface hover:text-primary flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                      aria-label="Scroll categories right"
                      title="Next categories"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => navigate('/categories')}
                    className="text-primary font-semibold text-xs sm:text-sm hover:text-primary-dark flex items-center gap-0.5 transition-colors cursor-pointer ml-1"
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Scrollable Categories List */}
              <div 
                ref={categoryScrollRef}
                className="flex gap-3.5 sm:gap-4.5 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* 'All' category button */}
                <button 
                  onClick={() => setActiveCategory('all')}
                  className={`flex flex-col items-center min-w-[125px] sm:min-w-[145px] md:min-w-[155px] shrink-0 gap-3 p-3.5 sm:p-4.5 rounded-2xl border transition-all duration-200 group snap-start cursor-pointer ${
                    activeCategory === 'all' 
                      ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm' 
                      : 'bg-surface-muted hover:bg-surface border-border/70 hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full overflow-hidden shadow-sm border-2 transition-all duration-300 ${
                    activeCategory === 'all' 
                      ? 'border-primary ring-4 ring-primary/30 scale-105' 
                      : 'border-border/80 group-hover:border-primary/60 group-hover:scale-105'
                  }`}>
                    <img 
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80" 
                      alt="All Categories" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={`text-xs sm:text-sm font-bold text-center leading-snug transition-colors ${
                    activeCategory === 'all' ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                  }`}>
                    All
                  </span>
                </button>

                {/* Database Categories */}
                {dbCategories.map((cat) => {
                  const isActive = activeCategory === cat._id;
                  return (
                    <button 
                      key={cat._id} 
                      onClick={() => setActiveCategory(cat._id)}
                      className={`flex flex-col items-center min-w-[125px] sm:min-w-[145px] md:min-w-[155px] shrink-0 gap-3 p-3.5 sm:p-4.5 rounded-2xl border transition-all duration-200 group snap-start cursor-pointer ${
                        isActive 
                          ? 'bg-primary/10 border-primary ring-2 ring-primary/30 shadow-sm' 
                          : 'bg-surface-muted hover:bg-surface border-border/70 hover:border-primary/40 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-22 md:h-22 rounded-full overflow-hidden shadow-sm border-2 transition-all duration-300 ${
                        isActive 
                          ? 'border-primary ring-4 ring-primary/30 scale-105' 
                          : 'border-border/80 group-hover:border-primary/60 group-hover:scale-105'
                      }`}>
                        <img 
                          src={getCatImage(cat)} 
                          alt={cat.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className={`text-xs sm:text-sm font-bold text-center leading-snug line-clamp-2 max-w-[130px] transition-colors ${
                        isActive ? 'text-primary' : 'text-on-surface group-hover:text-primary'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS SECTION - Real people. Real reviews. */}
        <section className="bg-surface-muted py-10 sm:py-14 border-y border-border">
          <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Title, Rating & Pagination */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-4 text-left">
                <span className="text-secondary font-bold text-xs uppercase tracking-widest font-heading">
                  TESTIMONIALS
                </span>

                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-on-background leading-[1.12] tracking-tight">
                  Real people. <br />
                  <span className="text-secondary-dark">Real reviews.</span>
                </h2>

                <div className="flex items-center gap-3 pt-1">
                  <span className="font-heading font-extrabold text-4xl sm:text-5xl text-secondary-dark leading-none">
                    {testimonialStats.averageRating || '4.7'}
                  </span>
                  <div>
                    <div className="flex items-center gap-1 text-secondary">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className="fill-secondary text-secondary" />
                      ))}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      Based on {formatStat(testimonialStats.totalReviews || 1900000)} reviews
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md font-medium leading-relaxed pt-1">
                  Join millions of satisfied users who trust ExpertHub for accurate consultations and life guidance.
                </p>

                {/* Pagination Controls */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevTestimonial}
                    className="w-10 h-10 rounded-full border border-border bg-surface-card hover:bg-surface-muted text-on-surface flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                    aria-label="Previous review"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-heading font-bold text-xs sm:text-sm text-on-surface px-1">
                    {currentTestimonialIndex + 1} / {testimonials.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextTestimonial}
                    className="w-10 h-10 rounded-full border border-border bg-surface-card hover:bg-surface-muted text-on-surface flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                    aria-label="Next review"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Right Column: Review Card */}
              <div className="lg:col-span-7">
                {testimonials.length > 0 && (
                  <div className="bg-surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-border shadow-lg relative flex flex-col justify-between min-h-[300px] sm:min-h-[320px] transition-all duration-300">
                    <div>
                      {/* Top rating stars & quote glyph */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 text-secondary">
                          {[...Array(testimonials[currentTestimonialIndex]?.rating || 5)].map((_, i) => (
                            <Star key={i} size={18} className="fill-secondary text-secondary" />
                          ))}
                        </div>
                        <span className="text-5xl text-on-surface-variant/25 font-serif select-none leading-none -mt-2">“</span>
                      </div>

                      {/* Review text */}
                      <p className="font-body text-sm sm:text-base md:text-lg text-on-background/95 leading-relaxed font-normal">
                        "{testimonials[currentTestimonialIndex]?.feedback}"
                      </p>
                    </div>

                    {/* Divider and Author Profile */}
                    <div className="pt-6 mt-6 border-t border-border/60 flex items-center gap-3.5">
                      <img
                        src={testimonials[currentTestimonialIndex]?.userAvatar}
                        alt={testimonials[currentTestimonialIndex]?.userName}
                        className="w-12 h-12 rounded-full object-cover border border-border shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonials[currentTestimonialIndex]?.userName || 'User')}&background=F7C83C&color=000&bold=true`;
                        }}
                      />
                      <div>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-on-background">
                          {testimonials[currentTestimonialIndex]?.userName}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {testimonials[currentTestimonialIndex]?.userLocation || (testimonials[currentTestimonialIndex]?.expertConsulted ? `Consulted with ${testimonials[currentTestimonialIndex]?.expertConsulted}` : 'Verified Client')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* SEO & INFORMATIONAL EDITORIAL SECTION (Wakefit / Astrotalk Marketplace Style) */}
        <section className="border-t border-border bg-surface-card/30 dark:bg-surface-card/20 py-10 sm:py-14">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
            
            {/* Section 1: Intro */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                ExpertHub – Empowering Every Critical Decision in India
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                At ExpertHub, we believe that timely, verified guidance can fundamentally transform lives. From seeking clarity during career crossroads and emotional turbulence to consulting experienced advocates for high-stakes business decisions, everyday life presents challenges that require seasoned perspectives. ExpertHub bridges this gap by connecting seekers with India's top 1% verified experts across diverse domains including astrology, medicine, law, career coaching, mental wellness, and technology.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Step into a trusted ecosystem built on transparency, strict multi-step vetting, and instant digital connectivity. Whether you prefer an encrypted 1-on-1 <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">chat consultation</span>, an instant <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">audio call</span>, or an in-depth <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">video appointment</span>, ExpertHub brings India's finest minds directly to your screen—accessible 24/7 across 500+ Indian cities and global communities.
              </p>
            </div>

            {/* Section 2: Astrology & Vedic Wisdom */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                Online Astrology & Horoscope Consultations – Ancient Wisdom for Modern Life
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Astrology has been India’s guiding compass for millennia, illuminating path-defining choices in marriage, family, health, and finance. That is why ExpertHub brings together renowned <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Vedic astrologers</span>, intuitive <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Tarot card readers</span>, certified <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Numerologists</span>, and expert <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Vastu shastra consultants</span> on one unified digital platform.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Whether you are seeking detailed <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Kundli analysis</span>, authentic <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">Kundali matching (horoscope Milan)</span> for marriage, or personalized remedies for planetary phases like <span className="font-semibold text-primary">Shani Sade Sati</span>, <span className="font-semibold text-primary">Mangal Dosha</span>, and <span className="font-semibold text-primary">Kaal Sarp Dosha</span>, our consultants provide grounded, mathematical calculations rooted in traditional Parashari and KP astrology systems.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Our platform also features daily personalized horoscopes, birth chart interpretations, gemstone recommendations, and auspicious timing (Shubh Muhurat) guidance for weddings, housewarming ceremonies, and new business ventures.
              </p>
            </div>

            {/* Section 3: Healthcare & Mental Wellness */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                Certified Doctors & Mental Health Therapy – Trusted Wellness Anytime, Anywhere
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Reliable medical advice should never be delayed by distance or crowded clinics. ExpertHub offers 24/7 access to licensed <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">general physicians</span>, certified <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">clinical nutritionists & dietitians</span>, <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">dermatologists</span>, and experienced <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">ayurvedic doctors</span> for instant second opinions, symptom evaluations, and preventive lifestyle management.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Emotional and psychological health is equally central to your vitality. Our empathetic <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">mental health psychologists</span> and certified <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">mindfulness coaches</span> provide safe, strictly confidential spaces to navigate corporate burnout, anxiety, relationship distress, and personal grief. Receive tailored cognitive behavioral techniques and actionable mental coping routines right from the comfort and privacy of your home.
              </p>
            </div>

            {/* Section 4: Legal & Corporate Advisory */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                Legal Advisory & Corporate Counsel – Strategic Clarity for Peace of Mind
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Navigating complex regulatory environments and personal disputes requires experienced legal acumen. ExpertHub connects individuals, startups, and established enterprises with practicing <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">high court advocates</span>, seasoned <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">corporate lawyers</span>, and accredited <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">intellectual property attorneys</span> across India.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                From drafting and vetting <span className="font-semibold text-primary">founder agreements</span>, employment contracts, and trademark applications to resolving property title verifications, consumer disputes, and matrimonial legal inquiries, our advocates deliver transparent, actionable counsel that safeguards your rights, assets, and business longevity.
              </p>
            </div>

            {/* Section 5: Tech Mentorship & Career Coaching */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                Career Mentorship & Technology Guidance – Accelerate Your Professional Trajectory
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Navigating the evolving corporate landscape requires mentorship from those who have walked the path. Connect 1-on-1 with senior engineering managers, product leads, and executive career coaches hailing from unicorn startups and global tech giants.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Gain competitive advantages with rigorous <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">software architecture reviews</span>, hands-on <span onClick={() => navigate('/experts')} className="font-semibold text-primary hover:underline cursor-pointer">mock technical interviews</span>, resume teardowns, and strategic salary negotiation tactics. Whether transitioning into Artificial Intelligence, scaling engineering teams, or aiming for CXO positions, our mentors provide actionable, personalized roadmaps tailored to your ambitions.
              </p>
            </div>

            {/* Section 6: Why Millions Choose ExpertHub */}
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-on-background/95 tracking-tight">
                Why Millions Choose ExpertHub – Transparency, Privacy & 24/7 Accessibility
              </h3>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Trust is the cornerstone of every consultation. At ExpertHub, every expert undergoes an exhaustive 5-step background vetting process, including educational credentials validation, professional license verification, and rigorous interview checks before onboarding.
              </p>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:leading-7">
                Enjoy seamless micro-billing with transparent pay-per-minute rates, instant wallet top-ups through UPI, net banking, and debit/credit cards, and end-to-end encrypted communication that guarantees 100% data privacy. With experts fluent in over <span className="font-semibold text-primary">13+ Indian regional languages</span> including Hindi, English, Tamil, Telugu, Kannada, Bengali, and Marathi, ExpertHub delivers authentic expertise whenever and wherever you need it most.
              </p>
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
