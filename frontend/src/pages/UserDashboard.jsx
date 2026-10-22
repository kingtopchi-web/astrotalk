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
  const [savedExperts, setSavedExperts] = useState([]);
  const [savedExpertsCount, setSavedExpertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch recent appointments and saved experts
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [aptRes, savedRes] = await Promise.all([
          axios.get('https://experthub.nextgoodtechnologies.in/api/bookings/my-bookings', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('https://experthub.nextgoodtechnologies.in/api/user/saved-experts', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAppointments(aptRes.data || []); 
        const savedList = Array.isArray(savedRes.data) ? savedRes.data : [];
        setSavedExperts(savedList);
        setSavedExpertsCount(savedList.length);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleRemoveSaved = async (expertId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    setSavedExperts(prev => prev.filter(exp => (exp._id || exp) !== expertId));
    setSavedExpertsCount(prev => Math.max(0, prev - 1));
    try {
      await axios.post(
        `https://experthub.nextgoodtechnologies.in/api/user/saved-experts/${expertId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to remove saved expert:', err);
    }
  };

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
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-2">
              Good Morning, {displayName}! <span className="animate-wave inline-block origin-bottom-right">👋</span>
            </h1>
            <p className="text-on-surface/60 mt-2 font-medium">Here's what's happening with your consultations.</p>
          </div>

          <div className="hidden lg:flex items-center gap-6 bg-primary/10/50 p-4 rounded-2xl border border-blue-100">
            <div className="relative w-32 h-20">
              <div className="absolute inset-0 bg-blue-100 rounded-xl transform -rotate-3"></div>
              <div className="absolute inset-0 bg-surface rounded-xl shadow-sm border border-blue-50 flex items-center justify-center p-2">
                <div className="w-full h-full bg-primary/10 rounded-lg flex items-center justify-center text-blue-300">
                  <Calendar size={24} />
                </div>
              </div>
            </div>
            <div className="w-48">
              <p className="text-sm font-medium text-on-surface/80 italic leading-relaxed">
                "The best way to predict your future is to create it."
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-color flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface/60 mb-1">Upcoming Appointments</p>
                <h3 className="text-3xl font-bold text-on-surface">{upcomingCount}</h3>
              </div>
            </div>
            <Link to="/bookings" className="text-primary text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-primary">
              View details <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-color flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface/60 mb-1">Total Spent</p>
                <h3 className="text-3xl font-bold text-on-surface">₹{Number(totalSpent).toFixed(2)}</h3>
              </div>
            </div>
            <Link to="/wallet" className="text-primary text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-primary">
              View details <ChevronRight size={16} />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-color flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <Heart size={24} className="fill-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface/60 mb-1">Saved Experts</p>
                <h3 className="text-3xl font-bold text-on-surface">{savedExpertsCount}</h3>
              </div>
            </div>
            <a 
              href="#saved-experts-section" 
              className="text-primary text-sm font-semibold mt-6 inline-flex items-center gap-1 hover:text-primary cursor-pointer"
            >
              View details <ChevronRight size={16} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Appointments */}
          <div className="lg:col-span-2 bg-surface rounded-2xl shadow-sm border border-border-color p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-on-surface">Recent Appointments</h2>
              <Link to="/bookings" className="text-sm font-semibold text-primary flex items-center gap-1 hover:text-primary">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="flex-1 flex flex-col gap-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-surface-light rounded-xl"></div>
                  ))}
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="text-center py-10 text-on-surface/60">
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
                    <div key={apt._id} onClick={() => navigate('/bookings')} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border-color hover:bg-surface-light transition-colors cursor-pointer group gap-4">
                      <div className="flex items-center gap-4 sm:w-2/5">
                        <img src={expertImg} alt={expertName} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-on-surface truncate">{expertName}</h4>
                          <p className="text-xs text-on-surface/60 truncate">{expertSpec}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-on-surface/60 text-sm sm:w-1/4">
                        <Calendar size={14} className="shrink-0" />
                        <span className="truncate">{timeString}</span>
                      </div>
                      
                      <div className="flex items-center justify-between sm:w-1/4 sm:justify-end gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${Number(
                          ['scheduled', 'ongoing'].includes(apt.status) ? 'bg-primary/10 text-primary' : 
                          apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-surface-light text-on-surface/80'
                        ).toFixed(2)}`}>
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
          <div className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 flex flex-col">
            <h2 className="text-lg font-bold text-on-surface mb-6">Quick Actions</h2>
            
            <div className="flex flex-col gap-4">
              <Link to="/experts" className="flex items-center gap-4 p-4 rounded-xl border border-border-color hover:border-blue-200 hover:bg-primary/10/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <Search size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-surface">Find Experts</h4>
                  <p className="text-xs text-on-surface/60 mt-0.5">Browse all categories</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link to="/experts" className="flex items-center gap-4 p-4 rounded-xl border border-border-color hover:border-blue-200 hover:bg-primary/10/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-surface">Book Appointment</h4>
                  <p className="text-xs text-on-surface/60 mt-0.5">Schedule a session</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link to="/messages" className="flex items-center gap-4 p-4 rounded-xl border border-border-color hover:border-blue-200 hover:bg-primary/10/50 transition-all group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-blue-100 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-on-surface">Send Message</h4>
                  <p className="text-xs text-on-surface/60 mt-0.5">Chat with your expert</p>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </Link>
            </div>
            
            <div className="mt-auto pt-6">
              <Link to="/experts" className="text-sm font-bold text-primary flex items-center gap-1 hover:text-primary">
                View All <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Saved Experts Dynamic Section */}
        <div id="saved-experts-section" className="bg-surface rounded-2xl shadow-sm border border-border-color p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                <Heart size={20} className="fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">Saved Experts ({savedExperts.length})</h2>
                <p className="text-xs text-on-surface/60">Your bookmarked professionals for quick consultations</p>
              </div>
            </div>
            <Link to="/experts" className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
              Browse More <ChevronRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse h-36 bg-surface-light rounded-2xl"></div>
              ))}
            </div>
          ) : savedExperts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border-color rounded-2xl bg-surface-light/30">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 mx-auto flex items-center justify-center mb-3">
                <Heart size={24} />
              </div>
              <h3 className="font-bold text-on-surface text-sm mb-1">No Saved Experts Yet</h3>
              <p className="text-xs text-on-surface/60 max-w-sm mx-auto mb-4">
                Click the heart icon on any expert card to bookmark them here for instant consultations.
              </p>
              <Link to="/experts" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-background font-semibold text-xs hover:bg-primary-light transition-colors">
                <Search size={14} /> Find Experts
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedExperts.map((exp) => {
                const expName = exp.name || 'Expert';
                const expImg = exp.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(expName)}&background=F97316&color=fff`;
                const categoryName = exp.categoryId?.name || exp.specialty || 'Consultant';
                const subCategoryName = exp.subCategoryId?.name;
                const price = Number(exp.rates?.chat || exp.pricePerMinute || 0).toFixed(2);

                return (
                  <div
                    key={exp._id}
                    onClick={() => navigate(`/expert/${exp._id}`)}
                    className="bg-surface rounded-2xl border border-border-color p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer relative group flex flex-col justify-between"
                  >
                    {/* Unsave Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSaved(exp._id, e)}
                      aria-label="Remove expert"
                      title="Remove from saved"
                      className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-all z-10 border border-rose-200"
                    >
                      <Heart size={14} className="fill-rose-500" />
                    </button>

                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative shrink-0">
                          <img
                            src={expImg}
                            alt={expName}
                            className="w-14 h-14 rounded-2xl object-cover"
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${exp.onlineStatus === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        </div>
                        <div className="min-w-0 pr-6">
                          <h4 className="font-bold text-sm text-on-surface truncate">{expName}</h4>
                          <p className="text-xs text-on-surface/60 truncate">{categoryName}</p>
                          {subCategoryName && (
                            <span className="inline-block text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full mt-1">
                              {subCategoryName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-color pt-3 mt-2">
                      <div>
                        <span className="text-sm font-bold text-on-surface">₹{price}</span>
                        <span className="text-xs text-on-surface/50">/min</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/expert/${exp._id}`);
                        }}
                        className="text-xs bg-primary hover:bg-primary-light text-background font-bold px-3 py-1.5 rounded-xl shadow-sm transition-colors"
                      >
                        Consult
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </UserLayout>
  );
}

export default UserDashboard;
