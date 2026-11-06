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
  ArrowDown,
  Tag,
  Gift,
  CheckCircle2,
  Sparkles,
  Ticket,
  Copy,
  Check
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

  // Dynamic Coupons & Vouchers state
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponMsg, setCouponMsg] = useState(null);

  // Direct Voucher Redemption state
  const [voucherInput, setVoucherInput] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherMsg, setVoucherMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

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

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl('/wallet/coupons'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
      }
    } catch (e) {
      console.error('Failed to load offers:', e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchCoupons();
  }, []);

  const handleApplyCouponCode = async (codeToApply, amountToUse) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponMsg({ type: 'error', text: 'Please enter a coupon code.' });
      return;
    }
    const amt = parseFloat(amountToUse || customAmount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setCouponMsg({ type: 'error', text: 'Please enter a recharge amount first.' });
      return;
    }

    try {
      setApplyingCoupon(true);
      setCouponMsg(null);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        getApiUrl('/wallet/apply-coupon'),
        { code, amount: amt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponMsg({ type: 'success', text: res.data.message });
        setCouponInput(res.data.coupon.code);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMsg({ type: 'error', text: err.response?.data?.message || 'Failed to apply coupon.' });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSelectCoupon = async (c) => {
    let amt = parseFloat(customAmount);
    if (!amt || amt < (c.minRechargeAmount || 0)) {
      amt = c.minRechargeAmount > 0 ? c.minRechargeAmount : 500;
      setCustomAmount(amt.toString());
    }
    setCouponInput(c.code);
    await handleApplyCouponCode(c.code, amt);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
  };

  const handleRedeemVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherMsg({ type: 'error', text: 'Please enter your voucher code.' });
      return;
    }

    try {
      setRedeemingVoucher(true);
      setVoucherMsg(null);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        getApiUrl('/wallet/redeem-voucher'),
        { code },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setVoucherMsg({ type: 'success', text: res.data.message });
        setBalance(res.data.balance);
        setVoucherInput('');
        fetchWalletData();
        fetchCoupons();
      }
    } catch (err) {
      setVoucherMsg({ type: 'error', text: err.response?.data?.message || 'Failed to redeem voucher.' });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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

      // 1. Create Order (with optional applied coupon)
      const orderRes = await axios.post(
        getApiUrl('/wallet/add-money'),
        { amount, couponCode: appliedCoupon?.code },
        { headers }
      );

      const orderData = orderRes.data;

      // 2. Open Razorpay
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YourTestKey',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ExpertHub Wallet',
        description: appliedCoupon ? `Wallet Top-up (+Bonus with ${appliedCoupon.code})` : 'Wallet Top-up',
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

            if (verifyRes.data.success || verifyRes.data.balance !== undefined) {
              setBalance(verifyRes.data.balance);
              fetchWalletData(); // Refresh tx list
              setCustomAmount('');
              if (appliedCoupon) {
                setCouponMsg({
                  type: 'success',
                  text: `Recharge successful! ₹${appliedCoupon.bonusAmount} extra bonus was credited to your wallet.`
                });
                setAppliedCoupon(null);
                setCouponInput('');
              }
              fetchCoupons();
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

              {/* Promo / Coupon Code Input within Add Money */}
              <div className="mb-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponMsg) setCouponMsg(null);
                      }}
                      placeholder="Coupon / Promo code"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 font-bold uppercase tracking-wider focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                      disabled={addingMoney || applyingCoupon}
                    />
                  </div>
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleApplyCouponCode()}
                      disabled={!couponInput.trim() || applyingCoupon}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>

                {/* Coupon Feedback Message */}
                {couponMsg && (
                  <p className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${
                    couponMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {couponMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : '✕ '}
                    {couponMsg.text}
                  </p>
                )}

                {/* Applied Bonus Breakdown Badge */}
                {appliedCoupon && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800">Coupon '{appliedCoupon.code}' Active</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Pay ₹{appliedCoupon.rechargeAmount} → Get <strong className="text-emerald-900 font-extrabold">₹{appliedCoupon.totalCredit}</strong> in wallet (+₹{appliedCoupon.bonusAmount} bonus)
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wide">
                      +₹{appliedCoupon.bonusAmount} Extra
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Proceed to Pay Button */}
            <button 
              onClick={() => handleAddMoney(parseFloat(customAmount))}
              disabled={addingMoney || !customAmount || parseFloat(customAmount) <= 0}
              className="w-full py-3 bg-[#F5B52E] hover:bg-[#eab308] text-slate-900 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <span>
                {addingMoney
                  ? 'Processing...'
                  : appliedCoupon
                  ? `+ Proceed to Pay ₹${customAmount} (Get ₹${appliedCoupon.totalCredit})`
                  : '+ Proceed to Pay'}
              </span>
            </button>
          </div>

        </div>

        {/* Dynamic Offers, Coupons & Gift Vouchers Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card: Recharge Coupons & Offers (spans 2 columns on desktop) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">Recharge Coupons & Offers</h3>
                    <p className="text-[11px] text-slate-400">Apply a coupon code to get extra wallet bonus</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchCoupons}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <RefreshCcw className={`w-3 h-3 ${loadingCoupons ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Coupons List */}
              {loadingCoupons ? (
                <div className="text-center py-6 text-slate-400 text-xs">Loading offers...</div>
              ) : coupons.filter(c => c.type !== 'VOUCHER').length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No active recharge offers at the moment.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {coupons.filter(c => c.type !== 'VOUCHER').map((c) => {
                    const isApplied = appliedCoupon?.code === c.code;
                    return (
                      <div
                        key={c._id}
                        className={`p-3.5 rounded-xl border border-dashed transition-all relative flex flex-col justify-between ${
                          isApplied
                            ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                            : 'bg-slate-50/70 border-slate-200 hover:border-amber-400 hover:bg-amber-50/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-extrabold text-xs text-slate-900 tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                              {c.code}
                            </span>
                            {c.badge && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {c.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800">{c.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{c.description}</p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                          <span className="text-slate-400 font-medium">
                            {c.minRechargeAmount > 0 ? `Min. ₹${c.minRechargeAmount}` : 'No min. recharge'}
                          </span>
                          {isApplied ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Applied
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectCoupon(c)}
                              className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                            >
                              Apply Code →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card: Direct Gift Voucher Redemption */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-amber-50 rounded-2xl border border-amber-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Redeem Voucher</h3>
                  <p className="text-[11px] text-slate-500">Claim free recharge balance directly</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-2 mb-3">
                Have a gift code or promotional voucher? Enter it below to claim instant balance into your wallet without payment.
              </p>

              {/* Voucher Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => {
                    setVoucherInput(e.target.value.toUpperCase());
                    if (voucherMsg) setVoucherMsg(null);
                  }}
                  placeholder="Enter Voucher Code (e.g. GIFT100)"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800 uppercase tracking-wider placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  disabled={redeemingVoucher}
                />

                <button
                  type="button"
                  onClick={handleRedeemVoucher}
                  disabled={redeemingVoucher || !voucherInput.trim()}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{redeemingVoucher ? 'Redeeming...' : 'Claim to Wallet'}</span>
                </button>
              </div>

              {voucherMsg && (
                <div className={`mt-3 p-2.5 rounded-xl text-xs font-semibold ${
                  voucherMsg.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {voucherMsg.text}
                </div>
              )}
            </div>

            {/* Hint about GIFT100 */}
            <div className="mt-4 pt-3 border-t border-amber-200/70 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Try sample code:</span>
              <button
                type="button"
                onClick={() => {
                  setVoucherInput('GIFT100');
                  if (voucherMsg) setVoucherMsg(null);
                }}
                className="font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded hover:bg-amber-300 transition"
              >
                GIFT100
              </button>
            </div>
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

