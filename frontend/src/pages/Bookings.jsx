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
  const [activeTab, setActiveTab] = useState('upcoming');
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
              <Link to="/experts" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm inline-flex items-center justify-center">
                Find New Expert
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-200/50 rounded-lg p-1 mb-8 max-w-sm">
              <button 
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('past')}
              >
                Past
              </button>
            </div>

            {/* Bookings List */}
            <div className="flex flex-col gap-4">
              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No {activeTab} bookings</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                    You don't have any {activeTab} consultation sessions at the moment.
                  </p>
                </div>
              ) : (
                bookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(booking.expertName)}&background=f8fafc&color=334155`}
                          alt={booking.expertName}
                          className="w-12 h-12 rounded-xl border border-slate-200"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">{booking.expertName}</h3>
                          <div className="flex items-center text-sm font-medium text-slate-500 mt-1 gap-3">
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
                      
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-2 pt-4 md:pt-0 border-t border-slate-100 md:border-0 mt-2 md:mt-0">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          booking.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 
                          booking.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.status}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
                            {booking.type === 'Video' ? <Video size={16} className="text-blue-500" /> : <Phone size={16} className="text-blue-500" />}
                            {booking.type}
                          </span>

                          <span className="text-sm font-bold text-slate-800 ml-2">₹{booking.cost}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ml-2 ${
                            booking.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
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
                                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
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
