import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, AlertCircle, Loader2, X, Gift, Wallet, Sparkles, CreditCard, Heart } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

/**
 * ReviewForm modal/component for reviewing an eligible completed consultation.
 * Supports sending an optional monetary gift/tip to the expert with wallet or payment.
 * Automatically hidden on free consultations.
 *
 * @param {Object} props
 * @param {string} props.consultationId - Required completed consultation ID
 * @param {string} props.expertName - Expert's display name
 * @param {string} props.consultationType - e.g. 'Video', 'Audio', 'Chat'
 * @param {boolean} [props.isFree] - Whether the consultation was a free call/chat
 * @param {function} props.onSuccess - Callback triggered after review confirms persistence
 * @param {function} props.onClose - Callback to close/cancel the review modal
 */
export default function ReviewForm({
  consultationId,
  reviewId,
  expertName,
  consultationType = 'Consultation',
  isFree,
  isEditing = false,
  initialRating = 5,
  initialFeedback = '',
  onSuccess,
  onClose
}) {
  // Initial form values as per requirement: Rating 5/5 stars or existing rating
  const [rating, setRating] = useState(initialRating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Free consultation & gift states
  const [isFreeSession, setIsFreeSession] = useState(isFree !== undefined ? Boolean(isFree) : false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Gift selection
  const [selectedGift, setSelectedGift] = useState(0);
  const [customGiftInput, setCustomGiftInput] = useState('');
  const [showCustomGift, setShowCustomGift] = useState(false);
  const [giftSent, setGiftSent] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const ratingDescriptions = {
    1: 'Poor experience',
    2: 'Fair consultation',
    3: 'Good advice',
    4: 'Very helpful & knowledgeable',
    5: 'Excellent guidance!'
  };

  const giftPresets = [
    { amount: 0, label: 'No Gift', icon: '⭐' },
    { amount: 21, label: 'Shagun', icon: '💐' },
    { amount: 51, label: 'Chai & Thanks', icon: '☕' },
    { amount: 101, label: 'Blessing', icon: '🍫' },
    { amount: 251, label: 'Gratitude', icon: '🏆' },
    { amount: 501, label: 'Royal Gift', icon: '👑' }
  ];

  // Load consultation details to authoritatively verify if session was free, and fetch wallet balance
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch user wallet balance
        axios
          .get(getApiUrl('/wallet'), { headers })
          .then((res) => {
            if (isMounted && res.data?.balance !== undefined) {
              setWalletBalance(Number(res.data.balance) || 0);
            }
          })
          .catch(() => {});

        // 2. Authoritative check on consultation if isFree wasn't explicitly passed
        if (consultationId) {
          const consultRes = await axios.get(getApiUrl(`/bookings/${consultationId}`), { headers });
          if (isMounted && consultRes.data) {
            const c = consultRes.data;
            const free = Boolean(c.isFree || c.cost === 0);
            setIsFreeSession(free);
          }
        }
      } catch (err) {
        // Fallback to prop value
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [consultationId, isFree]);

  const effectiveGiftAmount = showCustomGift ? Math.max(0, Number(customGiftInput) || 0) : selectedGift;
  const shortfall = Math.max(0, effectiveGiftAmount - walletBalance);

  // Handle instant recharge & gift payment via Razorpay when wallet has shortfall
  const handleRechargeAndPayGift = async () => {
    if (effectiveGiftAmount <= 0) return;
    setIsProcessingPayment(true);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('Authentication required. Please login again.');
        setIsProcessingPayment(false);
        return;
      }

      // Amount to recharge: at least the shortfall amount (minimum ₹1)
      const rechargeAmount = Math.max(shortfall, 1);

      // 1. Create topup order
      const orderRes = await axios.post(
        getApiUrl('/wallet/add-money'),
        { amount: rechargeAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderData = orderRes.data;

      // 2. Open Razorpay Checkout modal
      if (!window.Razorpay) {
        throw new Error('Payment gateway SDK is loading. Please try again.');
      }

      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'ExpertHub Consultation Gift',
        description: `Gift of ₹${effectiveGiftAmount} to ${expertName || 'Expert'}`,
        order_id: orderData.orderId,
        handler: async function (paymentResponse) {
          try {
            // Verify payment
            const verifyRes = await axios.post(
              getApiUrl('/wallet/verify-payment'),
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const newBalance = Number(verifyRes.data?.balance) || walletBalance + rechargeAmount;
            setWalletBalance(newBalance);

            // Send gift now that balance is updated
            await axios.post(
              getApiUrl(`/bookings/${consultationId}/gift`),
              { amount: effectiveGiftAmount },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            setGiftSent(true);
            setWalletBalance(Math.max(0, newBalance - effectiveGiftAmount));
            setSuccessMessage(`₹${effectiveGiftAmount} Gift successfully sent to ${expertName || 'your expert'}! 🎁`);
          } catch (verErr) {
            console.error('Gift payment verification failed:', verErr);
            setErrorMessage(verErr.response?.data?.message || 'Payment verification failed. Please try again.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (err) {
        setErrorMessage(err.error?.description || 'Payment failed or was cancelled.');
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Recharge and gift error:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to start payment gateway.');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isProcessingPayment) return;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setErrorMessage('Please select a valid rating between 1 and 5 stars.');
      return;
    }

    if (!consultationId) {
      setErrorMessage('Invalid consultation. Missing consultation ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage('You must be logged in to submit a review.');
        setIsSubmitting(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // If user selected a gift on a paid session and haven't sent it yet
      let giftSuccess = giftSent;
      if (!isFreeSession && effectiveGiftAmount > 0 && !giftSent) {
        // If balance is insufficient, prevent submit and prompt recharge
        if (walletBalance < effectiveGiftAmount) {
          setErrorMessage(
            `Insufficient wallet balance to send ₹${effectiveGiftAmount} gift (Current: ₹${walletBalance}). Please use the 'Pay via UPI' button below.`
          );
          setIsSubmitting(false);
          return;
        }

        try {
          const giftRes = await axios.post(
            getApiUrl(`/bookings/${consultationId}/gift`),
            { amount: effectiveGiftAmount },
            { headers }
          );
          if (giftRes.data?.success) {
            giftSuccess = true;
            setGiftSent(true);
            if (giftRes.data.newWalletBalance !== undefined) {
              setWalletBalance(giftRes.data.newWalletBalance);
            }
          }
        } catch (giftErr) {
          setErrorMessage(giftErr.response?.data?.message || 'Failed to send gift. You can submit review without gift.');
          setIsSubmitting(false);
          return;
        }
      }

      // Submit or update the review
      let response;
      if (isEditing) {
        const targetId = reviewId || consultationId;
        response = await axios.put(
          getApiUrl(`/reviews/${targetId}`),
          {
            rating,
            feedback: feedback.trim()
          },
          { headers }
        );
      } else {
        response = await axios.post(
          getApiUrl('/reviews'),
          {
            consultationId,
            rating,
            feedback: feedback.trim()
          },
          { headers }
        );
      }

      if (response.data?.success) {
        const giftNotice = giftSuccess && effectiveGiftAmount > 0 ? ` & ₹${effectiveGiftAmount} gift sent! 🎁` : '!';
        const msg = isEditing ? 'Review updated successfully! ⭐' : `Thank you! Your review${giftNotice}`;
        setSuccessMessage(msg);

        if (onSuccess) {
          onSuccess(response.data);
        }

        setTimeout(() => {
          if (onClose) onClose();
        }, 1400);
      } else {
        setErrorMessage(response.data?.message || (isEditing ? 'Failed to update review.' : 'Failed to submit review.'));
      }
    } catch (err) {
      console.error('Review submission error:', err);
      const serverMsg = err.response?.data?.message;
      if (err.response?.status === 409) {
        setErrorMessage(serverMsg || 'A review has already been submitted for this consultation.');
      } else if (err.response?.status === 403) {
        setErrorMessage('You are not authorized to review this consultation.');
      } else if (err.response?.status === 400) {
        setErrorMessage(serverMsg || 'Consultation is not eligible for review.');
      } else {
        setErrorMessage(serverMsg || 'Server error occurred while saving your review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative border border-slate-100 my-auto">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            disabled={isSubmitting || isProcessingPayment}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-2.5 shadow-inner">
            <Star size={26} className="fill-amber-400 text-amber-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Your Review' : 'Rate Your Experience'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
            {isEditing ? (
              <>Update your rating and consultation feedback for <span className="font-bold text-slate-800">{expertName || 'your expert'}</span>.</>
            ) : (
              <>How was your {consultationType.toLowerCase()} session with <span className="font-bold text-slate-800">{expertName || 'your expert'}</span>?</>
            )}
          </p>
        </div>

        {/* Success State Notification */}
        {successMessage ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-emerald-900">
              {isEditing ? 'Review Updated' : 'Review Submitted'}
            </h3>
            <p className="text-sm text-emerald-700 mt-1">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2 text-rose-700 text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive 1-5 Star Rating Selection */}
            <div className="text-center">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Rating
              </label>
              <div
                className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-50 border border-slate-100"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      disabled={isSubmitting || isProcessingPayment}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125 active:scale-95 disabled:hover:scale-100 cursor-pointer"
                      aria-label={`${starValue} Star`}
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-semibold text-amber-600 mt-1.5">
                {ratingDescriptions[hoverRating || rating]} ({hoverRating || rating}/5)
              </p>
            </div>

            {/* Feedback / Review Textarea */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Feedback & Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmitting || isProcessingPayment}
                maxLength={2000}
                rows={3}
                placeholder="Share your experience to help others and give feedback to the expert..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5 px-1">
                <span>Verified review</span>
                <span>{feedback.length} / 2000</span>
              </div>
            </div>

            {/* SEND GIFT / TIP SECTION (EXCLUDED ON FREE CONSULTATIONS AND EDIT MODE) */}
            {!isFreeSession && !isEditing && (
              <div className="p-3.5 sm:p-4 rounded-2xl border border-pink-200/80 bg-gradient-to-br from-pink-50/60 via-amber-50/30 to-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-pink-100 text-pink-600">
                      <Gift size={16} />
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Send Gift / Dakshina (दक्षिणा)</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                          Optional
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Show appreciation for {expertName || 'the expert'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
                    <Wallet size={12} className="text-emerald-600" />
                    <span>₹{walletBalance.toFixed(0)}</span>
                  </div>
                </div>

                {/* Gift Presets */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {giftPresets.map((opt) => {
                    const isSelected = !showCustomGift && selectedGift === opt.amount;
                    return (
                      <button
                        key={opt.amount}
                        type="button"
                        disabled={isSubmitting || isProcessingPayment || giftSent}
                        onClick={() => {
                          setShowCustomGift(false);
                          setSelectedGift(opt.amount);
                        }}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-pink-600 text-white border-pink-600 shadow-md scale-105'
                            : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-pink-50/50 hover:border-pink-300'
                        }`}
                      >
                        <span className="text-base leading-none mb-0.5">{opt.icon}</span>
                        <span className="text-[11px] font-black">
                          {opt.amount === 0 ? 'None' : `₹${opt.amount}`}
                        </span>
                        <span
                          className={`text-[9px] truncate max-w-full px-0.5 ${
                            isSelected ? 'text-pink-100' : 'text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Gift toggle & input */}
                <div className="pt-1">
                  {!showCustomGift ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomGift(true);
                        setSelectedGift(0);
                      }}
                      className="text-[11px] text-pink-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      <span>Enter Custom Gift Amount / अन्य राशि</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="50000"
                          value={customGiftInput}
                          onChange={(e) => setCustomGiftInput(e.target.value)}
                          placeholder="Enter amount (e.g. 151)"
                          className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-pink-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomGift(false);
                          setCustomGiftInput('');
                          setSelectedGift(0);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        title="Cancel custom amount"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Wallet Balance & Instant Recharge info */}
                {effectiveGiftAmount > 0 && (
                  <div className="pt-2 border-t border-pink-200/60">
                    {walletBalance >= effectiveGiftAmount ? (
                      <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-600" />
                          <span>Will be deducted from Wallet</span>
                        </span>
                        <span>₹{effectiveGiftAmount}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <div>
                          <p className="font-bold text-amber-800">
                            Shortfall: ₹{shortfall} (Wallet: ₹{walletBalance.toFixed(0)})
                          </p>
                          <p className="text-[10px] text-amber-600">
                            Pay directly via UPI/Cards to send this gift
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={isProcessingPayment}
                          onClick={handleRechargeAndPayGift}
                          className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              <span>Opening UPI...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={12} />
                              <span>Pay ₹{shortfall} via UPI</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2.5 sm:gap-3 pt-1">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isProcessingPayment}
                  className="flex-1 py-3 px-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isProcessingPayment}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>
                    {isEditing
                      ? 'Save & Update Review'
                      : effectiveGiftAmount > 0 && !giftSent
                        ? `Submit & Gift ₹${effectiveGiftAmount} 🎁`
                        : 'Submit Review'}
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
