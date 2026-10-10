import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UserLayout from '../components/UserLayout';
import { CreditCard, History, Plus, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

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
        axios.get('http://localhost:5000/api/wallet', { headers }),
        axios.get('http://localhost:5000/api/wallet/transactions', { headers })
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
        'http://localhost:5000/api/wallet/add-money',
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
              'http://localhost:5000/api/wallet/verify-payment',
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
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-10">
        
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg text-background relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-surface/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={24} className="text-blue-200" />
                  <span className="text-blue-100 font-medium">Available Balance</span>
                </div>
                <span className="bg-surface/20 px-3 py-1 rounded-full text-xs font-bold text-background backdrop-blur-md">Verified</span>
              </div>
              <div>
                <div className="text-5xl font-extrabold tracking-tight">₹{balance.toFixed(2)}</div>
                <p className="text-blue-200 mt-2 text-sm">Can be used for booking consultations</p>
              </div>
            </div>
          </div>

          {/* Add Money Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border-color flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-1">Add Money</h3>
              <p className="text-sm text-on-surface/60 mb-4">Top up your wallet securely</p>
              
              {error && <div className="text-red-500 text-sm mb-3 font-medium bg-red-50 p-2 rounded">{error}</div>}

              <div className="flex gap-2 mb-4">
                {quickAmounts.map(amt => (
                  <button 
                    key={amt} 
                    onClick={() => handleAddMoney(amt)}
                    disabled={addingMoney}
                    className="flex-1 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm disabled:opacity-50 border border-blue-100"
                  >
                    +₹{Number(amt).toFixed(2)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/50 font-bold">₹</span>
                <input 
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-border-color focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium text-on-surface"
                  disabled={addingMoney}
                />
              </div>
            </div>
            
            <button 
              onClick={() => handleAddMoney(parseFloat(customAmount))}
              disabled={addingMoney || !customAmount}
              className="w-full mt-4 bg-primary text-background font-bold py-3 rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {addingMoney ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border-color">
          <div className="flex items-center gap-2 mb-6">
            <History size={20} className="text-on-surface/80" />
            <h2 className="text-lg font-bold text-on-surface">Transaction History</h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-on-surface/60">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-on-surface/50 flex flex-col items-center">
              <RefreshCcw size={32} className="mb-3 opacity-20" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map(tx => {
                const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND';
                const Icon = isCredit ? ArrowUpRight : ArrowDownRight;
                const iconColor = tx.status === 'FAILED' ? 'text-red-500' : isCredit ? 'text-emerald-500' : 'text-rose-500';
                const bgColor = tx.status === 'FAILED' ? 'bg-red-50' : isCredit ? 'bg-emerald-50' : 'bg-rose-50';

                return (
                  <div key={tx._id} className="flex items-center justify-between p-4 rounded-xl border border-border-color hover:bg-surface-light transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">
                          {tx.type === 'CREDIT' ? 'Wallet Top-up' : tx.type === 'DEBIT' ? 'Consultation Booking' : 'Refund'}
                        </h4>
                        <p className="text-xs text-on-surface/60 mt-0.5">
                          {new Date(tx.createdAt).toLocaleString()} 
                          {tx.status === 'FAILED' && <span className="text-red-500 ml-2 font-semibold">Failed</span>}
                          {tx.status === 'PENDING' && <span className="text-orange-500 ml-2 font-semibold">Pending</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-extrabold ${iconColor}`}>
                        {isCredit ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                      </div>
                      {tx.status === 'SUCCESS' && (
                        <div className="text-xs text-on-surface/50 font-medium mt-0.5">
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
