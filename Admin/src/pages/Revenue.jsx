import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, TrendingUp, Users, CheckCircle } from 'lucide-react';

function Revenue() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('https://astrotalk-hlg2.onrender.com/api/admin/revenue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  const { data } = stats;

  return (
    <div className="flex-1 overflow-x-hidden">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revenue Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of platform earnings and financial metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Platform Fee</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{Number(data.totalPlatformFee || 0).toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp size={20} />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Gross Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{Number(data.totalRevenue || 0).toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Expert Earnings</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{Number(data.totalExpertEarnings || 0).toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Completed Consultations</p>
              <h3 className="text-2xl font-bold text-slate-900">{data.totalConsultations || 0}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Monthly Platform Fee</h2>
          <div className="h-64 flex items-end gap-2 pt-10">
            {stats.monthly && stats.monthly.length > 0 ? stats.monthly.map((m, idx) => {
              // rough scaling for simple bar chart
              const maxFee = Math.max(...stats.monthly.map(x => x.platformFee)) || 1;
              const heightPct = (m.platformFee / maxFee) * 100;
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-blue-100 rounded-t-sm relative flex items-end justify-center group-hover:bg-blue-200 transition-colors" style={{ height: `${heightPct}%`, minHeight: '10%' }}>
                    <span className="absolute -top-7 text-xs font-semibold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      ₹{Number(m.platformFee).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{monthNames[m._id - 1]}</span>
                </div>
              );
            }) : (
              <div className="w-full text-center text-slate-500">No data available</div>
            )}
          </div>
        </div>

        {/* Revenue Details Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Revenue Details (Recent Consultations)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gross</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expert Cut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Platform Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentConsultations && stats.recentConsultations.length > 0 ? (
                  stats.recentConsultations.map((cons) => (
                    <tr key={cons._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(cons.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 capitalize">{cons.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{cons.durationInMinutes || 0} min</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{Number(cons.cost || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-purple-600 font-semibold">₹{Number(cons.expertEarning || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-bold text-right">+ ₹{Number(cons.platformFee || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No recent revenue details found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Revenue;
