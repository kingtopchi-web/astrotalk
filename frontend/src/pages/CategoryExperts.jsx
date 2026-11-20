import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { getApiUrl, fetchFreeChatConfig } from '../utils/apiConfig';
import { createSocket } from '../utils/socket';
import { getCachedUserLocation, requestUserLocation } from '../utils/userLocation';
import { safeNavigateBack } from '../utils/navigation';
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
  Grid,
  Bell,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';
import FreeCallShareModal from '../components/FreeCallShareModal';

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

const subCategoryFallbackImages = {
  // Medical Specializations
  'ortho': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
  'artho': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
  'bone': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',
  'joint': 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80',

  'neuro': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  'nuero': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  'brain': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',
  'spine': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=600&q=80',

  'cardio': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=600&q=80',
  'heart': 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=600&q=80',

  'dermat': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
  'skin': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',

  'dent': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',
  'teeth': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=600&q=80',

  'pediat': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  'child': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',

  'gynec': 'https://images.unsplash.com/photo-1594824813633-82088f1e63a1?auto=format&fit=crop&w=600&q=80',
  'women': 'https://images.unsplash.com/photo-1594824813633-82088f1e63a1?auto=format&fit=crop&w=600&q=80',

  'eye': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80',
  'ent': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',

  'general-physician': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
  'physician': 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
  'ayurveda': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
  'doctor': 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',

  // Legal
  'corporate-law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  'family-law': 'https://images.unsplash.com/photo-1453733190028-5615f7714d79?auto=format&fit=crop&w=600&q=80',
  'corporate': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
  'law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',

  // Career
  'resume-review': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
  'resume': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=600&q=80',
  'interview-prep': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  'interview': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',

  // Tech & IT
  'software-development': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  'software': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
  'data-science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
  'data': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',

  // Business & Finance
  'startup-funding': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
  'funding': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
  'taxation': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
  'tax': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',

  // Mental Wellness
  'therapy': 'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=600&q=80',
  'life-coaching': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
  'coaching': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
  'wellness': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',

  // Astrology
  'vedic': 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?auto=format&fit=crop&w=600&q=80',
  'kundli': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  'numerology': 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80'
};

const diverseDoctorFallbackImages = [
  'https://images.unsplash.com/photo-1594824813633-82088f1e63a1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
];

const getSubCatImage = (sub, parentCat) => {
  if (sub?.image) return sub.image;
  const s = (sub?.slug || '').toLowerCase();
  const n = (sub?.name || '').toLowerCase();
  for (const [k, url] of Object.entries(subCategoryFallbackImages)) {
    if (s.includes(k) || n.includes(k)) return url;
  }
  // Deterministic variety for arbitrary subcategories under doctor or generic
  const idStr = String(sub?._id || sub?.id || sub?.name || '1');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % diverseDoctorFallbackImages.length;
  return diverseDoctorFallbackImages[idx];
};

const getExpertScheduleText = (expert) => {
  if (typeof expert?.schedule === 'string' && expert.schedule.trim()) {
    return expert.schedule;
  }
  if (typeof expert?.workingHours === 'string' && expert.workingHours.trim()) {
    return expert.workingHours;
  }
  if (Array.isArray(expert?.availability) && expert.availability.length > 0) {
    const active = expert.availability.filter(a => a.isAvailable);
    if (active.length > 0) {
      const days = active.length === 7 ? 'Daily' : active.length >= 5 ? 'Mon - Sat' : active.map(a => a.day.slice(0, 3)).join(', ');
      const first = active[0];
      const start = first.startTime || '10:00 AM';
      const end = first.endTime || '07:00 PM';
      return `${days} • ${start} - ${end}`;
    }
  }
  return 'Mon - Sat • 10:00 AM - 07:00 PM';
};

