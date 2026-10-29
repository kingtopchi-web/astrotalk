import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { usePlatformSettings } from '../context/PlatformSettingsContext';
import { Search, Star, ShieldCheck, ChevronRight, ChevronLeft, Video, Phone, MessageCircle, Heart, Clock, X } from 'lucide-react';
import { fetchFreeChatConfig, getApiUrl } from '../utils/apiConfig';

function Home() {
  const { user } = useAuth();
  const { platformName } = usePlatformSettings();
  const brandName = platformName || 'ExpertHub';
  const [selectedDomain, setSelectedDomain] = useState('astrology');

  const domainData = {
    astrology: {
      tag: '',
      title: 'Online Astrology & Horoscope Consultations',
      description: `Astrology has been India's guiding compass for millennia, illuminating path-defining choices in marriage, family, health, and finance. That is why ${brandName} brings together renowned Vedic astrologers, intuitive Tarot card readers, certified Numerologists, and expert Vastu shastra consultants on one trusted platform.`,
      items: [
        { icon: '🪐', title: 'Vedic Astrologers', subtitle: 'Kundali & Dasha' },
        { icon: '🎴', title: 'Tarot Readers', subtitle: 'Intuitive Clarity' },
        { icon: '🔢', title: 'Numerologists', subtitle: 'Name & Fate Numbers' },
        { icon: '🏛️', title: 'Vastu Shastra', subtitle: 'Space & Harmony' }
      ]
    },
    medicine: {
      tag: 'TRUSTED MEDICAL & WELLNESS CARE',
      title: 'Certified Doctors & Preventive Healthcare',
      description: `Reliable medical advice should never be delayed by distance or crowded clinics. ${brandName} offers 24/7 access to licensed general physicians, certified clinical nutritionists, dietitians, and experienced ayurvedic doctors for second opinions and preventive care.`,
      items: [
        { icon: '🩺', title: 'General Physicians', subtitle: 'Instant 2nd Opinion' },
        { icon: '🥗', title: 'Diet & Nutrition', subtitle: 'Tailored Meal Plans' },
        { icon: '🌿', title: 'Ayurvedic Doctors', subtitle: 'Holistic Healing' },
        { icon: '🔬', title: 'Specialist MDs', subtitle: 'Report Evaluations' }
      ]
    },
    legal: {
      tag: 'STRATEGIC LEGAL CLARITY & COUNSEL',
      title: 'Legal Advisory & Corporate Counsel',
      description: 'Navigating complex regulations requires experienced legal acumen. Connect with practicing high court advocates, seasoned corporate lawyers, and intellectual property attorneys for contracts, property title checks, and corporate advice.',
      items: [
        { icon: '⚖️', title: 'High Court Advocates', subtitle: 'Civil & Property Law' },
        { icon: '📜', title: 'Corporate Lawyers', subtitle: 'Contracts & Founder Equity' },
        { icon: '💡', title: 'IP & Trademark', subtitle: 'Brand Protection' },
        { icon: '🤝', title: 'Family Legal Counsel', subtitle: 'Confidential Guidance' }
      ]
    },
    career: {
      tag: 'EXECUTIVE CAREER ACCELERATION',
      title: 'Career Mentorship & Leadership Coaching',
      description: 'Accelerate your professional trajectory with 1-on-1 mentorship from senior directors, tech leads, and executive coaches hailing from unicorn startups and global tech giants for architecture reviews and mock interviews.',
      items: [
        { icon: '🎯', title: 'Executive Coaching', subtitle: 'Promotion & Leadership' },
        { icon: '💼', title: 'Resume & Interviews', subtitle: 'Mock Rounds & Pitching' },
        { icon: '📈', title: 'Salary Negotiation', subtitle: 'Strategic Benchmarking' },
        { icon: '🚀', title: 'Startup Mentors', subtitle: 'Fundraising Guidance' }
      ]
    },
    'mental-health': {
      tag: 'SAFE & CONFIDENTIAL SPACE',
      title: 'Mental Wellness & Empathetic Therapy',
      description: 'Navigate corporate burnout, anxiety, relationship distress, and personal grief. Connect with empathetic mental health psychologists and mindfulness coaches in a strictly confidential digital sanctuary.',
      items: [
        { icon: '🧠', title: 'CBT Therapists', subtitle: 'Anxiety & Stress' },
        { icon: '🧘', title: 'Mindfulness Coaches', subtitle: 'Work-Life Balance' },
        { icon: '❤️', title: 'Relationship Guides', subtitle: 'Family & Couples' },
        { icon: '🌿', title: 'Emotional Healing', subtitle: 'Personal Coping' }
      ]
    },
    tech: {
      tag: 'INDUSTRY TECH ARCHITECTURE',
      title: 'Software Architecture & AI Mentorship',
      description: 'Gain competitive advantages with rigorous software architecture teardowns, cloud scalability roadmaps, and AI engineering guidance from seasoned tech managers and principal engineers.',
      items: [
        { icon: '💻', title: 'System Architecture', subtitle: 'High-Scale Systems' },
        { icon: '🤖', title: 'AI & Data Science', subtitle: 'LLMs & ML Pipelines' },
        { icon: '☁️', title: 'Cloud & DevOps', subtitle: 'AWS, GCP & Kubernetes' },
        { icon: '🔐', title: 'Cybersecurity', subtitle: 'Vulnerability Vetting' }
      ]
    }
  };

  const currentDomainData = domainData[selectedDomain] || domainData.astrology;
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
      feedback: "This app helped me to get a job in my dream company. I was stressed about not getting a career opportunity after my graduation. One prediction from an expert gave me a ray of hope and within a few months, I had a job offer in hand. Thank you so much ExpertHub for helping me out.",
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

  const [testimonialTouchStart, setTestimonialTouchStart] = useState(null);
  const [testimonialTouchEnd, setTestimonialTouchEnd] = useState(null);

  const handleTouchStart = (e) => setTestimonialTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTestimonialTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!testimonialTouchStart || !testimonialTouchEnd) return;
    const distance = testimonialTouchStart - testimonialTouchEnd;
    if (distance > 45) handleNextTestimonial();
    if (distance < -45) handlePrevTestimonial();
    setTestimonialTouchStart(null);
    setTestimonialTouchEnd(null);
  };

  const [activeExpertIndex, setActiveExpertIndex] = useState(0);

  const handleExpertScroll = () => {
    if (expertScrollRef.current) {
      const container = expertScrollRef.current;
      const card = container.querySelector('.snap-center, .snap-start');
      const cardWidth = card ? card.offsetWidth : 300;
      const gap = 16;
      const newIndex = Math.round(container.scrollLeft / (cardWidth + gap));
      setActiveExpertIndex(Math.max(0, Math.min(newIndex, experts.length - 1)));
    }
  };

  const scrollExperts = (direction) => {
    if (expertScrollRef.current) {
      const container = expertScrollRef.current;
      const card = container.querySelector('.snap-center, .snap-start');
      const cardWidth = card ? card.offsetWidth : 300;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      container.scrollBy({
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
                {experts.length > 1 && (
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
                  <div key={n} className="w-[calc(100vw-2.5rem)] max-w-[360px] sm:w-[280px] shrink-0 bg-surface-muted rounded-2xl p-5 border border-border shadow-xs animate-pulse">
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
              <>
                <div 
                  ref={expertScrollRef}
                  onScroll={handleExpertScroll}
                  className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scroll-smooth snap-x snap-mandatory px-1 sm:px-0 hide-scrollbar"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {experts.map((expert) => (
                    <div 
                      key={expert._id} 
                      onClick={() => navigate(`/expert/${expert._id}`)} 
                      className="w-[calc(100vw-2.5rem)] max-w-[360px] sm:w-[280px] shrink-0 snap-center sm:snap-start bg-surface-muted rounded-2xl border border-border shadow-xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col overflow-hidden relative mx-auto sm:mx-0"
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

                        <h3 className="font-heading font-bold text-base text-on-background mt-3 group-hover:text-primary transition-colors truncate max-w-full text-center">
                          {expert.name}
                        </h3>

                        <p className="font-body text-xs font-semibold text-primary mt-0.5 truncate max-w-full text-center h-4.5 flex items-center justify-center">
                          {expert.category?.name || expert.specialty || 'Professional Consultant'}
                        </p>

                        <div className="h-4.5 flex items-center justify-center mt-1 mb-2">
                          {expert.experience ? (
                            <p className="text-[11px] font-medium text-on-surface-variant">
                              {expert.experience} Years Exp.
                            </p>
                          ) : (
                            <p className="text-[11px] font-medium text-on-surface-variant/70">
                              Verified Expert
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 text-xs mb-3.5 w-full">
                          <div className="flex items-center gap-1 bg-warning/15 text-warning px-2.5 py-0.5 rounded-full font-bold">
                            <Star size={11} className="fill-warning text-warning" />
                            <span className="text-xs">{expert.rating || '4.9'}</span>
                          </div>
                          <span className="text-on-surface-variant text-[11px] font-medium">
                            ({expert.reviewsCount || 0} reviews)
                          </span>
                        </div>

                        {/* Dynamic Consultation Rates */}
                        <div className="grid grid-cols-3 gap-1 w-full mb-4 py-2 px-1 bg-surface-card rounded-xl border border-border/70 text-center">
                          <div className="flex flex-col items-center justify-center py-0.5">
                            <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-1">
                              <MessageCircle size={10} className="text-primary shrink-0" /> Chat
                            </span>
                            <span className="text-xs font-bold text-on-background mt-1 flex items-baseline justify-center">
                              ₹{expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10)}
                              <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-0.5 border-x border-border/60">
                            <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-1">
                              <Phone size={10} className="text-success shrink-0" /> Audio
                            </span>
                            <span className="text-xs font-bold text-on-background mt-1 flex items-baseline justify-center">
                              ₹{expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 15)}
                              <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center py-0.5">
                            <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-1">
                              <Video size={10} className="text-warning shrink-0" /> Video
                            </span>
                            <span className="text-xs font-bold text-on-background mt-1 flex items-baseline justify-center">
                              ₹{expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20)}
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
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-background border border-border text-on-background hover:border-primary hover:text-primary rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                          >
                            <MessageCircle size={14} className="text-primary" /> Chat
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/expert/${expert._id}?action=audio`);
                            }}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-success/15 border border-success/30 text-success hover:bg-success hover:text-background rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95"
                          >
                            <Phone size={14} /> Call
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile Carousel Indicators */}
                {experts.length > 1 && (
                  <div className="flex sm:hidden items-center justify-between mt-2 px-1">
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      {activeExpertIndex + 1} of {experts.length} recommended experts
                    </span>
                    <div className="flex items-center gap-1.5">
                      {experts.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (expertScrollRef.current) {
                              const container = expertScrollRef.current;
                              const card = container.querySelector('.snap-center, .snap-start');
                              const cardWidth = card ? card.offsetWidth : 300;
                              container.scrollTo({
                                left: idx * (cardWidth + 16),
                                behavior: 'smooth'
                              });
                            }
                          }}
                          aria-label={`Go to expert ${idx + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            activeExpertIndex === idx ? 'w-5 bg-primary' : 'w-1.5 bg-border hover:bg-on-surface-variant/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-5 text-center md:hidden">
              <button onClick={() => navigate('/experts')} className="px-5 py-2.5 bg-background border border-border text-on-background rounded-full font-semibold text-xs sm:text-sm hover:border-primary transition-colors w-full shadow-xs">
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
        <section className="bg-surface-muted py-8 sm:py-12 md:py-14 border-y border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Title, Rating & Pagination */}
              <div className="lg:col-span-5 flex flex-col justify-center space-y-3.5 sm:space-y-4 text-left">
                <span className="text-secondary font-bold text-xs uppercase tracking-widest font-heading">
                  TESTIMONIALS
                </span>

                <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-on-background leading-[1.15] tracking-tight">
                  Real people. <br />
                  <span className="text-secondary">Real reviews.</span>
                </h2>

                <div className="flex items-center gap-3.5 pt-1">
                  <span className="font-heading font-extrabold text-5xl sm:text-6xl text-secondary leading-none">
                    {testimonialStats.averageRating || '4'}
                  </span>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isFilled = s <= Math.round(Number(testimonialStats.averageRating) || 4);
                        return (
                          <Star
                            key={s}
                            size={16}
                            className={isFilled ? 'fill-secondary text-secondary' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'}
                          />
                        );
                      })}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      Based on {formatStat(testimonialStats.totalReviews || 6)} reviews
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant max-w-md font-normal leading-relaxed pt-1">
                  Join millions of satisfied users who trust ExpertHub for accurate consultations and life guidance.
                </p>

                {/* Pagination Controls */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevTestimonial}
                    className="w-10 h-10 rounded-full border border-border bg-white dark:bg-surface-card hover:bg-surface-muted text-on-surface flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
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
                    className="w-10 h-10 rounded-full border border-border bg-white dark:bg-surface-card hover:bg-surface-muted text-on-surface flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                    aria-label="Next review"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Right Column: Review Card */}
              <div className="lg:col-span-7">
                {testimonials.length > 0 && (
                  <div 
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="bg-white dark:bg-surface-card rounded-3xl p-6 sm:p-8 md:p-10 border border-border/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative flex flex-col justify-between transition-all duration-300 w-full"
                  >
                    <div>
                      {/* Top rating stars & quote glyph */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-1 text-secondary">
                          {[...Array(testimonials[currentTestimonialIndex]?.rating || 5)].map((_, i) => (
                            <Star key={i} size={17} className="fill-secondary text-secondary" />
                          ))}
                        </div>
                        <span className="text-4xl sm:text-5xl text-slate-300/80 dark:text-slate-600 font-serif select-none leading-none -mt-2">“</span>
                      </div>

                      {/* Review text */}
                      <p className="font-body text-sm sm:text-base md:text-lg text-on-background/95 leading-relaxed font-medium">
                        "{testimonials[currentTestimonialIndex]?.feedback}"
                      </p>
                    </div>

                    {/* Divider and Author Profile */}
                    <div className="pt-5 mt-5 border-t border-border/70 flex items-center gap-3.5">
                      <img
                        src={testimonials[currentTestimonialIndex]?.userAvatar}
                        alt={testimonials[currentTestimonialIndex]?.userName}
                        className="w-12 h-12 rounded-full object-cover border border-border/80 shrink-0 shadow-xs"
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

        {/* SEO & INFORMATIONAL EDITORIAL SECTION (Responsive Cards Concept) */}
        <section className="border-t border-border bg-surface-muted/40 dark:bg-background py-8 sm:py-12 md:py-14">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
            
            {/* SECTION 1: HEADER & INSTANT MODES OF CONSULTATION */}
            <div className="space-y-4">
              {/* Title */}
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-on-background leading-tight tracking-tight">
                {brandName} – Empowering Every Critical Decision in India
              </h2>

              {/* Description */}
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                At <strong className="font-semibold text-on-background">{brandName}</strong>, we believe that timely, verified guidance can fundamentally transform lives. From seeking clarity during career crossroads and emotional turbulence to consulting experienced advocates for high-stakes business decisions, everyday life presents challenges that require seasoned perspectives. {brandName} bridges this gap by connecting seekers with India's top 1% verified experts across diverse domains.
              </p>

              {/* Vetted Expertise In */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-on-surface-variant/80">
                  VETTED EXPERTISE IN:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('astrology')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'astrology'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>🪐</span> Astrology
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('medicine')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'medicine'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>🩺</span> Medicine
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('legal')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'legal'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>⚖️</span> Law
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('career')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'career'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>🎯</span> Career
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('mental-health')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'mental-health'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>🧠</span> Mental Wellness
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDomain('tech')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      selectedDomain === 'tech'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-surface-card border-border text-on-background hover:border-amber-500'
                    }`}
                  >
                    <span>💻</span> Tech Mentorship
                  </button>
                </div>
              </div>

              {/* Modes of Consultation Subheader */}
              <div className="flex items-center justify-between pt-2">
                <h3 className="font-heading font-bold text-xs sm:text-sm uppercase tracking-wider text-on-surface-variant">
                  INSTANT MODES OF CONSULTATION
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Available 24/7
                </span>
              </div>

              {/* 3 Interactive Consultation Cards */}
              <div className="space-y-3">
                {/* 1-on-1 Chat */}
                <div
                  onClick={() => navigate('/experts?mode=chat')}
                  className="bg-white dark:bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border shadow-xs hover:border-primary/60 hover:shadow-sm transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageCircle size={20} className="fill-amber-500/20 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-bold text-sm sm:text-base text-on-background truncate">
                          1-on-1 Chat Consultation
                        </h4>
                        <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/60">
                          Encrypted
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                        Private messaging with instant document & chart sharing
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {/* Instant Audio Call */}
                <div
                  onClick={() => navigate('/experts?mode=audio')}
                  className="bg-white dark:bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border shadow-xs hover:border-primary/60 hover:shadow-sm transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Phone size={20} className="fill-orange-500/20 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-bold text-sm sm:text-base text-on-background truncate">
                          Instant Audio Call
                        </h4>
                        <span className="bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200/60">
                          Direct
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                        Quick confidential voice clarity within minutes
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {/* In-Depth Video Appointment */}
                <div
                  onClick={() => navigate('/experts?mode=video')}
                  className="bg-white dark:bg-surface-card rounded-2xl p-4 sm:p-4.5 border border-border shadow-xs hover:border-primary/60 hover:shadow-sm transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Video size={20} className="fill-amber-500/20 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading font-bold text-sm sm:text-base text-on-background truncate">
                          In-Depth Video Appointment
                        </h4>
                        <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200/60">
                          Face-to-Face
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                        Comprehensive deep dive for complex strategic decisions
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-on-surface-variant/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>

              {/* Bottom Trust Strip */}
              <div className="bg-white dark:bg-surface-card rounded-2xl p-3 border border-border shadow-xs flex items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-on-surface-variant text-center flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  500+ Indian Cities & Global
                </span>
                <span className="text-border">|</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary" />
                  Strict Multi-Step Vetted
                </span>
              </div>
            </div>

            {/* SECTION 2: CATEGORY SPOTLIGHT & CTA CARD */}
            <div className="space-y-4">
              {/* Featured Domain Card */}
              <div className="bg-white dark:bg-surface-card rounded-3xl p-6 sm:p-8 border border-border shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                {/* Category Pill Tag */}
                {currentDomainData.tag && (
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border border-orange-200/60 font-heading">
                    {currentDomainData.tag}
                  </span>
                )}

                {/* Heading */}
                <h3 className="font-heading font-extrabold text-xl sm:text-2xl md:text-3xl text-on-background leading-snug">
                  {currentDomainData.title}
                </h3>

                {/* Description */}
                <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {currentDomainData.description}
                </p>

                {/* 2x2 Subcategory Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  {currentDomainData.items.map((sub, i) => (
                    <div
                      key={i}
                      onClick={() => navigate('/experts')}
                      className="bg-surface-muted/60 dark:bg-background/50 hover:bg-surface-muted rounded-2xl p-3 border border-border/80 flex items-center gap-2.5 cursor-pointer transition-all group"
                    >
                      <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{sub.icon}</span>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-xs text-on-background truncate group-hover:text-primary transition-colors">
                          {sub.title}
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {sub.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Big Gradient Button */}
                <button
                  type="button"
                  onClick={() => navigate('/experts')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white font-heading font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-orange-500/25 active:scale-[0.99] transition-all cursor-pointer"
                >
                  Consult an Expert Now →
                </button>

                {/* Trust Note */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/80 font-medium pt-0.5">
                  <span className="material-symbols-outlined text-[15px] text-emerald-600">lock</span>
                  <span>100% Confidential & Secure Consultation</span>
                </div>
              </div>

              {/* 3-Column Stats Card */}
              <div className="bg-white dark:bg-surface-card rounded-2xl p-4 sm:p-5 border border-border shadow-xs grid grid-cols-3 divide-x divide-border text-center">
                <div>
                  <p className="font-heading font-extrabold text-base sm:text-xl text-on-background">100k+</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Consultations</p>
                </div>
                <div>
                  <p className="font-heading font-extrabold text-base sm:text-xl text-on-background flex items-center justify-center gap-1">
                    4.9 <Star size={13} className="fill-amber-500 text-amber-500 inline" />
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Avg. Rating</p>
                </div>
                <div>
                  <p className="font-heading font-extrabold text-base sm:text-xl text-on-background">Top 1%</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Vetted Minds</p>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer />

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
