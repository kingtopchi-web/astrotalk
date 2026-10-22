import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import { 
  BadgeCheck, 
  MapPin, 
  Clock, 
  Star, 
  Calendar as CalendarIcon, 
  MessageSquare,
  ChevronRight,
  Globe,
  Award,
  BookOpen,
  Briefcase,
  Video,
  Phone,
  X,
  Wallet
} from 'lucide-react';

function ExpertPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Services');

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [callMinutes, setCallMinutes] = useState(15);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const [showShortfallModal, setShowShortfallModal] = useState(false);
  const [shortfallData, setShortfallData] = useState(null);

  // Real backend reviews & ratings state
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    total: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchExpertReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await axios.get(`https://experthub.nextgoodtechnologies.in/api/reviews/expert/${id}`);
      if (res.data?.success) {
        setReviewsData({
          reviews: res.data.reviews || [],
          total: res.data.total || 0,
          averageRating: res.data.averageRating || 0,
          distribution: res.data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    } catch (e) {
      console.error('Failed to fetch reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const fetchUserWallet = async () => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      setLoadingWallet(true);
      const res = await axios.get('https://experthub.nextgoodtechnologies.in/api/wallet', {
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

  const openCallModal = async (type) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast("Please login first", "info");
      navigate('/login');
      return;
    }
    setCallType(type);
    
    const curBal = await fetchUserWallet();
    const rate = type === 'video' 
      ? (expert?.rates?.video || expert?.pricePerMinute || 50)
      : type === 'audio' 
      ? (expert?.rates?.audio || expert?.pricePerMinute || 30)
      : (expert?.rates?.chat || expert?.pricePerMinute || 20);

    // Require at least 1 minute rate to start
    if (curBal < rate) {
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
    if (!expert) return 30;
    if (callType === 'video') return expert.rates?.video || expert.pricePerMinute || 50;
    if (callType === 'audio') return expert.rates?.audio || expert.pricePerMinute || 30;
    if (callType === 'chat') return expert.rates?.chat || expert.pricePerMinute || 20;
    return 30;
  };

  const executeSessionBookingAndPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create Pay-As-You-Go booking (NO upfront wallet deduction!)
      const bookingRes = await axios.post(
        'https://experthub.nextgoodtechnologies.in/api/bookings',
        {
          expertId: id,
          date: new Date().toISOString(),
          type: callType === 'audio' ? 'Audio' : callType === 'chat' ? 'Chat' : 'Video',
          duration: 60,
          isInstant: true
        },
        { headers }
      );

      const consultationId = bookingRes.data._id;

      showToast('Connecting session... Billed per-second from wallet.', 'success');
      setShowCallModal(false);
      setShowShortfallModal(false);

      if (callType === 'chat') {
        axios.post(
          'https://experthub.nextgoodtechnologies.in/api/messages/conversations',
          { expertId: id },
          { headers }
        ).finally(() => {
          navigate('/messages');
        });
      } else {
        navigate(`/live/${consultationId}?type=${callType}`);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Connection failed';
      showToast(msg, 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCallPayment = async () => {
    try {
      setProcessingPayment(true);
      const token = localStorage.getItem('token');
      if(!token) {
        showToast("Please login first", "error");
        navigate('/login');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const totalCost = calculateCallPrice();

      // Check current wallet balance directly (already fetched when modal opened)
      const currentBal = walletBalance;

      // If wallet does not have enough balance, show shortfall modal instead of browser popup
      if (currentBal < totalCost) {
        setProcessingPayment(false);
        const shortfall = Math.ceil(totalCost - currentBal);
        setShortfallData({
          shortfall,
          neededAmount: totalCost,
          currentBalance: currentBal,
          headers,
          totalCost
        });
        setShowShortfallModal(true);
        return;
      }

      await executeSessionBookingAndPayment(headers, totalCost);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || 'Payment initiation failed', 'error');
      setProcessingPayment(false);
    }
  };

  const handleConfirmShortfallTopup = async () => {
    if (!shortfallData) return;
    try {
      setShowShortfallModal(false);
      setProcessingPayment(true);
      showToast(`Opening Razorpay to add ₹${shortfallData.shortfall} to wallet...`, 'info');
      await handleTopupShortfall(shortfallData.shortfall);
      showToast('Recharge successful! Deducting session fee...', 'success');
      await executeSessionBookingAndPayment(shortfallData.headers, shortfallData.totalCost);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Recharge failed', 'error');
      setProcessingPayment(false);
    }
  };


  useEffect(() => {
    const fetchExpertAndServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [expertRes, servicesRes] = await Promise.all([
          axios.get(`https://experthub.nextgoodtechnologies.in/api/user/experts/${id}`, { headers }),
          axios.get(`https://experthub.nextgoodtechnologies.in/api/expert-services/public/${id}`)
        ]);

        setExpert(expertRes.data);
        setServices(servicesRes.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('This expert could not be found.');
        } else {
          setError('Failed to load expert profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchExpertAndServices();
    fetchExpertReviews();

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action && ['video', 'audio', 'chat'].includes(action)) {
      setTimeout(() => {
        openCallModal(action);
      }, 350);
    }
  }, [id]);

  const handleConsultClick = (type) => {
    navigate(`/book/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !expert) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <div className="flex-1 flex items-center justify-center flex-col gap-6">
          <div className="text-6xl">😕</div>
          <p className="text-slate-600 font-medium text-lg">{error || 'Expert not found'}</p>
          <button onClick={() => navigate('/experts')} className="px-6 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors shadow-sm">
            Browse Experts
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryName = expert.categoryId?.name || 'General';
  const subCategoryName = expert.subCategoryId?.name || '';
  const price = expert.pricing || 500;

  // Dynamic rates per minute
  const chatRate = expert.rates?.chat > 0 ? expert.rates.chat : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10);
  const audioRate = expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 15);
  const videoRate = expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20);
  
  // Real or fallback tags
  const expertiseTags = expert.tags?.length > 0 ? expert.tags : [categoryName, subCategoryName, 'Consultation'].filter(Boolean);
  const reviewsCount = reviewsData.total || expert.reviewsCount || 0;
  const rating = reviewsData.total > 0 ? reviewsData.averageRating.toFixed(1) : (expert.rating > 0 ? expert.rating.toFixed(1) : '5.0');

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col font-sans pt-16 md:pt-20">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 md:py-8 pb-24 md:pb-8">
        
        {/* Mobile Back to Home Navigation Bar */}
        <div className="flex items-center justify-between mb-3.5 md:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-amber-600 hover:border-amber-400 font-bold text-xs shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </Link>
          <Link
            to="/experts"
            className="text-xs text-slate-500 hover:text-amber-600 font-semibold"
          >
            All Experts →
          </Link>
        </div>

        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center text-xs md:text-sm text-slate-500 mb-5 font-medium">
          <Link to="/" className="hover:text-amber-600 transition-colors">Home</Link>
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          <Link to="/experts" className="hover:text-amber-600 transition-colors">Experts</Link>
          <ChevronRight size={14} className="mx-2 text-slate-400" />
          <span className="text-slate-800 font-semibold">{expert.name}</span>
        </nav>

        {/* Top Profile Card */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 p-5 md:p-7 flex flex-col md:flex-row gap-6 md:gap-7 mb-8">
          
          {/* Left: Info */}
          <div className="flex-1 flex flex-col sm:flex-row gap-5 md:gap-6 items-center sm:items-start">
            <div className="relative shrink-0">
              <img
                src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=F59E0B&color=1e293b&bold=true&size=256`}
                alt={expert.name}
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl object-cover shadow-sm ring-4 ring-amber-100"
              />
              {expert.onlineStatus === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-emerald-500 shadow-sm" title="Online"></div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1.5">
                <BadgeCheck size={16} className="text-amber-500" />
                <span>Verified Expert</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">{expert.name}</h1>
              <p className="text-sm md:text-base text-slate-600 font-medium mb-3.5">{expert.specialty || expert.specialization || `${categoryName} Specialist`}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs text-slate-600 font-medium mb-4">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-900">{rating}</span>
                  <span className="text-slate-400">({reviewsCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <CalendarIcon size={16} className="text-slate-400" />
                  <span>{expert.experience || '5+ Years Experience'}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <MapPin size={16} className="text-slate-400" />
                  <span>{expert.location || 'New Delhi, India'}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-auto">
                {expertiseTags.map((tag, idx) => (
                  <span key={idx} className="bg-amber-50/80 text-amber-900 border border-amber-200/60 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking CTA */}
          <div className="w-full md:w-76 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-7 flex flex-col justify-center">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900">{services.length} <span className="text-xs font-medium text-slate-500">Active Services</span></p>
                {services.length > 0 && <p className="text-[11px] font-medium text-slate-400">Starting from ₹{Number(Math.min(...services.map(s => s.price))).toFixed(0)}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => {
                setActiveTab('Services');
                window.scrollTo({ top: 500, behavior: 'smooth' });
              }}
              className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-amber-400 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-between mb-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon size={15} className="text-amber-600" />
                <span>Book Service</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{services.length} active</span>
            </button>

            <button 
              onClick={() => openCallModal('video')}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-between mb-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Video size={15} />
                <span>Video Call Now</span>
              </div>
              <span className="text-[11px] font-bold bg-black/10 px-2 py-0.5 rounded-md">₹{videoRate}/min</span>
            </button>

            <button 
              onClick={() => openCallModal('audio')}
              className="w-full bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between mb-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-emerald-600" />
                <span>Audio Call Now</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">₹{audioRate}/min</span>
            </button>
            
            <button 
              onClick={() => openCallModal('chat')}
              className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-between mb-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-slate-600" />
                <span>Chat Now</span>
              </div>
              <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md">₹{chatRate}/min</span>
            </button>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-[11px] font-bold text-emerald-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Available today, 10:00 AM - 06:00 PM
            </div>
          </div>
        </div>

        {/* Bottom Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Tabs + Details) */}
          <div className="lg:col-span-2">
            
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
              {['Services', 'About', `Reviews (${reviewsCount})`, 'Availability', 'Sessions'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold whitespace-nowrap pb-3 border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-amber-500 text-amber-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'Services' && (
              <div className="space-y-4">
                {services.length === 0 ? (
                   <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                     <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                     <h3 className="text-lg font-bold text-slate-900 mb-2">No active services</h3>
                     <p className="text-slate-500">This expert has not listed any services yet.</p>
                   </div>
                ) : (
                  services.map(service => (
                    <div key={service._id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded text-xs font-bold">{service.consultationType}</span>
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-bold">{service.categoryId?.name}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                        <p className="text-slate-600 text-sm mb-4">{service.description}</p>
                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
                          <span className="flex items-center gap-1"><Clock size={16} className="text-slate-400"/> {service.duration} mins</span>
                          <span className="flex items-center gap-1"><BadgeCheck size={16} className="text-amber-500"/> {service.bookingType} Booking</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center md:border-l border-slate-100 md:pl-6 shrink-0">
                        <p className="text-2xl font-extrabold text-slate-900 mb-4">₹{Number(service.price).toFixed(2)}</p>
                        <button 
                          onClick={() => navigate(`/book/${id}?serviceId=${service._id}`)}
                          className="w-full md:w-auto bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold py-2.5 px-6 rounded-xl transition-all whitespace-nowrap shadow-sm"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'About' && (
              <div className="space-y-10 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                
                {/* Bio */}
                {expert.bio && (
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-4">About {expert.name}</h3>
                    <div className="text-slate-600 leading-relaxed space-y-4 text-sm font-medium whitespace-pre-line">
                      {expert.bio}
                    </div>
                  </div>
                )}

                {/* Expertise */}
                {(expertiseTags.length > 0 || expert.specialization) && (
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">Expertise & Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {expertiseTags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold">
                          {tag}
                        </span>
                      ))}
                      {expert.specialization && (
                        <span className="bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold">
                          {expert.specialization}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {expert.qualification && (
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-4">Education & Credentials</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Award size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{expert.qualification}</h4>
                          <p className="text-xs text-slate-500 font-medium">Verified Qualification</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab.startsWith('Reviews') && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                {/* Reviews Header & Distribution Summary */}
                <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-100">
                  <div className="text-center md:text-left">
                    <div className="text-5xl font-extrabold text-slate-900 mb-2">{rating}</div>
                    <div className="flex text-amber-400 gap-1 mb-1 justify-center md:justify-start">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={18} className={s <= Math.round(Number(rating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-slate-500">Based on {reviewsCount} verified reviews</p>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="flex-1 w-full space-y-2 text-xs font-bold text-slate-600">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewsData.distribution[stars] || 0;
                      const percent = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="w-8 flex items-center gap-0.5 text-slate-700">{stars} ★</span>
                          <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="w-10 text-right text-slate-400 font-medium">{count} ({percent}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">Client Feedback</h3>
                  {loadingReviews ? (
                    <div className="py-12 text-center text-slate-400 text-sm font-medium">Loading reviews...</div>
                  ) : reviewsData.reviews.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm font-medium">
                      No published reviews for this expert yet. Complete a consultation to be the first!
                    </div>
                  ) : (
                    reviewsData.reviews.map((rev) => (
                      <div key={rev._id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={rev.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.user?.name || 'Client')}&background=e2e8f0&color=475569`}
                              alt={rev.user?.name || 'Client'}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{rev.user?.name || 'Verified Client'}</h4>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex text-amber-400 gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                            ))}
                          </div>
                        </div>
                        {rev.feedback && (
                          <p className="text-sm text-slate-700 leading-relaxed font-normal pt-1">
                            "{rev.feedback}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab !== 'About' && activeTab !== 'Services' && !activeTab.startsWith('Reviews') && (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center py-20">
                <p className="text-slate-500 font-medium text-lg">No data available for {activeTab.toLowerCase()} yet.</p>
              </div>
            )}
            
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="space-y-6">
            
            {/* About Expert Widget */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">About the Expert</h3>
              <ul className="space-y-5">
                {expert.experience && (
                  <li className="flex gap-4">
                    <CalendarIcon size={20} className="text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-1">Experience</p>
                      <p className="text-sm font-bold text-slate-800">{expert.experience}</p>
                    </div>
                  </li>
                )}
                {(() => {
                  const langs = expert.languages && expert.languages.length > 0
                    ? Array.from(new Set([...expert.languages, 'Hindi']))
                    : ['English', 'Hindi'];
                  return (
                    <li className="flex gap-4">
                      <Globe size={20} className="text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Language</p>
                        <p className="text-sm font-bold text-slate-800">{langs.join(', ')}</p>
                      </div>
                    </li>
                  );
                })()}
                <li className="flex gap-4">
                  <MapPin size={20} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Location</p>
                    <p className="text-sm font-bold text-slate-800">{expert.location || 'Remote'}</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Ratings & Reviews Widget */}
            {(Number(rating) > 0 || reviewsCount > 0) && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Ratings & Reviews</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <div>
                    <div className="text-5xl font-extrabold text-slate-900 mb-2">{rating}</div>
                    <div className="flex text-amber-400 gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} className={s <= Math.round(Number(rating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-500">Based on {reviewsCount} reviews</p>
                  </div>
                  
                  <div className="flex-1 space-y-2 text-xs font-bold text-slate-500">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviewsData.distribution[stars] || 0;
                      const percent = reviewsCount > 0 ? Math.round((count / reviewsCount) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="w-5 text-slate-600">{stars} ★</span>
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
                          </div>
                          <span className="w-8 text-right text-slate-400">{percent}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                {callType === 'video' ? <Video size={20} className="text-amber-500"/> : callType === 'audio' ? <Phone size={20} className="text-emerald-500"/> : <MessageSquare size={20} className="text-amber-500"/>}
                Instant {callType === 'video' ? 'Video' : callType === 'audio' ? 'Audio' : 'Chat'} with {expert.name}
              </h3>
              <button onClick={() => setShowCallModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              {/* Pay as you go Rate Info */}
              <div className="bg-amber-50/70 rounded-xl p-4 mb-4 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Consultation Rate</p>
                  <p className="text-2xl font-black text-amber-950">₹{getPerMinuteRate()}<span className="text-sm font-medium text-slate-600"> / min</span></p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    Per-Second Billing
                  </span>
                </div>
              </div>
              
              {/* Wallet Status Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Your Wallet Balance</p>
                    <p className="text-base font-bold text-slate-800">₹{walletBalance.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Estimated talk time</p>
                  <p className="text-sm font-bold text-emerald-700">~{Math.max(1, Math.floor(walletBalance / (getPerMinuteRate() * 1.2)))} mins</p>
                </div>
              </div>

              {/* No Upfront payment guarantee notice */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 text-xs text-amber-800 flex items-start gap-2.5">
                <span className="text-base mt-0.5">💡</span>
                <div>
                  <p className="font-bold">पहले कोई एडवांस पैसा नहीं कटेगा!</p>
                  <p className="opacity-90 mt-0.5">कॉल तुरंत शुरू होगी। जितनी देर बात होगी, सिर्फ़ उतने समय का पैसा बात खत्म होने पर वॉलेट से कटेगा।</p>
                </div>
              </div>
              
              <button 
                onClick={executeSessionBookingAndPayment}
                disabled={processingPayment}
                className="w-full bg-amber-500 text-slate-950 font-extrabold py-3.5 rounded-xl hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-base"
              >
                {processingPayment ? (
                  'Connecting...'
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button 
              onClick={() => setShowShortfallModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              ✕
            </button>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Wallet size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Insufficient Wallet Balance</h3>
            <p className="text-xs text-amber-600 font-semibold mb-3">अपर्याप्त बैलेंस</p>
            <p className="text-sm text-slate-600 mb-4">
              इस विशेषज्ञ से बात शुरू करने के लिए आपके वॉलेट में कम से कम 1 मिनट का बैलेंस (<span className="font-bold text-slate-900">₹{shortfallData.neededAmount}</span>) होना आवश्यक है।
            </p>
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">वर्तमान वॉलेट बैलेंस:</span>
                <span className="font-bold text-slate-800">₹{shortfallData.currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">कम से कम जोड़ने योग्य राशि:</span>
                <span className="font-black text-amber-700 text-base">₹{shortfallData.shortfall}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShortfallModal(false)}
                className="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowShortfallModal(false);
                  navigate('/wallet');
                }}
                className="flex-1 py-3 px-4 bg-amber-500 text-slate-950 rounded-xl font-extrabold hover:bg-amber-600 transition-colors shadow-sm"
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

      <BottomNav />
      <Footer />
    </div>
  );
}

export default ExpertPublicProfile;
