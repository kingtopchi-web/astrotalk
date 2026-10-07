import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Calendar, 
  Wallet, 
  Heart, 
  Search, 
  MessageSquare,
  ChevronRight,
  Clock
} from 'lucide-react';
import UserLayout from '../components/UserLayout';

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [savedExpertsCount, setSavedExpertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch recent appointments and saved experts
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [aptRes, savedRes] = await Promise.all([
          axios.get('https://astrotalk-hlg2.onrender.com/api/bookings/my-bookings', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('https://astrotalk-hlg2.onrender.com/api/user/saved-experts', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAppointments(aptRes.data); 
        setSavedExpertsCount(savedRes.data.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : 'User';
  
  const upcomingCount = appointments.filter(a => ['scheduled', 'ongoing'].includes(a.status)).length;
  const totalSpent = appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.cost || 0), 0);
  const recentAppointments = appointments.slice(0, 4);

  return (
    <UserLayout>
      <div className="flex flex-col gap-6">
        
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              Good Morning, {displayName}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Here's what's happening with your consultations.</p>
          </div>

          <div className="hidden lg:flex items-center gap-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="relative w-32 h-20">
              <div className="absolute inset-0 bg-blue-100 rounded-xl transform -rotate-3"></div>
              <div className="absolute inset-0 bg-white rounded-xl shadow-sm border border-blue-50 flex items-center justify-center p-2">
                <div className="w-full h-full bg-blue-50 rounded-lg flex items-center justify-center text-blue-300">
                  <Calendar size={24} />
                </div>
              </div>
            </div>
            <div className="w-48">
              <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                "The best way to predict your future is to create it."
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Upcoming Appointments</p>
                <h3 className="text-3xl font-bold text-slate-800">{upcomingCount}</h3>
              </div>
            </div>
            <Link to="/bookings" className="text-blue-600 text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-blue-700">
              View details <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Spent</p>
                <h3 className="text-3xl font-bold text-slate-800">₹{totalSpent}</h3>
              </div>
            </div>
            <Link to="/wallet" className="text-blue-600 text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-blue-700">
              View details <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <Heart size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">Saved Experts</p>
                <h3 className="text-3xl font-bold text-slate-800">{savedExpertsCount}</h3>
              </div>
            </div>
            <Link to="/experts" className="text-blue-600 text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-blue-700">
              View details <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Recent Appointments</h2>
              <Link to="/bookings" className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
                  ))}
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p>No recent appointments found.</p>
                </div>
              ) : (
                recentAppointments.map((apt) => {
                  const expertName = apt.expert?.name || 'Unknown Expert';
                  const expertImg = apt.expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expertName)}&background=0D8ABC&color=fff`;
                  const expertSpec = apt.expert?.specialty || apt.expert?.categoryId?.name || 'Consultant';
                  const dateObj = new Date(apt.startTime);
                  const isToday = new Date().toDateString() === dateObj.toDateString();
                  const timeString = isToday 
                    ? `Today, ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                    : dateObj.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });

                  return (
                    <div key={apt._id} onClick={() => navigate('/bookings')} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group gap-4">
                      <div className="flex items-center gap-4 sm:w-2/5">
                        <img src={expertImg} alt={expertName} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{expertName}</h4>
                          <p className="text-xs text-slate-500 truncate">{expertSpec}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-500 text-sm sm:w-1/4">
                        <Calendar size={14} className="shrink-0" />
                        <span className="truncate">{timeString}</span>
                      </div>
                      
                      <div className="flex items-center justify-between sm:w-1/4 sm:justify-end gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          ['scheduled', 'ongoing'].includes(apt.status) ? 'bg-blue-50 text-blue-600' : 
                          apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </span>
                        {apt.paymentStatus === 'paid' && <span className="text-[10px] text-emerald-600 font-bold block mt-1">PAID</span>}
                        <div className="text-slate-300 group-hover:text-blue-500 transition-colors sm:ml-4">
                          <ChevronRight size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h2>
            
            <div className="flex flex-col gap-4">
              <Link to="/experts" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <Search size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Find Experts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Browse all categories</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link to="/experts" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Book Appointment</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Schedule a session</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link to="/bookings" className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Send Message</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Chat with your expert</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            </div>
            
            <div className="mt-auto pt-6">
              <Link to="/experts" className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700">
                View All <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}

export default UserDashboard;
