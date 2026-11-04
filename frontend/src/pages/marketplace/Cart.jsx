import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2,
  AlertTriangle, CreditCard, Wallet, Lock, RefreshCw
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';

export default function Cart() {
  const { cart, removeFromCart, clearCart, refreshCart } = useCart();
  const { auth, updateUser } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY' | 'WALLET'
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const walletBalance = auth.user?.walletBalance || 0;
  const hasEnoughWallet = walletBalance >= cart.totalAmount;

  const handleCheckout = async () => {
    if (!auth.token) {
      navigate('/login?redirect=/marketplace/cart');
      return;
    }

    if (cart.items.length === 0) return;

    setProcessing(true);
    setErrorMessage(null);

    try {
      // 1. WALLET CHECKOUT
      if (paymentMethod === 'WALLET') {
        const res = await axios.post(
          getApiUrl('/marketplace/checkout'),
          { paymentMethod: 'WALLET' },
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );

        if (res.data?.success) {
          // Update local wallet balance
          if (updateUser) {
            updateUser({ walletBalance: walletBalance - cart.totalAmount });
          }
          await refreshCart();
          navigate(`/marketplace/order-success/${res.data.order._id}`);
          return;
        } else {
          setErrorMessage(res.data?.message || 'Wallet checkout failed');
          setProcessing(false);
          return;
        }
      }

      // 2. RAZORPAY CHECKOUT
      const res = await axios.post(
        getApiUrl('/marketplace/checkout'),
        { paymentMethod: 'RAZORPAY' },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      if (!res.data?.success) {
        setErrorMessage(res.data?.message || 'Failed to initiate payment');
        setProcessing(false);
        return;
      }

      const { razorpay, order } = res.data;

      // Load Razorpay Script if needed
      const loadScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const loaded = await loadScript();
      if (!loaded) {
        setErrorMessage('Failed to load Razorpay payment gateway. Please check your internet connection.');
        setProcessing(false);
        return;
      }

      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency || 'INR',
        name: 'ExpertHub Marketplace',
        description: `Order #${order.orderNumber} - Digital Products`,
        order_id: razorpay.orderId,
        prefill: {
          name: auth.user?.name || '',
          email: auth.user?.email || '',
          contact: auth.user?.mobile || auth.user?.phone || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: async function (response) {
          try {
            // Verify signature on backend
            const verifyRes = await axios.post(
              getApiUrl('/marketplace/verify-payment'),
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id
              },
              { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            if (verifyRes.data?.success) {
              await refreshCart();
              navigate(`/marketplace/order-success/${order._id}`);
            } else {
              setErrorMessage('Payment verification failed. Please contact support.');
              setProcessing(false);
            }
          } catch (err) {
            setErrorMessage(err.response?.data?.message || 'Payment verification failed');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage(err.response?.data?.message || 'Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 pt-[72px]">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Your Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {cart.items.length} digital item(s) ready for instant delivery
              </p>
            </div>
            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {cart.items.length === 0 ? (
            <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
                <ShoppingBag size={32} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your cart is currently empty</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Discover premium templates, e-books, scripts and tools created by certified experts.
              </p>
              <Link
                to="/marketplace/catalog"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700"
              >
                <span>Browse Digital Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Items List */}
              <div className="lg:col-span-8 space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <img
                        src={item.product?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                        alt={item.product?.title}
                        className="w-16 h-12 object-cover rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/marketplace/products/${item.product?.slug || item.product?._id}`}
                          className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 truncate block"
                        >
                          {item.product?.title}
                        </Link>
                        <span className="text-[11px] text-slate-400 block truncate">
                          By {item.product?.sellerName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <Link
                    to="/marketplace/catalog"
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>← Continue Shopping</span>
                  </Link>
                </div>
              </div>

              {/* Order Summary & Payment Method Selector */}
              <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Order Summary</h3>

                {/* Subtotal breakdown */}
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Items ({cart.items.length})</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{cart.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span className="font-semibold text-emerald-600">₹0 (Included)</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Total Amount</span>
                    <span className="text-lg text-blue-600">₹{cart.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Choose Payment Method
                  </label>

                  {/* Razorpay Option */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'RAZORPAY'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="RAZORPAY"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <CreditCard size={14} className="text-blue-600" />
                        <span>Razorpay Secure Gateway</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">UPI (GPay, PhonePe, Paytm), Cards, NetBanking</p>
                    </div>
                  </label>

                  {/* Wallet Option */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'WALLET'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="WALLET"
                      checked={paymentMethod === 'WALLET'}
                      onChange={() => setPaymentMethod('WALLET')}
                      disabled={!hasEnoughWallet}
                      className="mt-0.5 text-blue-600 disabled:opacity-40"
                    />
                    <div className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Wallet size={14} className="text-purple-600" />
                          <span>ExpertHub Wallet</span>
                        </span>
                        <span className={`text-[11px] font-extrabold ${hasEnoughWallet ? 'text-emerald-600' : 'text-slate-400'}`}>
                          Bal: ₹{walletBalance}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {hasEnoughWallet
                          ? 'Instant 1-click deduction from your wallet'
                          : 'Insufficient balance. Please recharge or pay via Razorpay.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Checkout Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={processing || (paymentMethod === 'WALLET' && !hasEnoughWallet)}
                  className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Complete Payment (₹{cart.totalAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>256-bit encrypted checkout. Instant digital delivery.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

