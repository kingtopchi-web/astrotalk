import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2,
  AlertCircle,
  Edit2,
  Hourglass,
  XCircle,
  Briefcase,
  CreditCard,
  MessageSquare,
  CalendarDays,
  Users
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: {
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    icon: <Hourglass size={32} className="text-yellow-500" />,
    title: 'Profile Under Review',
    message: 'Your profile is currently under admin review. This usually takes 1-2 business days.'
  },
  APPROVED: {
    color: 'bg-green-50 border-green-200 text-green-700',
    icon: <CheckCircle2 size={32} className="text-green-500" />,
    title: 'Profile Approved',
    message: 'Congratulations! Your profile has been approved. You are now visible to users.'
  },
  REJECTED: {
    color: 'bg-red-50 border-red-200 text-red-700',
    icon: <XCircle size={32} className="text-red-500" />,
    title: 'Profile Needs Changes',
    message: 'Your profile was rejected. Please review the feedback and make corrections, then resubmit.'
  }
};

function ExpertDashboard() {
  const { expert, fetchProfile } = useOutletContext();
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState('');
  const [stats, setStats] = useState({
    todaysConsultations: 0,
    pendingRequests: 0,
    totalEarnings: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/expert/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  const handleResubmit = async () => {
    if (!window.confirm('Are you sure you want to resubmit your profile for review?')) return;
    setResubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://astrotalk-hlg2.onrender.com/api/expert/resubmit', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResubmitSuccess('Your profile has been resubmitted for review!');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setResubmitting(false);
    }
  };

  const statusConfig = STATUS_CONFIG[expert?.verificationStatus] || STATUS_CONFIG.PENDING;
  const displayName = expert?.name || 'Expert';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group">
          <img
            src={expert?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=fff&size=150`}
            alt="Profile"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-md border-4 border-white object-cover"
          />
          <Link 
            to="/expert/profile/edit"
            className="absolute bottom-0 right-0 bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={16} />
          </Link>
        </div>
        
        <div className="text-center md:text-left pt-2 flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, {displayName}</h1>
          <p className="text-slate-500 font-medium mt-1">
            {expert?.email}
          </p>
          <div className="mt-3 flex gap-2 justify-center md:justify-start">
             <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider border border-green-100">
               <Briefcase size={14} />
               {expert?.categoryId?.name || expert?.specialty || 'Expert'}
             </span>
          </div>
        </div>
      </div>

      {/* Verification Status Banner */}
      <div className="space-y-4">
        {resubmitSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 shadow-sm">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <span>{resubmitSuccess}</span>
          </div>
        )}
        
        <div className={`border rounded-2xl p-6 shadow-sm ${statusConfig.color}`}>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="shrink-0 bg-white/50 p-2 rounded-xl backdrop-blur-sm">
              {statusConfig.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">{statusConfig.title}</h3>
              <p className="text-sm opacity-90 leading-relaxed">{statusConfig.message}</p>
              
              {expert?.verificationStatus === 'REJECTED' && expert?.rejectionReason && (
                <div className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl text-sm border border-current/10">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <AlertCircle size={16} />
                    Reviewer Notes:
                  </div>
                  {expert.rejectionReason}
                </div>
              )}
              
              {expert?.verificationStatus === 'REJECTED' && (
                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/expert/profile/edit"
                    className="flex-1 text-center bg-white border border-current/20 font-bold py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={handleResubmit}
                    disabled={resubmitting}
                    className="flex-1 bg-current text-white font-bold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm shadow-sm"
                  >
                    {resubmitting ? 'Submitting...' : 'Resubmit for Review'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Today's Consultations</p>
            <p className="text-2xl font-bold text-slate-900">{stats.todaysConsultations}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <CalendarDays size={20} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Pending Requests</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pendingRequests}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600">
            <Hourglass size={20} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Unread Messages</p>
            <p className="text-2xl font-bold text-slate-900">{stats.unreadMessages}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-xl text-green-600">
            <MessageSquare size={20} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-slate-900">₹{stats.totalEarnings}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* Details and Rates Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" />
            Professional Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-500">Category</span>
              <span className="text-sm font-bold text-slate-900">{expert?.categoryId?.name || expert?.specialty || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-500">Sub-category</span>
              <span className="text-sm font-bold text-slate-900">{expert?.subCategoryId?.name || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-500">Experience</span>
              <span className="text-sm font-bold text-slate-900">{expert?.experience ? `${expert.experience} Years` : '—'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm font-semibold text-slate-500">Account Status</span>
              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${expert?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {expert?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Consultation Rates
            </h2>
            <Link to="/expert/profile/edit" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
              <Edit2 size={14} /> Edit
            </Link>
          </div>
          
          <div className="space-y-3">
            {[
              { label: 'Chat Session', value: expert?.rates?.chat },
              { label: 'Audio Call', value: expert?.rates?.audio },
              { label: 'Video Call', value: expert?.rates?.video },
            ].map(r => (
              <div key={r.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{r.label}</span>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-slate-900">₹{r.value || 0}</span>
                  <span className="text-xs text-slate-500 ml-1">/min</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ExpertDashboard;
