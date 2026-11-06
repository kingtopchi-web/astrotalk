import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  deleteAllNotifications 
} from '../utils/notificationService';
import adminApi from '../utils/apiConfig';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  UserCheck, 
  AlertTriangle, 
  FileText,
  Activity,
  Wallet,
  CreditCard,
  RefreshCw,
  Clock,
  Send,
  Radio,
  Users,
  User,
  GraduationCap,
  Sparkles,
  X,
  Megaphone,
  History,
  CheckCircle2
} from 'lucide-react';

function Notifications() {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'history'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Broadcast Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [targetAudience, setTargetAudience] = useState('ALL'); // 'ALL' | 'USERS' | 'EXPERTS'
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastBadge, setBroadcastBadge] = useState('IMPORTANT');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastActionText, setBroadcastActionText] = useState('View Details');
  const [isSending, setIsSending] = useState(false);
  const [broadcastSuccessMsg, setBroadcastSuccessMsg] = useState('');
  const [broadcastErrorMsg, setBroadcastErrorMsg] = useState('');

  // Broadcast History State
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setLoading(false);
  };

  const loadBroadcastHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await adminApi.get('/broadcasts');
      if (res.data?.success) {
        setBroadcastHistory(res.data.broadcasts || []);
      }
    } catch (err) {
      console.error('Failed to load broadcast history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
    loadBroadcastHistory();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await markNotificationAsRead(id);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead();
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await deleteNotificationItem(id);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      const res = await deleteAllNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setBroadcastErrorMsg('');
    setBroadcastSuccessMsg('');

    if (!broadcastTitle.trim()) {
      setBroadcastErrorMsg('Please enter an announcement title.');
      return;
    }
    if (!broadcastMessage.trim()) {
      setBroadcastErrorMsg('Please enter the announcement message content.');
      return;
    }

    try {
      setIsSending(true);
      const payload = {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        targetAudience,
        badge: broadcastBadge.trim(),
        link: broadcastLink.trim(),
        actionText: broadcastActionText.trim()
      };

      const res = await adminApi.post('/broadcast', payload);
      if (res.data?.success) {
        setBroadcastSuccessMsg(res.data.message || 'Broadcast announcement delivered successfully!');
        // Reset form
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastBadge('IMPORTANT');
        setBroadcastLink('');
        setBroadcastActionText('View Details');
        // Refresh history
        loadBroadcastHistory();
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastSuccessMsg('');
        }, 1800);
      } else {
        setBroadcastErrorMsg(res.data?.message || 'Failed to send broadcast');
      }
    } catch (err) {
      console.error('Broadcast send error:', err);
      setBroadcastErrorMsg(err.response?.data?.message || 'Server error while sending broadcast notification.');
    } finally {
      setIsSending(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'wallet_recharge':
        return <Wallet className="w-6 h-6 text-emerald-600" />;
      case 'payout_request':
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      case 'payout_processed':
        return <Check className="w-6 h-6 text-emerald-600" />;
      case 'refund_request':
        return <RefreshCw className="w-6 h-6 text-rose-600" />;
      case 'payment_issue':
      case 'payment_alert':
        return <AlertTriangle className="w-6 h-6 text-rose-600" />;
      case 'expert_registration':
        return <UserCheck className="w-6 h-6 text-purple-600" />;
      case 'expert_documents':
        return <FileText className="w-6 h-6 text-indigo-600" />;
      case 'expert_reapproval':
        return <UserCheck className="w-6 h-6 text-amber-600" />;
      case 'expert_pending':
        return <Clock className="w-6 h-6 text-amber-500" />;
      case 'complaint_report':
        return <FileText className="w-6 h-6 text-amber-600" />;
      case 'system_alert':
        return <Megaphone className="w-6 h-6 text-blue-600" />;
      default:
        return <Bell className="w-6 h-6 text-blue-600" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            Admin Notifications & Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Send important broadcast alerts to all users & experts, and manage inbound system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Send Broadcast Announcement CTA */}
          <button
            type="button"
            onClick={() => {
              setBroadcastErrorMsg('');
              setBroadcastSuccessMsg('');
              setShowBroadcastModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Megaphone size={17} className="animate-pulse" />
            Send Important Message
          </button>

          {activeTab === 'alerts' && unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}

          {activeTab === 'alerts' && notifications.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="px-4 py-2 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={16} className="text-red-500" /> Delete all
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs (Alerts vs Broadcast History) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Bell size={16} />
            System Alerts
            {unreadCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'alerts' ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadBroadcastHistory();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <History size={16} />
            Sent Broadcasts ({broadcastHistory.length})
          </button>
        </div>

        {activeTab === 'alerts' && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'unread'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unread only ({unreadCount})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: System Alerts List */}
      {activeTab === 'alerts' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse h-24" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">All Caught Up!</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                {filter === 'unread'
                  ? 'No unread alerts requiring admin action.'
                  : 'There are no active notifications at this time.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`rounded-2xl border p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative shadow-sm hover:shadow-md ${
                    !notif.isRead
                      ? 'bg-blue-50/50 border-blue-200 hover:border-blue-400'
                      : 'bg-white border-slate-200 hover:border-blue-300 opacity-90 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <h4 className={`text-base text-slate-900 leading-snug ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
                          {notif.title}
                        </h4>
                        {notif.badge && !notif.isRead && (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">
                            {notif.badge}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 ml-auto sm:ml-0">
                          {notif.timeAgo || 'Recently'}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.actionText && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {notif.actionText}
                            <ExternalLink size={13} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Check size={14} /> Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Sent Broadcast Announcements History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Broadcast Broadcast Log</h2>
            <button
              type="button"
              onClick={loadBroadcastHistory}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
              Refresh Log
            </button>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse h-28" />
              ))}
            </div>
          ) : broadcastHistory.length === 0 ? (
            <div className="py-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                <Megaphone className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Broadcasts Sent Yet</h3>
              <p className="text-slate-500 text-sm max-w-md mb-4">
                Use the "Send Important Message" button above to broadcast important updates, promotions, or emergency announcements to all users and experts.
              </p>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Send First Announcement
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcastHistory.map((item) => (
                <div
                  key={item._id}
                  className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          item.targetAudience === 'ALL'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : item.targetAudience === 'USERS'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.targetAudience === 'ALL' ? '👥 All Users & Experts' : item.targetAudience === 'USERS' ? '👤 Users Only' : '🎓 Experts Only'}
                        </span>

                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wide">
                            {item.badge}
                          </span>
                        )}

                        <span className="text-xs text-slate-400">
                          {new Date(item.sentAt || item.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.message}
                      </p>

                      {item.link && (
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                            Action: {item.actionText || 'View'} &rarr; {item.link}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                      <div className="text-xs font-bold text-slate-700 flex items-center sm:justify-end gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Delivered to {item.recipientsCount?.total ?? 0} recipients
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.recipientsCount?.users ?? 0} Users · {item.recipientsCount?.experts ?? 0} Experts
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        By {item.sentBy || 'Admin'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* COMPOSE BROADCAST ANNOUNCEMENT MODAL */}
      {/* ============================================================ */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full my-8 overflow-hidden transform transition-all animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Broadcast Important Announcement</h3>
                  <p className="text-xs text-blue-100">
                    Instantly delivers in-app notifications and real-time socket alerts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendBroadcast} className="p-6 space-y-5">
              
              {/* Feedback messages */}
              {broadcastSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  {broadcastSuccessMsg}
                </div>
              )}

              {broadcastErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  {broadcastErrorMsg}
                </div>
              )}

              {/* 1. Target Audience Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Target Audience <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('ALL')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      targetAudience === 'ALL'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">All Platform</div>
                      <div className="text-[11px] text-slate-500">Users + Experts</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('USERS')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      targetAudience === 'USERS'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Users Only</div>
                      <div className="text-[11px] text-slate-500">Clients & Buyers</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('EXPERTS')}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      targetAudience === 'EXPERTS'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 font-bold'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">Experts Only</div>
                      <div className="text-[11px] text-slate-500">Verified Advisors</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Announcement Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g., Important System Maintenance Tonight"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Badge / Tag
                  </label>
                  <select
                    value={broadcastBadge}
                    onChange={(e) => setBroadcastBadge(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="IMPORTANT">IMPORTANT</option>
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="OFFER">SPECIAL OFFER</option>
                    <option value="POLICY">POLICY UPDATE</option>
                  </select>
                </div>
              </div>

              {/* 3. Message Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Message Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type your important announcement here. It will be sent to their notification center and broadcasted live..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all leading-relaxed"
                />
                <div className="text-right text-[11px] text-slate-400 mt-1">
                  {broadcastMessage.length} characters
                </div>
              </div>

              {/* 4. Action Link & Action Text (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Optional Action Link (URL / Route)
                  </label>
                  <input
                    type="text"
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    placeholder="e.g. /wallet, /consultations, /profile"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Action Button Label
                  </label>
                  <input
                    type="text"
                    value={broadcastActionText}
                    onChange={(e) => setBroadcastActionText(e.target.value)}
                    placeholder="e.g. View Details, Recharge Now"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  Live In-App Notification Preview
                </div>
                <div className="bg-white border border-blue-200 rounded-xl p-3.5 shadow-xs flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                    <Megaphone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        {broadcastTitle || 'Important Announcement Title'}
                      </span>
                      {broadcastBadge && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-extrabold uppercase">
                          {broadcastBadge}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 ml-auto">Just now</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {broadcastMessage || 'This is how your message will appear inside the user and expert notification center.'}
                    </p>
                    {broadcastLink && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {broadcastActionText || 'View Details'} &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isSending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Sending Broadcast...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Broadcast Now
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Notifications;