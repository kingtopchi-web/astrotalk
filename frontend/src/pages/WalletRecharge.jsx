import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../components/UserLayout';
import { 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Wallet,
  ChevronDown,
  ArrowDown
} from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';

function WalletRecharge() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [addingMoney, setAddingMoney] = useState(false);
  const [error, setError] = useState('');
  const [txFilter, setTxFilter] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const addMoneyInputRef = useRef(null);
  const historySectionRef = useRef(null);
  const filterDropdownRef = useRef(null);

  const quickAmounts = [100, 500, 1000];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [balRes, txRes] = await Promise.all([
        axios.get(getApiUrl('/wallet'), { headers }),
        axios.get(getApiUrl('/wallet/transactions'), { headers })
      ]);
      
      setBalance(balRes.data.balance || 0);
      setTransactions(txRes.data.transactions || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch wallet details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleScrollToAddMoney = () => {
    addMoneyInputRef.current?.focus();
    addMoneyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleScrollViewHistory = () => {
    historySectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddMoney = async (amountToAdd) => {
    const amount = amountToAdd || parseFloat(customAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      setAddingMoney(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create Order
      const orderRes = await axios.post(
        getApiUrl('/wallet/add-money'),
        { amount },
        { headers }
      );

      const orderData = orderRes.data;

      // 2. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.keyId || 'rzp_test_YourTestKey',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ExpertHub Wallet',
        description: 'Wallet Top-up',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const verifyRes = await axios.post(
              getApiUrl('/wallet/verify-payment'),
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              { headers }
            );

            if (verifyRes.data.success) {
              setBalance(verifyRes.data.balance);
              fetchWalletData(); // Refresh tx list
              setCustomAmount('');
            }
          } catch (err) {
            console.error(err);
            setError('Payment verification failed.');
            fetchWalletData();
          }
        },
        theme: { color: '#F5B52E' }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setError('Payment failed or cancelled.');
        fetchWalletData();
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setAddingMoney(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'CREDIT') return tx.type === 'CREDIT' || tx.type === 'REFUND';
    if (txFilter === 'DEBIT') return tx.type === 'DEBIT';
    return true;
  });

  return (
    <UserLayout title="My Wallet" subtitle="Manage your funds and transactions">
      <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto pb-10">
        
        {/* Top Cards: Available Balance & Add Money */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          
          {/* Card 1: Available Balance */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              {/* Header: Icon, Available Balance, Active Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-[#D97706]" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      AVAILABLE BALANCE
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      Wallet Balance
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Active
                </span>
              </div>

              {/* Big Balance */}
              <div className="my-3 sm:my-4">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                  ₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">Available for consultations</p>
              </div>
            </div>

            {/* Bottom Button Row */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleScrollToAddMoney}
                className="py-2.5 px-4 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs sm:text-sm flex-1 text-center transition-all cursor-pointer active:scale-98"
              >
                Add money
              </button>
              <button
                type="button"
                onClick={handleScrollViewHistory}
                className="py-2.5 px-4 rounded-xl bg-[#FEF3C7]/90 hover:bg-[#FEF3C7] text-[#92400E] font-semibold text-xs sm:text-sm flex-1 text-center transition-all cursor-pointer active:scale-98"
              >
                View history
              </button>
            </div>
          </div>

          {/* Card 2: Add Money */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Add Money</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 mb-3.5">Top up your wallet securely</p>
              
              {error && (
                <div className="text-red-600 text-xs sm:text-sm mb-3 font-medium bg-red-50 border border-red-100 p-2.5 rounded-xl">
                  {error}
                </div>
              )}

              {/* Quick Select Buttons */}
              <div className="flex gap-2.5 mb-3">
                {quickAmounts.map(amt => (
                  <button 
                    key={amt} 
                    type="button"
                    onClick={() => {
                      setCustomAmount(amt.toString());
                      setError('');
                    }}
                    disabled={addingMoney}
                    className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border text-center cursor-pointer ${
                      customAmount === amt.toString()
                        ? 'bg-white border-[#F5B52E] text-slate-900 shadow-xs ring-1 ring-[#F5B52E]/40'
                        : 'bg-slate-50/90 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative mb-3">
                <input 
                  ref={addMoneyInputRef}
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="₹ Enter custom amount"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/90 text-slate-800 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-all font-medium"
                  disabled={addingMoney}
                />
              </div>
            </div>
            
            {/* Proceed to Pay Button */}
            <button 
              onClick={() => handleAddMoney(parseFloat(customAmount))}
              disabled={addingMoney || !customAmount || parseFloat(customAmount) <= 0}
              className="w-full py-3 bg-[#F5B52E] hover:bg-[#eab308] text-slate-900 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <span>{addingMoney ? 'Processing...' : '+ Proceed to Pay'}</span>
            </button>
          </div>

        </div>

        {/* Transaction History Card */}
        <div ref={historySectionRef} id="transaction-history" className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History size={19} className="text-slate-800" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Transaction History</h2>
            </div>

            {/* Filter Dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="text-xs font-semibold text-slate-600 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 px-3 py-1.5 rounded-xl inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>
                  {txFilter === 'ALL' ? 'All transactions' : txFilter === 'CREDIT' ? 'Recharges only' : 'Bookings only'}
                </span>
                <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { setTxFilter('ALL'); setIsFilterOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 transition-colors ${txFilter === 'ALL' ? 'text-amber-600 font-bold' : 'text-slate-700'}`}
                  >
                    All transactions
                  </button>
                  <button 
                    onClick={() => { setTxFilter('CREDIT'); setIsFilterOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 transition-colors ${txFilter === 'CREDIT' ? 'text-amber-600 font-bold' : 'text-slate-700'}`}
                  >
                    Recharges only
                  </button>
                  <button 
                    onClick={() => { setTxFilter('DEBIT'); setIsFilterOpen(false); }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 transition-colors ${txFilter === 'DEBIT' ? 'text-amber-600 font-bold' : 'text-slate-700'}`}
                  >
                    Bookings only
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center">
              <RefreshCcw size={32} className="mb-2.5 opacity-20" />
              <p className="text-xs sm:text-sm font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTransactions.map(tx => {
                const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND';
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                const iconColor = tx.status === 'FAILED' ? 'text-red-500' : isCredit ? 'text-emerald-600' : 'text-rose-500';
                const bgColor = tx.status === 'FAILED' ? 'bg-red-50' : isCredit ? 'bg-emerald-50' : 'bg-rose-50';

                return (
                  <div key={tx._id} className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                        <Icon size={18} className={iconColor} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {tx.type === 'CREDIT' ? 'Wallet Recharge' : tx.type === 'DEBIT' ? 'Consultation Booking' : 'Refund'}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {tx.status === 'FAILED' && <span className="text-red-500 ml-2 font-semibold">Failed</span>}
                          {tx.status === 'PENDING' && <span className="text-amber-500 ml-2 font-semibold">Pending</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs sm:text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? '+' : '−'}₹{Number(tx.amount).toFixed(2)}
                      </div>
                      {tx.balanceAfter !== undefined && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Balance ₹{Number(tx.balanceAfter).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Scroll / Down indicator */}
              <div className="pt-2 flex justify-center">
                <div className="w-8 h-8 rounded-full border border-slate-200/80 bg-white shadow-2xs flex items-center justify-center text-slate-400">
                  <ArrowDown size={14} />
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </UserLayout>
  );
}

export default WalletRecharge;

