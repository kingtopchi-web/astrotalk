import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Star,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

const STATUS_CONFIG = {
  PUBLISHED: {
    label: 'Published',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    dotClass: 'bg-emerald-500'
  },
  HIDDEN: {
    label: 'Hidden from Public',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: EyeOff,
    dotClass: 'bg-rose-500'
  },
  FLAGGED: {
    label: 'Flagged / Review Needed',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
    dotClass: 'bg-amber-500'
  }
};

export default function ReviewsModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, FLAGGED, PUBLISHED, HIDDEN
  const [ratingFilter, setRatingFilter] = useState(''); // '', 1, 2, 3, 4, 5
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalReviews: 0,
    publishedCount: 0,
    hiddenCount: 0,
    flaggedCount: 0,
    averageRating: 0
  });

  // Action in progress state
  const [processingId, setProcessingId] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = {
        page,
        limit: 12,
        status: activeTab,
        rating: ratingFilter || undefined,
        search: searchQuery.trim() || undefined
      };

      const res = await axios.get(`${ADMIN_API_URL}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setReviews(res.data.reviews || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError('Could not load reviews. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, activeTab, ratingFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    const confirmText =
      newStatus === 'HIDDEN'
        ? 'Hide this review? It will be immediately removed from the public website and the expert rating will be updated automatically.'
        : newStatus === 'PUBLISHED'
        ? 'Approve and publish this review? It will be visible publicly and included in the expert rating.'
        : 'Flag this review for moderation?';

    if (!window.confirm(confirmText)) return;

    setProcessingId(reviewId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.patch(
        `${ADMIN_API_URL}/reviews/${reviewId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: `Review marked as ${newStatus}. Expert rating recalculated.`
        });
        setTimeout(() => setActionMessage(null), 4000);
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to update review status:', err);
      alert(err.response?.data?.message || 'Failed to update review status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (
      !window.confirm(
        'Are you sure you want to PERMANENTLY delete this review? This action cannot be undone and will recalculate the expert rating.'
      )
    ) {
      return;
    }

    setProcessingId(reviewId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.delete(`${ADMIN_API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: 'Review permanently deleted and rating recalculated.'
        });
        setTimeout(() => setActionMessage(null), 4000);
        fetchReviews();
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Review & Rating Moderation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter, hide, or approve user reviews. Hidden or deleted reviews are instantly excluded from public view and expert ratings recalculate automatically.
          </p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Reviews</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalReviews}</p>
          <p className="text-xs text-slate-400 mt-1">All time received</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Published
          </p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.publishedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Active & visible</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Flagged / In Review
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.flaggedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Requires audit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
            <EyeOff className="w-3.5 h-3.5" /> Hidden / Filtered
          </p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{stats.hiddenCount}</p>
          <p className="text-xs text-slate-400 mt-1">Removed from public</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Avg Rating
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.averageRating} / 5</p>
          <p className="text-xs text-slate-400 mt-1">From published reviews</p>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Reviews', count: stats.totalReviews },
              { id: 'FLAGGED', label: 'Flagged / Suspicious', count: stats.flaggedCount, color: 'text-amber-700 bg-amber-100' },
              { id: 'PUBLISHED', label: 'Published', count: stats.publishedCount, color: 'text-emerald-700 bg-emerald-100' },
              { id: 'HIDDEN', label: 'Hidden', count: stats.hiddenCount, color: 'text-rose-700 bg-rose-100' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Rating filter & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Rating Filter Dropdown */}
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Ratings (1-5 ★)</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user, expert, feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Reviews Content List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading reviews...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-3 px-4 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No reviews found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || ratingFilter || activeTab !== 'ALL'
              ? 'No reviews match your current filters. Try resetting search or filter tabs.'
              : 'No client reviews have been recorded yet.'}
          </p>
          {(searchQuery || ratingFilter || activeTab !== 'ALL') && (
            <button
              onClick={() => {
                setActiveTab('ALL');
                setRatingFilter('');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => {
            const statusConfig = STATUS_CONFIG[r.status] || STATUS_CONFIG.PUBLISHED;
            const StatusIcon = statusConfig.icon;
            const isProcessing = processingId === r._id;

            return (
              <div
                key={r._id}
                className={`bg-white rounded-xl border transition-all p-5 shadow-sm space-y-4 ${
                  r.status === 'FLAGGED'
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : r.status === 'HIDDEN'
                    ? 'border-slate-200 opacity-80 bg-slate-50/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header: User, Expert, Rating, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* User Avatar & Info */}
                    <img
                      src={
                        r.user?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.name || 'User')}&background=0D8ABC&color=fff`
                      }
                      alt={r.user?.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{r.user?.name || 'Client'}</span>
                        <span className="text-[11px] text-slate-400">({r.user?.email || 'No email'})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Reviewed Expert:{' '}
                        <span className="font-semibold text-slate-800">
                          {r.expert?.name || 'Unknown Expert'}
                        </span>{' '}
                        {r.expert?.specialty && (
                          <span className="text-[11px] text-slate-400">· {r.expert.specialty}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars & Status Badge */}
                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= r.rating
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-900 ml-1">{r.rating}.0</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Flag / Moderation Reason Notice if flagged */}
                {r.flagReason && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Flagged Note:</span> {r.flagReason}
                    </div>
                  </div>
                )}

                {/* Feedback Comment Body */}
                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-800 border border-slate-100 leading-relaxed">
                  {r.feedback ? (
                    <p className="whitespace-pre-wrap">{r.feedback}</p>
                  ) : (
                    <p className="italic text-slate-400 text-xs">No written comment provided by user (rating only).</p>
                  )}
                </div>

                {/* Footer: Date, Consultation Info & Admin Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Submitted on: {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {r.consultation && (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        Session: {r.consultation.type?.toUpperCase() || 'CONSULTATION'} · ₹{r.consultation.totalAmount || 0}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Hide Button (if published or flagged) */}
                    {r.status !== 'HIDDEN' && (
                      <button
                        onClick={() => handleStatusChange(r._id, 'HIDDEN')}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50"
                        title="Hide this review from the expert profile and public site"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Review
                      </button>
                    )}

                    {/* Publish / Restore Button (if hidden or flagged) */}
                    {r.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(r._id, 'PUBLISHED')}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition disabled:opacity-50"
                        title="Approve and make visible on public website"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Publish
                      </button>
                    )}

                    {/* Flag button (if published) */}
                    {r.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleStatusChange(r._id, 'FLAGGED')}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50"
                        title="Flag for further investigation"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Flag
                      </button>
                    )}

                    {/* Permanent Delete Button */}
                    <button
                      onClick={() => handleDeleteReview(r._id)}
                      disabled={isProcessing}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 disabled:opacity-50"
                      title="Permanently delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600">
          <div>
            Showing {(page - 1) * 12 + 1} to {Math.min(page * 12, total)} of {total} reviews
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

