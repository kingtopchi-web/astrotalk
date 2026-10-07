import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { ArrowLeft, ArrowRight, BadgeCheck, Star, Calendar as CalendarIcon, Clock, Video, Phone, MessageSquare, ShieldCheck, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function BookConsultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceId = queryParams.get('serviceId');
  const { token, user } = useAuth();
  
  const [expert, setExpert] = useState(null);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState('Video Call');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchExpertAndWallet = async () => {
      try {
        const promises = [];
        if (id) {
          promises.push(axios.get(`http://localhost:5000/api/experts/${id}`));
        }
        
        if (user && token) {
          promises.push(axios.get('http://localhost:5000/api/wallet', {
            headers: { Authorization: `Bearer ${token}` }
          }));
        }

        if (serviceId) {
          promises.push(axios.get(`http://localhost:5000/api/expert-services/public/${id}`));
        }

        const results = await Promise.all(promises);
        
        if (id && results[0]) {
          setExpert(results[0].data);
        }
        if (user && token && results[1]) {
          setWalletBalance(results[1].data.balance || 0);
        }
        if (serviceId && results[2]) {
          const services = results[2].data;
          const foundService = services.find(s => s._id === serviceId);
          if (foundService) {
            setService(foundService);
            // Pre-fill form from service details
            if (foundService.consultationType) {
              setConsultationType(
                foundService.consultationType === 'Video' ? 'Video Call' :
                foundService.consultationType === 'Audio' ? 'Audio Call' :
                foundService.consultationType === 'Chat' ? 'Chat' : 'Video Call'
              );
            }
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpertAndWallet();
  }, [id, user, token, serviceId]);

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', 
    '12:30 PM', '01:00 PM', '02:00 PM', 
    '02:30 PM', '03:00 PM', '03:30 PM', 
    '04:00 PM', '04:30 PM'
  ];

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select date and time');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: `/book/${id}` } });
      return;
    }

    setIsSubmitting(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const bookingData = {
        expertId: expert._id,
        serviceId: service?._id,
        date: selectedDate.toISOString(),
        time: selectedTime,
        type: consultationType.split(' ')[0], // Video, Audio, Chat
        duration: service ? service.duration : 45,
        notes
      };

      // 1. Create Consultation (Pending Status)
      const bookingResponse = await axios.post('http://localhost:5000/api/bookings', bookingData, config);
      const consultation = bookingResponse.data;

      const basePrice = service ? service.price : (expert.rates?.video || expert.pricePerMinute || 500);
      const platformFee = Math.round(basePrice * 0.02);
      const totalAmount = basePrice + platformFee;

      // 2. Full Wallet Payment
      if (useWallet && walletBalance >= totalAmount) {
        await axios.post('http://localhost:5000/api/wallet/pay-consultation', {
          consultationId: consultation._id
        }, config);
        
        navigate('/bookings');
        return; // Done!
      }

      // 3. Create Razorpay Order securely from backend (Full or Partial)
      const orderResponse = await axios.post('http://localhost:5000/api/payments/create-order', {
        consultationId: consultation._id,
        useWallet: useWallet,
        amount: totalAmount // send amount in case backend needs it for verification or custom service price
      }, config);

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // 4. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Stitch Expert Platform",
        description: `Consultation with ${expert.name}`,
        order_id: orderId,
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: "#2563EB" // blue-600
        },
        handler: async function (response) {
          try {
            // 5. Verify Payment on Backend
            await axios.post('http://localhost:5000/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }, config);
            
            navigate('/bookings');
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError);
            alert('Payment verification failed. If money was deducted, it will be refunded.');
          }
        }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection or disable adblockers.');
      }

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response){
        alert('Payment Failed! ' + response.error.description);
      });

      rzp.open();

    } catch (error) {
      console.error('Booking/Payment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to process booking.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
  };
  
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm h-full">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-base font-bold text-slate-900">
            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex items-center gap-2">
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-2">
          {weekdays.map(day => (
            <div key={day} className="text-xs font-semibold text-slate-400">{day}</div>
          ))}
          
          {blanks.map(blank => (
            <div key={`blank-${blank}`} className="w-10 h-10"></div>
          ))}
          
          {daysInMonth.map(day => {
            const isToday = day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear();
            const isSelected = selectedDate && day.getDate() === selectedDate.getDate() && day.getMonth() === selectedDate.getMonth() && day.getFullYear() === selectedDate.getFullYear();
            const isPast = day < new Date(today.setHours(0,0,0,0));
            
            return (
              <button
                key={day.toISOString()}
                disabled={isPast}
                onClick={() => setSelectedDate(day)}
                className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold mx-auto transition-all ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : isPast 
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
        
        {selectedDate && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarIcon size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Selected Date</p>
              <p className="text-sm font-bold text-slate-900">{formatDateForDisplay(selectedDate)}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col pt-20">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col pt-20">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Expert not found.</p>
        </div>
      </div>
    );
  }

  const categoryName = expert.categoryId?.name || expert.specialty || 'Expert';
  const basePrice = service ? service.price : (expert.rates?.video || expert.pricePerMinute || 500);
  const platformFee = Math.round(basePrice * 0.02);
  const totalAmount = basePrice + platformFee;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans pt-16 md:pt-20 pb-20">
      <Header />
      
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Link & Title */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back to Expert Profile
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
                {service ? `Book ${service.name}` : 'Book a Consultation'}
              </h1>
              <p className="text-slate-500 font-medium text-base">
                {service ? service.description : `Choose your preferred date, time and consultation type to connect with ${expert.name}.`}
              </p>
            </div>
            
            {/* Stepper */}
            <div className="flex items-center gap-4 text-sm font-bold shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">1</div>
                <div>
                  <p className="text-blue-600">Select Date & Time</p>
                  <p className="text-xs text-slate-400 font-medium">Choose your preferred slot</p>
                </div>
              </div>
              <div className="w-8 h-px bg-slate-200"></div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">2</div>
                <div>
                  <p className="text-slate-700">Consultation Details</p>
                  <p className="text-xs text-slate-400 font-medium">Add notes and requirements</p>
                </div>
              </div>
              <div className="w-8 h-px bg-slate-200"></div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">3</div>
                <div>
                  <p className="text-slate-700">Payment</p>
                  <p className="text-xs text-slate-400 font-medium">Complete your booking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column (Forms) */}
          <div className="w-full lg:flex-1 space-y-8">
            
            {/* Expert Info Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <img 
                  src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random`} 
                  alt={expert.name} 
                  className="w-24 h-24 rounded-2xl object-cover shadow-sm border border-slate-100"
                />
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-2 mb-1">
                    {expert.name}
                    <BadgeCheck size={20} className="text-blue-500" />
                  </h2>
                  <p className="text-slate-500 font-medium mb-3">{categoryName}</p>
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-semibold text-slate-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span className="text-slate-900">{expert.rating > 0 ? expert.rating.toFixed(1) : 'New'}</span>
                      <span className="text-slate-400 font-medium">({expert.reviewsCount || 0} reviews)</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div>{expert.experience || 'Experienced'}</div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Mental Health</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Anxiety</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Depression</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">Life Coaching</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right shrink-0 bg-slate-50 py-4 px-8 rounded-2xl border border-slate-100">
                <p className="text-3xl font-extrabold text-slate-900 mb-1">₹{basePrice}</p>
                <p className="text-xs font-semibold text-slate-500 mb-3">per session</p>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                  <ShieldCheck size={14} /> Verified Expert
                </div>
              </div>
            </div>

            {/* Step 1: Select Date & Time */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Select Date & Time</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Choose a date and available time slot for your consultation.</p>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Calendar */}
                <div className="w-full md:w-[320px] shrink-0">
                  {renderCalendar()}
                </div>
                
                {/* Time Slots */}
                <div className="flex-1 border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Available Time Slots</h4>
                      <p className="text-xs font-medium text-slate-500">All times are in your local timezone (IST)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border ${
                          selectedTime === slot 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Consultation Details */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Consultation Details</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">Select consultation type and add any specific notes (optional).</p>
              
              <div className="flex flex-col md:flex-row gap-8">
                {/* Type Selection */}
                <div className="w-full md:w-1/2 space-y-4">
                  <p className="text-sm font-bold text-slate-900 mb-3">Consultation Type</p>
                  
                  {[
                    { id: 'Video Call', icon: Video, desc: 'Face-to-face consultation via video call' },
                    { id: 'Audio Call', icon: Phone, desc: 'Talk with expert via voice call' },
                    { id: 'Chat', icon: MessageSquare, desc: 'Get expert advice via text chat' }
                  ].map((type) => (
                    <div 
                      key={type.id}
                      onClick={() => setConsultationType(type.id)}
                      className={`flex items-start p-4 rounded-2xl cursor-pointer transition-all border ${
                        consultationType === type.id 
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600' 
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-4 ${
                        consultationType === type.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <type.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold mb-1 ${consultationType === type.id ? 'text-blue-900' : 'text-slate-900'}`}>{type.id}</h4>
                        <p className={`text-xs font-medium leading-relaxed ${consultationType === type.id ? 'text-blue-700' : 'text-slate-500'}`}>{type.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-2 ${
                        consultationType === type.id ? 'border-blue-600' : 'border-slate-300'
                      }`}>
                        {consultationType === type.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Notes */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-slate-900">Additional Notes <span className="text-slate-400 font-medium">(Optional)</span></p>
                  </div>
                  <div className="relative flex-1 min-h-[200px]">
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="E.g. I want to discuss about anxiety issues..."
                      className="w-full h-full border border-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none text-sm font-medium text-slate-700 bg-slate-50/50 focus:bg-white"
                      maxLength={500}
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400">
                      {notes.length}/500
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Order Summary) */}
          <div className="w-full lg:w-[400px] shrink-0 sticky top-28">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
              </div>

              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <img 
                    src={expert.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=random`} 
                    alt={expert.name} 
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{expert.name}</h4>
                    <p className="text-xs font-medium text-slate-500">{categoryName}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <CalendarIcon size={16} /> Date
                  </div>
                  <div className="text-sm font-bold text-slate-900">{formatDateForDisplay(selectedDate) || 'Not selected'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <Clock size={16} /> Time
                  </div>
                  <div className="text-sm font-bold text-slate-900">{selectedTime || 'Not selected'}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                    {consultationType === 'Video Call' ? <Video size={16} /> : consultationType === 'Audio Call' ? <Phone size={16} /> : <MessageSquare size={16} />} 
                    Consultation Type
                  </div>
                  <div className="text-sm font-bold text-slate-900">{consultationType}</div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Price Breakdown</h4>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Session Fee</span>
                    <span className="text-sm font-bold text-slate-900">₹{basePrice}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-500">Platform Fee (2%)</span>
                    <span className="text-sm font-bold text-slate-900">₹{platformFee}</span>
                  </div>
                </div>

                {/* Wallet Balance Usage */}
                {walletBalance > 0 && (
                  <div className="flex items-start justify-between bg-white p-4 rounded-2xl border border-slate-200 mb-4 cursor-pointer" onClick={() => setUseWallet(!useWallet)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${useWallet ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                        {useWallet && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Use Wallet Balance</p>
                        <p className="text-xs font-medium text-slate-500">Available: ₹{walletBalance}</p>
                      </div>
                    </div>
                    {useWallet && (
                      <span className="text-sm font-bold text-emerald-600">
                        -₹{Math.min(walletBalance, totalAmount)}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                  <span className="text-base font-bold text-blue-900">To Pay</span>
                  <span className="text-xl font-extrabold text-blue-600">
                    ₹{useWallet ? Math.max(0, totalAmount - walletBalance) : totalAmount}
                  </span>
                </div>
                
                <div className="flex items-start gap-3 mb-6">
                  <ShieldCheck size={16} className="text-green-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    Your payment is secure and encrypted.<br/>
                    We never share your payment details.
                  </p>
                </div>

                <button 
                  onClick={handlePayment}
                  disabled={isSubmitting || !selectedTime}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mb-3"
                >
                  {isSubmitting ? 'Processing...' : (useWallet && walletBalance >= totalAmount) ? 'Pay with Wallet' : 'Continue to Payment'} 
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
                
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel Booking
                </button>
              </div>
              
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

// Need to import ArrowRight at the top since I used it.
// Wait, I can just use svg for it or import from lucide-react. Let me fix the import list in the top using sed/replace, or just use a generic icon.
export default BookConsultation;
