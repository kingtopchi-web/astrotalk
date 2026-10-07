import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Video, Phone, MessageCircle, Clock, Check, X } from 'lucide-react';

function ExpertConsultations() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, scheduled, completed, cancelled

  useEffect(() => {
    fetchConsultations();
  }, [filter]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`https://astrotalk-hlg2.onrender.com/api/expert/consultations${filter !== 'all' ? `?status=${filter}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(res.data);
    } catch (err) {
      console.error('Failed to fetch consultations', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`https://astrotalk-hlg2.onrender.com/api/expert/consultations/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update local state
      setConsultations(consultations.map(c => 
        c._id === id ? { ...c, status: newStatus } : c
      ));
    } catch (err) {
      alert('Failed to update status');
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={16} className="mr-1" />;
      case 'call': return <Phone size={16} className="mr-1" />;
      case 'chat': return <MessageCircle size={16} className="mr-1" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pending</span>;
      case 'scheduled': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Scheduled</span>;
      case 'ongoing': return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">Ongoing</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Completed</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Cancelled</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Consultations</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'scheduled', 'completed', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading consultations...</div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No consultations found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              You don't have any {filter !== 'all' ? filter : ''} consultations at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map(consultation => (
              <div key={consultation._id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                    <img 
                      src={consultation.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(consultation.user?.name || 'User')}&background=random`} 
                      alt={consultation.user?.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                        {consultation.user?.name || 'Unknown User'}
                        {getStatusBadge(consultation.status)}
                      </h4>
                      <p className="text-slate-500 text-sm mt-1 flex items-center flex-wrap gap-3">
                        <span className="flex items-center">
                          {getTypeIcon(consultation.type)}
                          <span className="capitalize">{consultation.type}</span>
                        </span>
                        <span className="flex items-center text-slate-400">
                          <Clock size={14} className="mr-1" />
                          {consultation.durationInMinutes} mins
                        </span>
                      </p>
                      <div className="text-sm font-medium text-slate-900 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                        {new Date(consultation.startTime).toLocaleString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-slate-900">
                      ₹{consultation.cost}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                      {consultation.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateStatus(consultation._id, 'scheduled')}
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors tooltip"
                            title="Accept"
                          >
                            <Check size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(consultation._id, 'cancelled')}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors tooltip"
                            title="Reject/Cancel"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      {consultation.status === 'scheduled' && (
                        <button 
                          onClick={() => navigate(`/live/${consultation._id}`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Join Meeting
                        </button>
                      )}
                      {(consultation.status === 'scheduled' || consultation.status === 'ongoing') && (
                        <button 
                          onClick={() => updateStatus(consultation._id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpertConsultations;
