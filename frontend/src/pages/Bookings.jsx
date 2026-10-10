import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar,
  Clock,
  Video,
  Phone
} from 'lucide-react';
import UserLayout from '../components/UserLayout';

function Bookings() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'upcoming';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = queryParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
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
    paymentStatus: b.paymentStatus || 'pending',
    cost: b.cost || 0,
    type: b.type === 'call' ? 'Audio' : b.type === 'video' ? 'Video' : 'Chat',
    expertId: b.expert?._id,
    meetingLink: b.meetingLink
  }));

  const bookings = activeTab === 'upcoming' ? upcoming : past;



  return (
    <UserLayout title="My Bookings" subtitle="View and manage your consultation sessions.">
      <div className="flex flex-col sm:flex-row sm:items-center justify-end mb-8 gap-4">
              <Link to="/experts" className="bg-primary hover:bg-primary-light text-background px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center">
                Find New Expert
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-200/50 rounded-lg p-1 mb-8 max-w-sm">
              <button 
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface/60 hover:text-on-surface'}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'past' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface/60 hover:text-on-surface'}`}
                onClick={() => setActiveTab('past')}
              >
                Past
              </button>
            </div>

            {/* Bookings List */}
            <div className="flex flex-col gap-4">
              {bookings.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border-color p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-on-surface/50" />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">No {activeTab} bookings</h3>
                  <p className="text-sm text-on-surface/60 mt-1 max-w-sm mx-auto">
                    You don't have any {activeTab} consultation sessions at the moment.
                  </p>
                </div>
              ) : (
                bookings.map(booking => (
                  <div key={booking.id} className="bg-surface rounded-2xl p-5 md:p-6 shadow-sm border border-border-color hover:border-blue-200 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(booking.expertName)}&background=f8fafc&color=334155`}
                          alt={booking.expertName}
                          className="w-12 h-12 rounded-xl border border-border-color"
                        />
                        <div>
                          <h3 className="font-bold text-on-surface text-lg">{booking.expertName}</h3>
                          <div className="flex items-center text-sm font-medium text-on-surface/60 mt-1 gap-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={14} />
                              {booking.date}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {booking.time}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-2 pt-4 md:pt-0 border-t border-border-color md:border-0 mt-2 md:mt-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${Number(
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'Completed' ? 'bg-surface-light text-on-surface' :
                          'bg-amber-100 text-amber-700'
                        ).toFixed(2)}`}>
                          {booking.status}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-on-surface/80 flex items-center gap-1.5">
                            {booking.type === 'Video' ? <Video size={16} className="text-blue-500" /> : <Phone size={16} className="text-blue-500" />}
                            {booking.type}
                          </span>

                          <span className="text-sm font-bold text-on-surface ml-2">₹{Number(booking.cost).toFixed(2)}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ml-2 ${Number(
                            booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          ).toFixed(2)}`}>
                            {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                          
                          {activeTab === 'upcoming' && (
                            <div className="flex items-center gap-2 ml-2">
                              <Link 
                                to={booking.meetingLink || `/live/${booking.id}?type=audio`} 
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
                              >
                                <Phone size={14} />
                                <span>Audio</span>
                              </Link>
                              <Link 
                                to={booking.meetingLink || `/live/${booking.id}?type=video`} 
                                className="bg-orange-500 hover:bg-orange-600 text-background text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                              >
                                <Video size={14} />
                                <span>Video</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>
                ))
              )}
            </div>
    </UserLayout>
  );
}

export default Bookings;
