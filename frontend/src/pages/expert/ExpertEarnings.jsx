import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { DollarSign, Clock, Download, TrendingUp, CreditCard, Users, ArrowRight } from 'lucide-react';
import { getApiUrl } from '../../utils/apiConfig';

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
      const res = await axios.get(getApiUrl('/expert/earnings'), {
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
      const res = await axios.post(getApiUrl('/expert/payouts/request'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.requiresPennyDropConfirmation) {
        alert(res.data.message || '₹1 verification sent to your bank account! Please confirm receipt.');
      } else {
        alert('Payout request submitted successfully!');
      }
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request payout');
    }
  };

  const handleConfirmPennyDrop = async (payoutId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl('/expert/payouts/confirm-penny-drop'), { payoutId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data?.message || '₹1 receipt confirmed! Remaining balance payout is scheduled.');
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm verification');
    }
  };

  const handleCancelPennyDrop = async (payoutId) => {
    if (!window.confirm('Are you sure you want to cancel this payout request?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('/expert/payouts/cancel'), { payoutId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel payout');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Earnings & Payouts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin Payout Policy: Once every {earnings.payoutDaysInterval || 7} days • Processing: ~{earnings.payoutEstimatedDays || 3} business days
          </p>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              to="/experts"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5"
              title="Use your earnings balance to call or chat with any other expert on the platform"
            >
              <Users size={16} />
              <span>Consult Other Experts</span>
            </Link>

            <button
              onClick={handleRequestPayout}
              disabled={earnings.availablePayout < (earnings.minPayoutAmount || 100) || earnings.canRequestPayout === false}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              title={earnings.canRequestPayout === false ? `Payout cooldown: Available once every ${earnings.payoutDaysInterval || 7} days (${earnings.daysRemaining} days remaining)` : "Request Payout"}
            >
              <CreditCard size={16} />
              <span>Request Payout</span>
            </button>
          </div>
          {earnings.canRequestPayout === false && (
            <span className="text-[11px] font-bold text-amber-600">
              Next payout available in {earnings.daysRemaining} day(s)
            </span>
          )}
        </div>
      </div>

      
      {/* 1 Rupee Penny-Drop Bank Verification Alert Banner */}
      {earnings.activePayout?.status === 'VERIFICATION_PENDING' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-extrabold text-sm border border-amber-300 shadow-xs">
              ₹1
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-amber-950">
                  Bank Account Verification in Progress
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 animate-pulse">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Verification ke liye aapke bank account (ending with <strong>****{earnings.activePayout?.bankDetails?.accountNumber?.slice(-4) || '****'}</strong>) mein ₹1 bhej diya gaya hai. Kripya apna bank account / message check karein.
              </p>
              <p className="text-xs text-amber-950 font-bold mt-1">
                Aapke confirm karne par remaining <strong>₹{earnings.activePayout?.remainingAmount || (earnings.activePayout?.amount - 1)}</strong> (1 rupya deduct karke) aapke account mein transfer ho jayenge.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => handleCancelPennyDrop(earnings.activePayout._id)}
              className="px-3 py-2 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmPennyDrop(earnings.activePayout._id)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <CheckCircle size={15} />
              <span>हाँ, ₹1 मिल गया (Confirm & Release)</span>
            </button>
          </div>
        </div>
      )}

      {earnings.activePayout?.status === 'PENDING' && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={16} className="text-blue-600 shrink-0" />
            <span>
              <strong>₹1 Verified!</strong> Aapka remaining payout of <strong>₹{earnings.activePayout?.remainingAmount || earnings.activePayout?.amount}</strong> admin approval / automated bank transfer ke liye queued hai.
            </span>
          </div>
          <span className="font-mono text-[11px] text-blue-700 shrink-0">#{earnings.activePayout?.internalTransactionId?.slice(-8)}</span>
        </div>
      )}

      {/* Smart Balance Utilization Banner (Use balance for consulting other experts) */}
      <div className="bg-emerald-50/90 dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Use Earnings Balance for Expert Consultations</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                Active
              </span>
            </h4>
            <p className="text-xs text-slate-700 dark:text-emerald-100 font-medium mt-1 leading-relaxed max-w-2xl">
              Aapka available balance (<strong className="text-emerald-900 dark:text-white font-black">₹{Number(earnings.availablePayout || 0).toFixed(2)}</strong>) bank payout lene ke sath-sath platform ke kisi bhi dusre expert se audio call, video call ya chat consultation karne ke liye bhi directly use ho sakta hai. Alag se wallet recharge karne ki zaroorat nahi hai!
            </p>
          </div>
        </div>
        <Link
          to="/experts"
          className="shrink-0 px-4 py-2 sm:px-4 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span>Browse Experts</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Gross Consultations</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{Number(earnings.totalGross || earnings.totalEarnings || 0).toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg text-slate-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Total client billing volume</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 mb-1">Fee & Tax Deducted</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-600">-₹{Number(earnings.totalPlatformFee || 0).toFixed(2)}</p>
            </div>
            <div className="bg-rose-100/60 p-2.5 rounded-lg text-rose-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-rose-700/80">
            Platform take rate & service taxes
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Net Lifetime Earnings</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{Number(earnings.totalEarnings).toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-2.5 rounded-lg text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-green-600 font-bold flex items-center"><TrendingUp size={13} className="mr-0.5" /> After deductions</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Available for Payout</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">₹{Number(earnings.availablePayout).toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Withdrawable as Bank Payout OR usable for 1-on-1 consultations
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">Payout Frequency</p>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900">
                Every {earnings.payoutDaysInterval || 7} Days
              </p>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-3 text-xs">
            {earnings.canRequestPayout === false ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
                <Clock size={12} /> Cooldown: {earnings.daysRemaining} day(s) left
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                ✓ Payout request open now
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-slate-500 text-sm">Loading history...</div>
        ) : earnings.history.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">No Transactions Yet</h4>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">You haven't earned anything yet. Complete consultations to start earning!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2.5 px-4 sm:px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-2.5 px-4 sm:px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="py-2.5 px-4 sm:px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="py-2.5 px-4 sm:px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                  <th className="py-2.5 px-4 sm:px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnings.history.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 sm:px-5 text-xs sm:text-sm font-medium text-slate-900">
                      {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-xs sm:text-sm font-medium text-slate-900">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        item.type === 'FREE_PROMO' || item.isFree
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.type === 'EARNING'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type === 'FREE_PROMO' || item.isFree ? 'FREE PROMO' : item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-xs sm:text-sm text-slate-600 font-medium">
                      {item.description}
                    </td>
                    <td className={`py-3 px-4 sm:px-5 text-xs sm:text-sm font-bold text-right ${
                      item.type === 'FREE_PROMO' || item.isFree 
                        ? 'text-emerald-600'
                        : item.type === 'EARNING' 
                        ? 'text-green-600' 
                        : 'text-slate-900'
                    }`}>
                      {item.type === 'FREE_PROMO' || item.isFree 
                        ? '₹0.00' 
                        : `${item.type === 'EARNING' ? '+' : '-'}₹${Number(item.amount).toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4 sm:px-5 text-xs sm:text-sm text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
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
