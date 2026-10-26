import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../components/UserLayout';
import { CreditCard, History, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw, Wallet } from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';

function WalletRecharge() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [addingMoney, setAddingMoney] = useState(false);
  const [error, setError] = useState('');

  const quickAmounts = [100, 500, 1000];

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
        theme: { color: '#2563eb' }
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
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

  return (
    <UserLayout title="My Wallet" subtitle="Manage your funds and transactions">
      <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-4xl mx-auto pb-6">
        
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Balance Card */}
          <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-sm border border-border-color flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/50 block">Wallet</span>
                  <span className="text-xs sm:text-sm font-bold text-on-surface">Available Balance</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">₹{balance.toFixed(2)}</div>
              <p className="text-on-surface/60 mt-1 text-xs font-medium">Can be used for booking consultations</p>
            </div>
          </div>

          {/* Add Money Card */}
          <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-sm border border-border-color flex flex-col justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-on-surface mb-0.5">Add Money</h3>
              <p className="text-xs sm:text-sm text-on-surface/60 mb-3">Top up your wallet securely</p>
              
              {error && <div className="text-red-500 text-xs sm:text-sm mb-2.5 font-medium bg-red-50 dark:bg-red-950/30 p-2 rounded">{error}</div>}

              <div className="flex gap-2 mb-3">
                {quickAmounts.map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => handleAddMoney(amt)}
                    disabled={addingMoney}
                    className="flex-1 py-1.5 sm:py-2 rounded-lg bg-surface-muted hover:bg-surface-light text-on-surface font-bold hover:scale-[1.02] active:scale-[0.98] transition-all text-xs sm:text-sm disabled:opacity-50 border border-border-color hover:border-primary/40"
                  >
                    +₹{Number(amt).toFixed(2)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface/50 font-bold text-sm">₹</span>
                <input 
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full pl-7 pr-3.5 py-2 sm:py-2.5 rounded-lg border border-border-color bg-surface-muted focus:bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium text-on-surface text-sm"
                  disabled={addingMoney}
                />
              </div>
            </div>
            
            <button 
              onClick={() => handleAddMoney(parseFloat(customAmount))}
              disabled={addingMoney || !customAmount}
              className="w-full mt-3 bg-primary text-background font-bold py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              <Plus size={16} />
              {addingMoney ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-surface rounded-xl p-4 sm:p-5 shadow-sm border border-border-color">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-on-surface/80" />
            <h2 className="text-base sm:text-lg font-bold text-on-surface">Transaction History</h2>
          </div>

          {loading ? (
            <div className="text-center py-6 text-on-surface/60 text-sm">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-on-surface/50 flex flex-col items-center">
              <RefreshCcw size={28} className="mb-2 opacity-20" />
              <p className="text-xs sm:text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {transactions.map(tx => {
                const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND';
                const Icon = isCredit ? ArrowUpRight : ArrowDownRight;
                const iconColor = tx.status === 'FAILED' ? 'text-red-500' : isCredit ? 'text-emerald-500' : 'text-rose-500';
                const bgColor = tx.status === 'FAILED' ? 'bg-red-50' : isCredit ? 'bg-emerald-50' : 'bg-rose-50';

                return (
                  <div key={tx._id} className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border-color hover:bg-surface-light transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                        <Icon size={16} className={iconColor} />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-on-surface">
                          {tx.type === 'CREDIT' ? 'Wallet Top-up' : tx.type === 'DEBIT' ? 'Consultation Booking' : 'Refund'}
                        </h4>
                        <p className="text-[11px] text-on-surface/60 mt-0.5">
                          {new Date(tx.createdAt).toLocaleString()} 
                          {tx.status === 'FAILED' && <span className="text-red-500 ml-2 font-semibold">Failed</span>}
                          {tx.status === 'PENDING' && <span className="text-orange-500 ml-2 font-semibold">Pending</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm sm:text-base font-extrabold ${iconColor}`}>
                        {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </div>
                      {tx.status === 'SUCCESS' && (
                        <div className="text-[10px] sm:text-xs text-on-surface/50 font-medium mt-0.5">
                          Bal: ₹{Number(tx.balanceAfter).toFixed(2)}
                        </div>
                      )}
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

export default WalletRecharge;
