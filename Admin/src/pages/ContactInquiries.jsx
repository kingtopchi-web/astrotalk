import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Send,
  Trash2,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Phone,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import { ADMIN_API_URL } from '../utils/apiConfig';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: RefreshCw },
  RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  SPAM: { label: 'Spam', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', icon: AlertCircle }
};

export default function ContactInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, inProgress: 0, resolved: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Selected Inquiry Modal
  const [activeInquiry, setActiveInquiry] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, [selectedStatus]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = {
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined
      };
      const res = await axios.get(`${ADMIN_API_URL}/contact-inquiries`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (res.data.success) {
        setInquiries(res.data.inquiries || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInquiries();
  };

  const openInquiryModal = (inquiry) => {
    setActiveInquiry(inquiry);
    setReplyText('');
    setAdminNotes(inquiry.adminNotes || '');
    setActionFeedback(null);
  };

  const closeInquiryModal = () => {
    setActiveInquiry(null);
    setReplyText('');
    setActionFeedback(null);
  };

  const handleUpdateStatus = async (inquiryId, newStatus) => {
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.put(
        `${ADMIN_API_URL}/contact-inquiries/${inquiryId}/status`,
        { status: newStatus, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionFeedback({ type: 'success', message: 'Status updated successfully!' });
        if (activeInquiry && activeInquiry._id === inquiryId) {
          setActiveInquiry(res.data.inquiry);
        }
        fetchInquiries();
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeInquiry) return;
    setIsSendingReply(true);
    setActionFeedback(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${ADMIN_API_URL}/contact-inquiries/${activeInquiry._id}/reply`,
        { replyMessage: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setActionFeedback({
          type: 'success',
          message: `Reply email successfully sent to ${activeInquiry.email}!`
        });
        setActiveInquiry(res.data.inquiry);
        setReplyText('');
        fetchInquiries();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send reply email.'
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteInquiry = async (inquiryId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${ADMIN_API_URL}/contact-inquiries/${inquiryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (activeInquiry?._id === inquiryId) {
        closeInquiryModal();
      }
      fetchInquiries();
    } catch (err) {
      alert('Failed to delete inquiry: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="text-blue-600" size={26} />
            Contact Inquiries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and respond to messages submitted by visitors on the public Contact Us form.
          </p>
        </div>
        <button
          onClick={fetchInquiries}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'ALL'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Received</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{counts.all || inquiries.length}</p>
        </div>

        <div
          onClick={() => setSelectedStatus('PENDING')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'PENDING'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending / New</p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{counts.pending}</p>
        </div>

        <div
          onClick={() => setSelectedStatus('IN_PROGRESS')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'IN_PROGRESS'
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</p>
            <RefreshCw size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{counts.inProgress}</p>
        </div>

        <div
          onClick={() => setSelectedStatus('RESOLVED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            selectedStatus === 'RESOLVED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</p>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{counts.resolved}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Inquiries' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'RESOLVED', label: 'Resolved' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchInquiries();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Inquiries Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Mail size={28} />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-800">No Inquiries Found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStatus !== 'ALL'
                  ? `There are no inquiries marked as ${selectedStatus.toLowerCase()}.`
                  : 'No contact form messages have been submitted yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inquiries.map((inquiry) => {
                  const cfg = STATUS_CONFIG[inquiry.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = cfg.icon;
                  const dateStr = new Date(inquiry.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr
                      key={inquiry._id}
                      onClick={() => openInquiryModal(inquiry)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {inquiry.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {inquiry.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{inquiry.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 truncate max-w-[180px]">
                          {inquiry.subject || 'General Inquiry'}
                        </p>
                        {inquiry.phone && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {inquiry.phone}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <p className="text-slate-600 truncate max-w-[280px]">
                          {inquiry.message}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openInquiryModal(inquiry)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View / Reply"
                          >
                            <Send size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteInquiry(inquiry._id, e)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Inquiry"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail & Reply Modal */}
      {activeInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Inquiry Details</h3>
                  <p className="text-xs text-slate-400">
                    Received on{' '}
                    {new Date(activeInquiry.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={closeInquiryModal}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {actionFeedback && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    actionFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {actionFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* Visitor Profile Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Name</p>
                    <p className="text-sm font-semibold text-slate-800">{activeInquiry.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                    <a
                      href={`mailto:${activeInquiry.email}`}
                      className="text-sm font-semibold text-blue-600 hover:underline"
                    >
                      {activeInquiry.email}
                    </a>
                  </div>
                </div>

                {activeInquiry.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                      <a href={`tel:${activeInquiry.phone}`} className="text-sm font-semibold text-slate-800 hover:underline">
                        {activeInquiry.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Current Status</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        STATUS_CONFIG[activeInquiry.status]?.text || 'text-slate-700'
                      }`}
                    >
                      {STATUS_CONFIG[activeInquiry.status]?.label || activeInquiry.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject & Message Content */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800">
                  {activeInquiry.subject || 'General Inquiry'}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visitor Message</p>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeInquiry.message}
                </div>
              </div>

              {/* Previous Reply if any */}
              {activeInquiry.replyMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Email Reply Sent
                    </span>
                    {activeInquiry.repliedAt && (
                      <span className="text-[11px] text-emerald-600">
                        {new Date(activeInquiry.repliedAt).toLocaleString('en-IN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{activeInquiry.replyMessage}</p>
                </div>
              )}

              {/* Reply Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Send size={13} className="text-blue-600" />
                  Reply to Visitor via Email
                </label>
                <textarea
                  rows={4}
                  placeholder={`Write your reply to ${activeInquiry.name}... This message will be sent directly to their email address.`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 text-sm text-slate-800 outline-none transition-all resize-none"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Quick Status:</span>
                    <select
                      value={activeInquiry.status}
                      disabled={isUpdatingStatus}
                      onChange={(e) => handleUpdateStatus(activeInquiry._id, e.target.value)}
                      className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="SPAM">Spam</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyText.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Sending Email...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Send Reply Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={(e) => handleDeleteInquiry(activeInquiry._id, e)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete Inquiry
              </button>
              <button
                onClick={closeInquiryModal}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

