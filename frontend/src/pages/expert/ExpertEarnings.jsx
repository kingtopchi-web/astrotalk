import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Clock, Download, TrendingUp, CreditCard } from 'lucide-react';

function ExpertEarnings() {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    availablePayout: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://astrotalk-hlg2.onrender.com/api/expert/earnings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnings(res.data);
    } catch (err) {
      console.error('Failed to fetch earnings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://astrotalk-hlg2.onrender.com/api/expert/payouts/request', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Payout request submitted successfully!');
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request payout');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Earnings & Payouts</h2>
        <button
          onClick={handleRequestPayout}
          disabled={earnings.availablePayout <= 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <CreditCard size={18} />
          Request Payout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Total Earnings</p>
              <p className="text-3xl font-extrabold text-slate-900">₹{Number(earnings.totalEarnings).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-xl text-green-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500 flex items-center gap-1.5">
            <span className="text-green-600 font-bold flex items-center"><TrendingUp size={14} className="mr-0.5" /> Lifetime</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">Available for Payout</p>
              <p className="text-3xl font-extrabold text-slate-900">₹{Number(earnings.availablePayout).toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-500">
            Funds ready to be withdrawn to your bank
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-900">Transaction History</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading history...</div>
        ) : earnings.history.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-slate-400" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">No Transactions Yet</h4>
            <p className="text-slate-500 max-w-sm mx-auto">You haven't earned anything yet. Complete consultations to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.history.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-sm font-medium text-slate-900">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${Number(
                        item.type === 'EARNING' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      ).toFixed(2)}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {item.description}
                    </td>
                    <td className={`py-4 px-6 text-sm font-bold text-right ${Number(
                      item.type === 'EARNING' ? 'text-green-600' : 'text-slate-900'
                    ).toFixed(2)}`}>
                      {item.type === 'EARNING' ? '+' : '-'}₹{Number(item.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-sm text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${Number(
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      ).toFixed(2)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpertEarnings;
