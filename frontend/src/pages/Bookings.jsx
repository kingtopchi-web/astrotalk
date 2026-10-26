import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar,
  Clock,
  Video,
  Phone,
  Star
} from 'lucide-react';
import UserLayout from '../components/UserLayout';
import ReviewForm from '../components/ReviewForm';

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
      const response = await fetch('https://experthub.nextgoodtechnologies.in/api/bookings/my-bookings', {
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
    <UserLayout title="My Bookings" subtitle="View and manage your consultation sessions.">
      {/* Top Header Controls: Tabs & Find New Expert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-3 w-full min-w-0">
        <div className="flex bg-slate-200/60 rounded-xl p-1 w-full sm:w-auto sm:min-w-[240px] max-w-sm">
          <button 
            className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${activeTab === 'upcoming' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${activeTab === 'past' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface/60 hover:text-on-surface'}`}
            onClick={() => setActiveTab('past')}
          >
            Past
          </button>
        </div>

        <Link to="/experts" className="bg-primary hover:bg-primary-light text-background px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm inline-flex items-center justify-center shrink-0 w-full sm:w-auto">
          Find New Expert
        </Link>
      </div>

      {/* Bookings List */}
      <div className="flex flex-col gap-3 sm:gap-3.5 w-full min-w-0">
        {bookings.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border-color p-6 sm:p-8 text-center shadow-sm w-full">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} className="text-on-surface/50 sm:text-2xl" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-on-surface">No {activeTab} bookings</h3>
            <p className="text-xs text-on-surface/60 mt-1 max-w-sm mx-auto">
              You don't have any {activeTab} consultation sessions at the moment.
            </p>
          </div>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
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
                  <span className={`hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                    booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
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
                      
                      <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                        booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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
