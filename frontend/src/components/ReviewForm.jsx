import React, { useState } from 'react';
import { Star, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import axios from 'axios';

/**
 * ReviewForm modal/component for reviewing an eligible completed consultation.
 *
 * @param {Object} props
 * @param {string} props.consultationId - Required completed consultation ID
 * @param {string} props.expertName - Expert's display name
 * @param {string} props.consultationType - e.g. 'Video', 'Audio', 'Chat'
 * @param {function} props.onSuccess - Callback triggered after backend confirms persistence with updated review & stats
 * @param {function} props.onClose - Callback to close/cancel the review modal
 */
export default function ReviewForm({
  consultationId,
  expertName,
  consultationType = 'Consultation',
  onSuccess,
  onClose
}) {
  // Initial form values as per requirement: Rating 5/5 stars
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const ratingDescriptions = {
    1: 'Poor experience',
    2: 'Fair consultation',
    3: 'Good advice',
    4: 'Very helpful & knowledgeable',
    5: 'Excellent guidance!'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions while in flight

    // Client-side validation: integer between 1 and 5
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

      // Connect form submit to real backend endpoint
      const response = await axios.post(
        'https://astrotalk-hlg2.onrender.com/api/reviews',
        {
          consultationId,
          rating,
          feedback: feedback.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        setSuccessMessage('Thank you! Your review has been submitted successfully.');
        // Call onSuccess with the response payload so caller can refresh expert review list/ratings
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Auto-close after brief confirmation if onClose provided
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        setErrorMessage(response.data?.message || 'Failed to submit review.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 overflow-hidden">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Star size={28} className="fill-amber-400 text-amber-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rate Your Experience</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            How was your {consultationType.toLowerCase()} session with{' '}
            <span className="font-bold text-slate-800">{expertName || 'your expert'}</span>?
          </p>
        </div>

        {/* Success State Notification */}
        {successMessage ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-emerald-900">Review Submitted</h3>
            <p className="text-sm text-emerald-700 mt-1">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Interactive 1-5 Star Rating Selection */}
            <div className="text-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Your Rating
              </label>
              <div
                className="inline-flex items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-100"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-125 active:scale-95 disabled:hover:scale-100"
                      aria-label={`${starValue} Star`}
                    >
                      <Star
                        size={32}
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
              <p className="text-xs font-semibold text-amber-600 mt-2">
                {ratingDescriptions[hoverRating || rating]} ({hoverRating || rating}/5)
              </p>
            </div>

            {/* Feedback / Review Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Feedback & Review Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                disabled={isSubmitting}
                maxLength={2000}
                rows={4}
                placeholder="Share your thoughts about this consultation to help others and give feedback to the expert..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 px-1">
                <span>Safe & verified client review</span>
                <span>{feedback.length} / 2000</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 px-4 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
