import React, { useState } from 'react';
import { Calendar, Clock, Phone, Video, MessageCircle, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

const QUICK_TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '01:00 PM',
  '03:00 PM',
  '04:30 PM',
  '06:00 PM',
  '07:30 PM',
  '09:00 PM'
];

function BookAppointmentModal({ isOpen, onClose, expert, initialType = 'call' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Convert initialType if passed as 'audio'
  const normalizedInitialType = (initialType === 'audio' || initialType === 'call') ? 'call' : initialType;
  const [sessionType, setSessionType] = useState(normalizedInitialType); // 'call' (Voice Call) | 'video' | 'chat'
  
  // Date State: default today's date formatted YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  
  // Time State: default '11:30 AM' or custom
  const [selectedTime, setSelectedTime] = useState('11:30 AM');
  const [customTime, setCustomTime] = useState('');
  
  const [duration, setDuration] = useState(15); // minutes
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !expert) return null;

  // Rate helpers
  const voiceRate = Math.max(10, expert.rates?.audio > 0 ? expert.rates.audio : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 10));
  const videoRate = Math.max(20, expert.rates?.video > 0 ? expert.rates.video : (expert.pricePerMinute > 0 ? expert.pricePerMinute : 20));
  const chatRate = Math.max(5, expert.rates?.chat > 0 ? expert.rates.chat : 5);

  const currentRate = sessionType === 'video' ? videoRate : sessionType === 'chat' ? chatRate : voiceRate;

  // Calculate tomorrow's string for quick tab
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const handleSlotSelect = (slot) => {
    setSelectedTime(slot);
    setCustomTime('');
  };

  const handleCustomTimeChange = (e) => {
    setCustomTime(e.target.value);
    setSelectedTime(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      alert('अपॉइंटमेंट बुक करने के लिए कृपया पहले लॉगिन करें (Please login first to book an appointment).');
      navigate('/login');
      return;
    }

    if (!selectedDate) {
      setError('कृपया अपॉइंटमेंट की तिथि चुनें (Please select appointment date).');
      return;
    }

    if (!selectedTime) {
      setError('कृपया अपॉइंटमेंट का समय चुनें (Please select appointment time slot).');
      return;
    }

    // Combine date and time
    let combinedDateTime = new Date(selectedDate);
    if (customTime) {
      const [hours, minutes] = customTime.split(':');
      combinedDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    } else if (selectedTime) {
      const parts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (parts) {
        let hrs = parseInt(parts[1], 10);
        const mins = parseInt(parts[2], 10);
        const ampm = parts[3].toUpperCase();
        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        combinedDateTime.setHours(hrs, mins, 0, 0);
      }
    }

    try {
      setLoading(true);
      const res = await axios.post(
        getApiUrl('/bookings'),
        {
          expertId: expert._id,
          type: sessionType, // 'call' (Voice Call) | 'video' | 'chat'
          date: combinedDateTime.toISOString(),
          duration: duration,
          notes: notes,
          isInstant: false,
          isScheduled: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccessData(res.data);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      const msg = err.response?.data?.message || 'अपॉइंटमेंट बुक करने में समस्या आई। कृपया पुनः प्रयास करें।';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Success View */}
        {successData ? (
          <div className="p-6 text-center space-y-4 my-auto overflow-y-auto">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            
            <h3 className="text-xl font-black text-on-background dark:text-white">
              अपॉइंटमेंट सफलतापूर्वक बुक हो गया! 🎉
            </h3>
            
            <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              <strong>{expert.name}</strong> को आपके अपॉइंटमेंट की सूचना <strong>ईमेल (Email)</strong> और <strong>मोबाइल SMS</strong> द्वारा भेज दी गई है।
            </p>

            <div className="bg-surface-muted/60 dark:bg-slate-800/80 rounded-2xl p-4 text-left border border-border dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center text-on-surface-variant dark:text-slate-300">
                <span>एक्सपर्ट:</span>
                <span className="font-bold text-on-background dark:text-white">{expert.name}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant dark:text-slate-300">
                <span>सत्र प्रारूप:</span>
                <span className="font-bold text-primary capitalize">
                  {sessionType === 'video' ? '📹 Video Call (वीडियो कॉल)' : sessionType === 'chat' ? '💬 Chat (चैट)' : '📞 Voice Call (वॉइस कॉल)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant dark:text-slate-300">
                <span>दिनांक व समय:</span>
                <span className="font-bold text-on-background dark:text-white">
                  {selectedDate} at {selectedTime}
                </span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant dark:text-slate-300">
                <span>पेमेंट:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">बात होने पर वॉलेट से कटेगा (Pay Later)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/bookings');
                }}
                className="flex-1 bg-primary text-slate-950 font-bold py-2.5 rounded-xl hover:bg-primary-light transition-colors text-xs sm:text-sm cursor-pointer shadow-sm"
              >
                View My Appointments / मेरी बुकिंग देखें
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-surface-muted dark:bg-slate-800 text-on-surface dark:text-slate-200 font-bold rounded-xl text-xs sm:text-sm hover:bg-surface-muted/80 transition-colors cursor-pointer"
              >
                Close / बंद करें
              </button>
            </div>
          </div>
        ) : (
          /* Normal Booking Form with Fixed Header, Scrollable Body, Fixed Footer */
          <>
            {/* 1. Fixed Header (Always visible at top) */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-border dark:border-slate-800 shrink-0 flex items-center justify-between bg-surface-card dark:bg-slate-900">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={expert.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                    alt={expert.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-primary/40 shadow-xs"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-slate-900 rounded-full" title="Offline" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-bold text-on-background dark:text-white truncate">
                      {expert.name}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Offline
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant dark:text-slate-400 truncate">
                    Book Appointment • {expert.specialty || expert.specialization || 'Consultant'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-background dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. Scrollable Body (Accommodates all fields smoothly) */}
            <div className="overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 space-y-3.5 flex-1 overscroll-contain">
              
              {/* Error Message */}
              {error && (
                <div className="p-2.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Consultation Format (Voice Call / Video / Chat) */}
              <div>
                <label className="block text-xs font-bold text-on-background dark:text-slate-200 mb-1.5">
                  1. परामर्श का माध्यम चुनें (Select Format)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Voice Call */}
                  <button
                    type="button"
                    onClick={() => setSessionType('call')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      sessionType === 'call'
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-on-background dark:text-white shadow-2xs ring-1 ring-primary'
                        : 'border-border dark:border-slate-700 bg-surface-muted/30 dark:bg-slate-800/50 text-on-surface-variant hover:border-border-focus'
                    }`}
                  >
                    <Phone size={15} className={sessionType === 'call' ? 'text-primary' : 'text-emerald-500'} />
                    <span className="text-xs font-bold">Voice Call</span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-semibold">₹{voiceRate}/min</span>
                  </button>

                  {/* Video Call */}
                  <button
                    type="button"
                    onClick={() => setSessionType('video')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      sessionType === 'video'
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-on-background dark:text-white shadow-2xs ring-1 ring-primary'
                        : 'border-border dark:border-slate-700 bg-surface-muted/30 dark:bg-slate-800/50 text-on-surface-variant hover:border-border-focus'
                    }`}
                  >
                    <Video size={15} className={sessionType === 'video' ? 'text-primary' : 'text-amber-500'} />
                    <span className="text-xs font-bold">Video Call</span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-semibold">₹{videoRate}/min</span>
                  </button>

                  {/* Chat */}
                  <button
                    type="button"
                    onClick={() => setSessionType('chat')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      sessionType === 'chat'
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-on-background dark:text-white shadow-2xs ring-1 ring-primary'
                        : 'border-border dark:border-slate-700 bg-surface-muted/30 dark:bg-slate-800/50 text-on-surface-variant hover:border-border-focus'
                    }`}
                  >
                    <MessageCircle size={15} className={sessionType === 'chat' ? 'text-primary' : 'text-blue-500'} />
                    <span className="text-xs font-bold">Chat</span>
                    <span className="text-[10px] text-on-surface-variant dark:text-slate-400 font-semibold">₹{chatRate}/min</span>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-on-background dark:text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>2. तिथि चुनें (Select Date)</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        selectedDate === todayStr ? 'bg-primary text-slate-950' : 'bg-surface-muted text-on-surface-variant dark:bg-slate-800'
                      }`}
                    >
                      आज (Today)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                        selectedDate === tomorrowStr ? 'bg-primary text-slate-950' : 'bg-surface-muted text-on-surface-variant dark:bg-slate-800'
                      }`}
                    >
                      कल (Tomorrow)
                    </button>
                  </div>
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-surface-muted/50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-background dark:text-white"
                  />
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-xs font-bold text-on-background dark:text-slate-200 mb-1.5">
                  3. समय चुनें (Select Time Slot)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {QUICK_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      className={`py-1.5 px-1.5 text-[11px] font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                        selectedTime === slot && !customTime
                          ? 'border-primary bg-primary text-slate-950 font-bold shadow-2xs'
                          : 'border-border dark:border-slate-700 bg-surface-muted/40 dark:bg-slate-800/60 text-on-surface-variant hover:border-border-focus'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {/* Custom Time Selector */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-on-surface-variant dark:text-slate-400 shrink-0">या अन्य समय:</span>
                  <div className="relative flex-1">
                    <Clock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      type="time"
                      value={customTime}
                      onChange={handleCustomTimeChange}
                      className="w-full pl-7 pr-3 py-1 text-xs bg-surface-muted/50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-on-background dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Duration Options */}
              <div>
                <label className="block text-xs font-bold text-on-background dark:text-slate-200 mb-1.5">
                  4. सत्र अवधि (Duration)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDuration(mins)}
                      className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        duration === mins
                          ? 'border-primary bg-primary text-slate-950 shadow-2xs'
                          : 'border-border dark:border-slate-700 bg-surface-muted/40 dark:bg-slate-800/60 text-on-surface-variant'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Consultation Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-on-background dark:text-slate-200 mb-1">
                  5. समस्या या चर्चा का विषय (Optional Note)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="अपनी समस्या या सवाल के बारे में संक्षेप में लिखें..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-surface-muted/50 dark:bg-slate-800 border border-border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-on-background dark:text-white resize-none"
                />
              </div>

              {/* Pay Later Information Banner */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5">
                <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-on-surface-variant dark:text-slate-300 leading-relaxed">
                  <strong className="text-amber-700 dark:text-amber-300 block font-bold">
                    पैसे बाद में कटेंगे! (Pay Later Billing)
                  </strong>
                  अभी अपॉइंटमेंट बुक करने पर वॉलेट से कोई पैसा नहीं कटेगा। जब निर्धारित समय पर आपकी बात होगी, केवल बात किए गए समय का पैसा वॉलेट से कटेगा (दर: ₹{currentRate}/मिनट)।
                </div>
              </div>

            </div>

            {/* 3. Fixed Footer (Always visible at bottom with Submit button) */}
            <div className="p-3 sm:p-4 border-t border-border dark:border-slate-800 shrink-0 bg-surface-card/95 dark:bg-slate-900/95 backdrop-blur-xs">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-primary text-slate-950 font-bold py-2.5 sm:py-3 rounded-xl hover:bg-primary-light transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed active:scale-98"
              >
                {loading ? (
                  'Booking Appointment...'
                ) : (
                  <>
                    <Calendar size={15} />
                    <span>Confirm Appointment / अपॉइंटमेंट बुक करें (Pay Later)</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default BookAppointmentModal;
