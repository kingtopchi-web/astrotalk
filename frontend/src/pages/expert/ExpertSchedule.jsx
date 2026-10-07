import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { Clock, ToggleLeft, ToggleRight, Save, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function ExpertSchedule() {
  const { expert, fetchProfile } = useOutletContext();
  const [onlineStatus, setOnlineStatus] = useState(expert?.onlineStatus || 'offline');
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (expert) {
      setOnlineStatus(expert.onlineStatus || 'offline');
      
      // Initialize availability if empty
      if (expert.availability && expert.availability.length > 0) {
        setAvailability(expert.availability);
      } else {
        setAvailability(DAYS.map(day => ({
          day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: false
        })));
      }
    }
  }, [expert]);

  const handleStatusToggle = async () => {
    const newStatus = onlineStatus === 'online' ? 'offline' : 'online';
    setOnlineStatus(newStatus);
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch('https://astrotalk-hlg2.onrender.com/api/expert/profile', 
        { onlineStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProfile();
    } catch (err) {
      console.error('Failed to update status', err);
      // Revert on error
      setOnlineStatus(onlineStatus);
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newAvail = [...availability];
    newAvail[index] = { ...newAvail[index], [field]: value };
    setAvailability(newAvail);
  };

  const saveAvailability = async () => {
    setLoading(true);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch('https://astrotalk-hlg2.onrender.com/api/expert/profile', 
        { availability },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchProfile();
      setSuccessMsg('Schedule saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to save schedule', err);
      alert('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Real-time Status</h2>
            <p className="text-slate-500 mt-1">
              Toggle your status to receive instant chat and call requests.
            </p>
          </div>
          <button 
            onClick={handleStatusToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
              onlineStatus === 'online' 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${onlineStatus === 'online' ? 'bg-green-600' : 'bg-slate-400'}`}></div>
            {onlineStatus === 'online' ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Weekly Schedule</h2>
            <p className="text-slate-500 mt-1">Set your regular availability for scheduled bookings.</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="space-y-4">
            {availability.map((slot, index) => (
              <div key={slot.day} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${slot.isAvailable ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50'}`}>
                
                <div className="flex items-center gap-4 w-48">
                  <button 
                    onClick={() => handleAvailabilityChange(index, 'isAvailable', !slot.isAvailable)}
                    className={`text-2xl ${slot.isAvailable ? 'text-blue-600' : 'text-slate-400'}`}
                  >
                    {slot.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span className={`font-semibold ${slot.isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
                    {slot.day}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-1">
                  {slot.isAvailable ? (
                    <>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
                        <Clock size={16} className="text-slate-400" />
                        <input 
                          type="time" 
                          value={slot.startTime}
                          onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-medium text-slate-900"
                        />
                      </div>
                      <span className="text-slate-400">to</span>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-300">
                        <Clock size={16} className="text-slate-400" />
                        <input 
                          type="time" 
                          value={slot.endTime}
                          onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-medium text-slate-900"
                        />
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm italic">Unavailable</span>
                  )}
                </div>

              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button 
              onClick={saveAvailability}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
            {successMsg && (
              <span className="flex items-center gap-1 text-green-600 font-medium text-sm">
                <CheckCircle size={16} />
                {successMsg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpertSchedule;
