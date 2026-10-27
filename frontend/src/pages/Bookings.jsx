import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  Star,
  CalendarClock,
  ArrowRight,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import UserLayout from '../components/UserLayout';
import ReviewForm from '../components/ReviewForm';
import { getApiUrl } from '../utils/apiConfig';

function Bookings() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'upcoming';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reviewModalData, setReviewModalData] = useState(null);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await fetch(getApiUrl('/bookings/my-bookings'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAllBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  const upcoming = allBookings.filter(b => b.status === 'scheduled' || b.status === 'ongoing').map(b => ({
    id: b._id,
    expertName: b.expert?.name || 'Unknown Expert',
    date: new Date(b.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: new Date(b.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: b.status === 'scheduled' ? 'Confirmed' : 'Ongoing',
    paymentStatus: b.paymentStatus || 'pending',
    cost: b.cost || 0,
    type: b.type === 'call' ? 'Audio' : b.type === 'video' ? 'Video' : 'Chat',
    expertId: b.expert?._id,
    meetingLink: b.meetingLink
  }));

  const past = allBookings.filter(b => b.status === 'completed' || b.status === 'cancelled').map(b => ({
    id: b._id,
    expertName: b.expert?.name || 'Unknown Expert',
    date: new Date(b.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: new Date(b.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    status: b.status === 'completed' ? 'Completed' : 'Cancelled',
    rawStatus: b.status,
    paymentStatus: b.paymentStatus || 'pending',
    cost: b.cost || 0,
    type: b.type === 'call' ? 'Audio' : b.type === 'video' ? 'Video' : 'Chat',
    expertId: b.expert?._id,
    meetingLink: b.meetingLink,
    hasReviewed: b.hasReviewed,
    review: b.review
  }));

  const bookings = activeTab === 'upcoming' ? upcoming : past;

  const handleReviewSuccess = (response) => {
    // Update local state and trigger refresh
    setAllBookings(prev => prev.map(b => {
      if (b._id === response.review?.consultation) {
        return {
          ...b,
          hasReviewed: true,
          review: response.review
        };
      }
      return b;
    }));
  };

  return (
    <UserLayout>
      {/* Top Header Row matching mockup */}
      <div className="flex flex-row items-start justify-between gap-4 mb-4 sm:mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">View and manage your consultation sessions.</p>
        </div>
        <Link
          to="/experts"
          className="bg-[#F5B52E] hover:bg-[#eab308] text-slate-900 font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0 active:scale-95"
        >
          <span>+ Find Expert</span>
        </Link>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className={`px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl transition-all ${activeTab === 'upcoming'
              ? 'bg-white text-slate-900 border border-[#F5B52E] shadow-xs'
              : 'bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={`px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl transition-all ${activeTab === 'past'
              ? 'bg-white text-slate-900 border border-[#F5B52E] shadow-xs'
              : 'bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      {/* Bookings List */}
      <div className="flex flex-col gap-3 sm:gap-3.5 w-full min-w-0">
        {bookings.length === 0 ? (
          <>
            {activeTab === 'upcoming' ? (
              /* Upcoming empty state card exactly as in mockup */
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs w-full">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 text-[#D97706]">
                    <CalendarClock className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug">
                      Your next consultation starts here
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      You don't have any upcoming appointments.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Find the right expert and book a session when you need guidance.
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 my-3.5 sm:my-4" />

                <div className="flex flex-row items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm text-slate-400 font-medium">
                    Your booked sessions will appear here.
                  </span>
                  <Link
                    to="/experts"
                    className="bg-[#F5B52E] hover:bg-[#eab308] text-slate-900 font-semibold px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 active:scale-95"
                  >
                    <span>Explore Experts</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              /* Past empty state card matching the same premium style */
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs w-full">
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#FEF3C7] flex items-center justify-center shrink-0 text-[#D97706]">
                    <CalendarClock className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug">
                      No past consultations
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      You haven't completed any consultation sessions yet.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Once you attend your booked sessions, they will be archived here.
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100 my-3.5 sm:my-4" />

                <div className="flex flex-row items-center justify-between gap-3">
                  <span className="text-xs sm:text-sm text-slate-400 font-medium">
                    Past consultation history and reviews will appear here.
                  </span>
                  <Link
                    to="/experts"
                    className="bg-[#F5B52E] hover:bg-[#eab308] text-slate-900 font-semibold px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 active:scale-95"
                  >
                    <span>Explore Experts</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}

            {/* How Consultations Work Section */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs w-full">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">How Consultations Work</h3>
                  <p className="text-xs text-slate-500 mt-0.5">3 simple steps to connect with verified experts</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  <ShieldCheck size={13} />
                  Verified Platform
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                        <UserCheck size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 1</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Choose an Expert</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Browse top consultants by category, experience, reviews, and per-minute or hourly rate.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Calendar size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 2</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Pick Your Slot</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Choose your preferred date, time, and session format (Audio or Video call).
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Video size={16} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 3</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Connect & Consult</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Join your 1-on-1 private session directly from your dashboard and get live guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-surface rounded-xl p-4 sm:p-5 shadow-sm border border-border-color hover:border-blue-200 transition-colors w-full min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">

                {/* Left/Top Part: Avatar, Name, Date/Time, and Mobile Status Badge */}
                <div className="flex items-start justify-between gap-3 w-full md:w-auto min-w-0">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(booking.expertName)}&background=f8fafc&color=334155`}
                      alt={booking.expertName}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl border border-border-color shrink-0 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-on-surface text-base sm:text-lg truncate">{booking.expertName}</h3>
                      <div className="flex items-center text-xs sm:text-sm font-medium text-on-surface/60 mt-1 gap-2.5 sm:gap-3 flex-wrap">
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar size={13} className="text-on-surface/50" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={13} className="text-on-surface/50" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge (visible on mobile next to title) */}
                  <div className="md:hidden shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'Completed' ? 'bg-surface-light text-on-surface border border-border-color/60' :
                          booking.status === 'Ongoing' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                            'bg-amber-100 text-amber-700'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* Right/Bottom Part: Details & Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t border-border-color/60 md:border-0 w-full md:w-auto min-w-0">

                  {/* Status Badge (visible on desktop) */}
                  <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'Completed' ? 'bg-surface-light text-on-surface border border-border-color/60' :
                        booking.status === 'Ongoing' ? 'bg-amber-100 text-amber-700' :
                          'bg-amber-100 text-amber-700'
                    }`}>
                    {booking.status}
                  </span>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto flex-wrap">

                    {/* Consultation Type & Price Info */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-on-surface/80 flex items-center gap-1">
                        {booking.type === 'Video' ? <Video size={15} className="text-blue-500" /> : <Phone size={15} className="text-blue-500" />}
                        <span>{booking.type}</span>
                      </span>

                      <span className="text-xs sm:text-sm font-bold text-on-surface">₹{Number(booking.cost).toFixed(2)}</span>

                      <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                      {activeTab === 'upcoming' && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Link
                            to={booking.meetingLink || `/live/${booking.id}?type=audio`}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 transition-all"
                          >
                            <Phone size={13} />
                            <span>Audio</span>
                          </Link>
                          <Link
                            to={booking.meetingLink || `/live/${booking.id}?type=video`}
                            className="bg-orange-500 hover:bg-orange-600 text-background text-xs font-bold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Video size={13} />
                            <span>Video</span>
                          </Link>
                        </div>
                      )}

                      {activeTab === 'past' && booking.rawStatus === 'completed' && (
                        <div>
                          {booking.hasReviewed ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold">
                              <Star size={12} className="fill-amber-400 text-amber-500" />
                              <span>{booking.review?.rating || 5}★ Reviewed</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setReviewModalData({
                                consultationId: booking.id,
                                expertName: booking.expertName,
                                consultationType: booking.type
                              })}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              <Star size={13} className="fill-white" />
                              <span>Rate & Review</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Form Prompt Modal */}
      {reviewModalData && (
        <ReviewForm
          consultationId={reviewModalData.consultationId}
          expertName={reviewModalData.expertName}
          consultationType={reviewModalData.consultationType}
          onSuccess={handleReviewSuccess}
          onClose={() => setReviewModalData(null)}
        />
      )}
    </UserLayout>
  );
}

export default Bookings;