export default function CategoryExperts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [notifiedExpertIds, setNotifiedExpertIds] = useState(new Set());
  const [notifyToast, setNotifyToast] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentExpert, setAppointmentExpert] = useState(null);
  const [appointmentInitialType, setAppointmentInitialType] = useState('call');
  const [userLocation, setUserLocation] = useState(getCachedUserLocation);

  // 1-Day Free Call Benefit
  const [freeChatStatus, setFreeChatStatus] = useState(null);
  const [freeDurationMinutes, setFreeDurationMinutes] = useState(1);
  const [showFreeCallShareModal, setShowFreeCallShareModal] = useState(false);
  const [pendingFreeCallExpert, setPendingFreeCallExpert] = useState(null);
  const [startingCallId, setStartingCallId] = useState(null);

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

  const isFreeChatEnabled = freeChatStatus ? freeChatStatus.enableFreeChat !== false : true;
  const isExpertFreeEligible = (expertId) => {
    if (user && user._id && (user._id === expertId || user._id.toString() === expertId.toString())) return false;
    if (!isFreeChatEnabled) return false;
    // Check if user has used their daily 1-free call today
    const hasUsedToday = Boolean(freeChatStatus?.hasUsedToday);
    if (hasUsedToday) return false;
    // Check if user has used free call with this specific expert
    const usedList = freeChatStatus?.usedExpertIds || [];
    if (usedList.includes(expertId)) return false;
    return true;
  };

  const handleVoiceCallClick = async (expert) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (isExpertFreeEligible(expert._id)) {
      setPendingFreeCallExpert(expert);
      setShowFreeCallShareModal(true);
    } else {
      navigate(`/expert/${expert._id}?action=audio`);
    }
  };

  const proceedWithFreeCall = async (expertId) => {
    try {
      setStartingCallId(expertId);
      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl('/bookings/start-free-call'), {
        expertId,
        type: 'call'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state so UI reflects usage immediately
      setFreeChatStatus(prev => ({
        ...(prev || {}),
        usedExpertIds: [...(prev?.usedExpertIds || []), expertId],
        hasUsedToday: true,
        hasUsedFreeChat: true
      }));

      setShowFreeCallShareModal(false);
      const consultationId = res.data?.consultation?._id;
      if (consultationId) {
        navigate(`/live/${consultationId}?type=audio`);
      } else {
        navigate(`/expert/${expertId}?action=audio`);
      }
    } catch (err) {
      console.error('Error starting free call:', err);
      alert(err.response?.data?.message || 'Failed to start free audio call');
      setShowFreeCallShareModal(false);
    } finally {
      setStartingCallId(null);
    }
  };

  const openAppointmentModal = (expert, type = 'call') => {
    setAppointmentExpert(expert);
    setAppointmentInitialType(type);
    setShowAppointmentModal(true);
  };

  const handleNotifyExpert = async (expertId, expertName, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setNotifiedExpertIds(prev => new Set([...prev, expertId]));
      await axios.post(getApiUrl(`/public/experts/${expertId}/notify-connect`), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifyToast(`सूचना भेज दी गई! ${expertName || 'एक्सपर्ट'} को कनेक्ट रिक्वेस्ट नोटिफिकेशन भेज दिया गया है।`);
      setTimeout(() => setNotifyToast(''), 4500);
    } catch (err) {
      console.error('Failed to notify expert', err);
      setNotifyToast('अनुरोध भेज दिया गया है।');
      setTimeout(() => setNotifyToast(''), 3500);
    }
  };

  useEffect(() => {
    requestUserLocation((coords) => {
      setUserLocation(coords);
    });
  }, []);

  // Listen to real-time expert status changes
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
      console.warn('Socket connect failed on CategoryExperts', e);
    }
    return () => {
      if (socket) socket.disconnect();
    };
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
  const activeSubCategory = selectedSubCategoryByCat[activeCategoryId] !== undefined
    ? selectedSubCategoryByCat[activeCategoryId]
    : (id === 'all' ? 'all' : null);
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

      let userRole = user?.role;
      if (!userRole) {
        try {
          const u = JSON.parse(localStorage.getItem('user'));
          userRole = u?.role;
        } catch (e) {}
      }
      if (userRole && userRole !== 'USER' && userRole !== 'EXPERT') return;

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
  }, [user]);

  const handleToggleSave = async (expertId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let userRole = user?.role;
    if (!userRole) {
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        userRole = u?.role;
      } catch (e) {}
    }
    if (userRole && userRole !== 'USER' && userRole !== 'EXPERT') return;

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

  const handleGoBack = () => {
    if (activeSubCategory) {
      setActiveSubCategory(null);
      return;
    }
    safeNavigateBack(navigate, '/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background pb-20 md:pb-0 overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full pt-20 md:pt-24 pb-16">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6">
          
          {/* Top-Left Back Button (Breadcrumb text removed) */}
          <div className="flex items-center mb-4 sm:mb-6">
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white hover:text-primary dark:hover:text-amber-400 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 group relative z-20"
              title="Go Back"
              aria-label="Go Back"
            >
              <ArrowLeft size={18} className="text-slate-800 dark:text-white group-hover:text-primary dark:group-hover:text-amber-400" />
            </button>
          </div>

          {/* Header Title (Clean without bulky banner card) */}
          <div className="mb-6 pt-1 text-center">
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-on-background text-center tracking-tight">
              {currentCategory ? currentCategory.name : 'All Categories'}
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-on-surface-variant mt-2 text-center max-w-xl mx-auto">
              {activeSubCategory
                ? `Showing experts specialized in ${activeSubCategory === 'all' ? currentCategory?.name || 'this category' : activeSubCategoryObj?.name || 'this specialization'}`
                : (subCategories.length > 0 ? 'Select a specialization below to view experts' : 'Connect with verified experts for 1-on-1 personalized guidance.')
              }
            </p>
          </div>

          {/* Sub-Categories Grid (Visible when no subcategory is chosen yet) */}
          {(loadingSubCategories || subCategories.length > 0) && !activeSubCategory && (
            <div className="w-full mb-8 pt-1">
              <div className="flex items-center justify-center gap-2 mb-6 px-1">
                <span className="text-sm sm:text-base font-black px-4 py-1.5 rounded-full bg-primary/15 text-primary border-2 border-primary/30 shadow-xs">
                  {subCategories.length} specializations available
                </span>
              </div>

              {loadingSubCategories ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-5 gap-x-3.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col items-center justify-center gap-2 animate-pulse">
                      <div className="w-[130px] h-[130px] xs:w-[145px] xs:h-[145px] sm:w-[155px] sm:h-[155px] rounded-full bg-surface-muted" />
                      <div className="h-5 w-24 bg-surface-muted rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-3.5 sm:gap-x-5">
                  {/* Subcategories list */}
                  {subCategories.map((sub) => (
                    <button
                      key={sub._id}
                      type="button"
                      onClick={() => setActiveSubCategory(sub._id)}
                      className="flex flex-col items-center justify-center gap-2 p-1 group cursor-pointer active:scale-95 transition-all text-center"
                    >
                      <div className="w-[130px] h-[130px] xs:w-[145px] xs:h-[145px] sm:w-[155px] sm:h-[155px] rounded-full overflow-hidden shadow-xl border-3 sm:border-4 border-white ring-2 ring-white/30 group-hover:border-primary group-hover:ring-primary/50 group-hover:scale-105 transition-all duration-300 bg-slate-800">
                        <img
                          src={getSubCatImage(sub, currentCategory)}
                          alt={sub.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-base xs:text-lg sm:text-xl font-heading font-black text-center leading-snug line-clamp-2 max-w-[170px] text-slate-900 dark:text-white group-hover:text-primary transition-colors mt-2 tracking-tight">
                        {sub.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* When a sub-category IS selected, show active subcategory header with back button */}
          {activeSubCategory && subCategories.length > 0 && (
            <div className="flex items-center justify-between gap-3 mb-6 bg-surface-card p-3.5 sm:p-4 rounded-2xl border border-border shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 ring-1 ring-white/30">
                  <img
                    src={activeSubCategory === 'all' ? getCatImage(currentCategory) : getSubCatImage(activeSubCategoryObj, currentCategory)}
                    alt={activeSubCategoryObj?.name || 'All'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-heading font-black text-base sm:text-lg md:text-xl text-on-background">
                    {activeSubCategory === 'all' ? `All ${currentCategory?.name || ''}` : activeSubCategoryObj?.name} Experts
                  </h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
                    {filteredExperts.length} {filteredExperts.length === 1 ? 'expert' : 'experts'} available
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubCategory(null)}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>Sub-Categories</span>
              </button>
            </div>
          )}

          {/* Experts and Toolbar Section (Visible ONLY when sub-category is selected or if no subcategories exist) */}
          {(activeSubCategory !== null || (!loadingSubCategories && subCategories.length === 0) || activeCategoryId === 'all') && (
            <>

          {/* Dynamic Search Toolbar (Search Only) */}
          <div className="bg-surface-card rounded-2xl border border-border p-3 sm:p-4 mb-6 shadow-xs">
            <div className="relative w-full">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${currentCategory ? currentCategory.name : 'experts'} by name, specialty...`}
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-surface-muted border border-border rounded-xl text-xs sm:text-sm text-on-background placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-background cursor-pointer p-1 rounded-lg hover:bg-surface"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
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
                    {/* Top Bar: Heart on left, Status Badge on right */}
                    <div className="flex items-center justify-between px-3.5 pt-3 pb-1 w-full">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(expert._id, e)}
                        aria-label="Save expert"
                        title={savedExpertIds.has(expert._id) ? "Remove from saved" : "Save expert"}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer shadow-xs ${
                          savedExpertIds.has(expert._id)
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500 border border-rose-300 dark:border-rose-800'
                            : 'bg-white/95 dark:bg-slate-800/95 text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50/80 dark:hover:bg-slate-700/80 hover:border-rose-200 hover:shadow-sm'
                        }`}
                      >
                        <Heart
                          size={15}
                          strokeWidth={2.2}
                          className={`transition-transform duration-200 hover:scale-115 active:scale-90 ${
                            savedExpertIds.has(expert._id) ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>

                      {/* Online/Offline Status Badge */}
                      <div className={`px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs border transition-all ${
                        isOnline 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isOnline 
                            ? 'bg-emerald-500 ring-2 ring-emerald-400/50 animate-pulse' 
                            : 'bg-rose-500 ring-2 ring-rose-400/40'
                        }`}></div>
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 pt-1 flex flex-col relative flex-1">
                      {/* Top Row: Avatar on Left, Info & Badges on Right */}
                      <div className="flex items-start gap-2.5 sm:gap-3 mb-2 w-full">
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <img
                            className="w-15 h-15 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white ring-2 ring-primary/80 shadow-md relative z-10"
                            alt={expert.name}
                            src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=FFD700&color=000&font-size=0.33&bold=true`}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=FFD700&color=000&font-size=0.33&bold=true`;
                            }}
                          />
                          {expert.isVerified && (
                            <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5 z-20 shadow-xs text-primary">
                              <ShieldCheck size={13} className="fill-primary text-background" />
                            </div>
                          )}
                        </div>

                        {/* Text Info & Badges on Right */}
                        <div className="flex-1 min-w-0 text-left">
                          {/* Row 1: Name */}
                          <h3 className="font-heading font-extrabold text-base sm:text-lg text-on-background group-hover:text-primary transition-colors truncate leading-tight">
                            {expert.name}
                          </h3>

                          {/* Row 2: Specialty on Left, Language Badge on Right (fills upper space) */}
                          <div className="flex items-center justify-between gap-1.5 mt-0.5 w-full">
                            <p className="font-body text-xs font-bold text-primary truncate min-w-0">
                              {expert.subCategoryId?.name || expert.category?.name || expert.specialty || 'Professional Consultant'}
                            </p>

                            {/* [ 🌐 Language ] complete text in upper space */}
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-border/70 shrink-0 ml-auto whitespace-nowrap"
                              title={Array.isArray(expert.languages) && expert.languages.length > 0 ? expert.languages.join(', ') : 'English, Hindi'}
                            >
                              <Globe size={9} className="text-amber-500 shrink-0" />
                              <span>
                                {Array.isArray(expert.languages) && expert.languages.length > 0 
                                  ? expert.languages.join(', ') 
                                  : 'English, Hindi'}
                              </span>
                            </span>
                          </div>

                          {/* Row 3: Rating & Experience on Left, Country on Right (fills space next to Exp.) */}
                          <div className="flex items-center justify-between gap-1.5 text-xs mt-1 w-full">
                            <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                              <div className="flex items-center gap-1 bg-warning/15 text-warning px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                <Star size={11} className="fill-warning text-warning" />
                                <span className="text-[11px] sm:text-xs">{expert.rating || '4.9'}</span>
                              </div>
                              <span className="text-on-surface-variant text-[10.5px] font-medium shrink-0">
                                ({expert.reviewsCount || 0})
                              </span>
                              <span className="text-on-surface-variant/40 shrink-0">•</span>
                              <span className="text-[11px] font-semibold text-on-surface-variant truncate">
                                {expert.experience ? `${expert.experience} Yrs Exp.` : 'Verified'}
                              </span>
                            </div>

                            {/* [ 📍 Country ] directly in space next to Exp. (below Language) */}
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              {expert.country && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-border/70 shrink-0">
                                  <MapPin size={9} className="text-primary shrink-0" />
                                  <span className="truncate max-w-[90px]">{expert.country}</span>
                                </span>
                              )}
                              {typeof expert.distanceKm === 'number' && (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200/60" title={`Distance: ${expert.distanceKm} KM`}>
                                  <MapPin size={9} className="text-emerald-600 shrink-0" />
                                  <span>{Math.round(expert.distanceKm)} km</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Consultation Rates */}
                      <div className="grid grid-cols-3 gap-1 w-full mb-2.5 py-1.5 px-1 bg-surface-muted rounded-xl border border-border/70 text-center">
                        <div className="flex flex-col items-center justify-center py-0.5">
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-0.5">
                            <MessageCircle size={10} className="text-primary shrink-0" /> Chat
                          </span>
                          <span className="text-xs font-bold text-on-background mt-0.5 flex items-baseline justify-center">
                            ₹{Math.max(5, expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 5))}
                            <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                          </span>
                        </div>
                        <div className={`flex flex-col items-center justify-center py-0.5 border-x border-border/60 relative ${isExpertFreeEligible(expert._id) ? 'bg-emerald-500/10 dark:bg-emerald-500/15 rounded-lg' : ''}`}>
                          <span className="text-[10px] text-on-surface-variant font-medium flex items-center justify-center gap-0.5">
                            <Phone size={10} className={isExpertFreeEligible(expert._id) ? "text-emerald-500 shrink-0 font-bold" : "text-success shrink-0"} /> Voice Call
                          </span>
                          {isExpertFreeEligible(expert._id) ? (
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <span className="text-[11px] line-through text-rose-500 dark:text-rose-400 font-black decoration-rose-600 dark:decoration-rose-400 decoration-2">
                                ₹{Math.max(10, expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10))}
                              </span>
                              <span className="text-xs font-black text-emerald-500 tracking-tight animate-pulse">
                                FREE
                              </span>
                              <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400">
                                ({freeDurationMinutes || 1}m)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-on-background mt-0.5 flex items-baseline justify-center">
                              ₹{Math.max(10, expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10))}
                              <span className="text-[9px] font-normal text-on-surface-variant ml-0.5">/m</span>
                            </span>
                          )}
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

                      {/* Offline Schedule Banner */}
                      {!isOnline && (
                        <div className="w-full mb-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock size={12} className="text-amber-500 shrink-0" />
                            <span className="truncate">Schedule: {getExpertScheduleText(expert)}</span>
                          </div>
                          <span className="text-[9.5px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                            Offline
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isOnline ? (
                        <div className="mt-auto w-full grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/expert/${expert._id}?action=chat`);
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-surface hover:bg-primary/10 border border-border text-on-background hover:text-primary hover:border-primary/50 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 touch-manipulation whitespace-nowrap"
                            title="Chat with Expert"
                          >
                            <MessageCircle size={13} className="text-primary shrink-0" />
                            <span>Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVoiceCallClick(expert);
                            }}
                            disabled={startingCallId === expert._id}
                            className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 touch-manipulation whitespace-nowrap ${
                              isExpertFreeEligible(expert._id)
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs animate-pulse ring-1 ring-emerald-400/50'
                                : 'bg-surface hover:bg-emerald-500/10 border border-border text-on-background hover:text-emerald-500 hover:border-emerald-500/50'
                            }`}
                            title={isExpertFreeEligible(expert._id) ? `Claim 1-Day Free Audio Call (${freeDurationMinutes || 1} min)` : "Voice Call with Expert"}
                          >
                            <Phone size={13} className={isExpertFreeEligible(expert._id) ? "text-white shrink-0" : "text-emerald-500 shrink-0"} />
                            <span>{startingCallId === expert._id ? 'Connecting...' : isExpertFreeEligible(expert._id) ? 'Free Call' : 'Call'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/expert/${expert._id}?action=video`);
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-primary hover:bg-primary/90 text-background rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 shadow-xs touch-manipulation whitespace-nowrap"
                            title="Video Call with Expert"
                          >
                            <Video size={13} className="shrink-0" />
                            <span>Video</span>
                          </button>
                        </div>
                      ) : (
                        <div className="mt-auto w-full grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/expert/${expert._id}?action=chat`);
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-surface hover:bg-primary/10 border border-border text-on-background hover:text-primary hover:border-primary/50 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 touch-manipulation whitespace-nowrap"
                            title="Chat with Expert"
                          >
                            <MessageCircle size={13} className="text-primary shrink-0" />
                            <span>Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAppointmentModal(expert, 'call');
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-xs transition-colors cursor-pointer active:scale-95 shadow-sm touch-manipulation whitespace-nowrap"
                            title="Schedule Call Appointment / अपॉइंटमेंट बुक करें"
                          >
                            <Calendar size={13} className="shrink-0" />
                            <span>Schedule</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAppointmentModal(expert, 'video');
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-surface hover:bg-amber-500/10 border border-amber-500/40 text-on-background hover:text-amber-600 rounded-xl font-bold text-xs transition-colors cursor-pointer active:scale-95 touch-manipulation whitespace-nowrap"
                            title="Schedule Video Call Appointment"
                          >
                            <Video size={13} className="text-amber-500 shrink-0" />
                            <span>Video</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

        </div>
      </main>

      {/* Connect Notification Toast */}
      {notifyToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-500/50 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <span>{notifyToast}</span>
        </div>
      )}

      {/* Book Appointment Modal (When Expert is Offline) */}
      <BookAppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setAppointmentExpert(null);
        }}
        expert={appointmentExpert}
        initialType={appointmentInitialType}
      />

      {/* Free Call Viral Share Modal */}
      <FreeCallShareModal
        isOpen={showFreeCallShareModal}
        onClose={() => setShowFreeCallShareModal(false)}
        onContinue={() => {
          if (pendingFreeCallExpert) {
            proceedWithFreeCall(pendingFreeCallExpert._id);
          }
        }}
        expertName={pendingFreeCallExpert?.name}
      />

      <Footer />
    </div>
  );
}
