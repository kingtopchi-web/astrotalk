import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  deleteAllNotifications 
} from '../utils/notificationService';
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
  Clock
} from 'lucide-react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

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
        return <Activity className="w-6 h-6 text-red-600" />;
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            System monitoring, approvals, payment alerts, and support escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-xl text-sm font-semibold border border-slate-200 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
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

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All System Alerts ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-xs ${filter === 'unread' ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Cards */}
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

    </div>
  );
}

export default Notifications;
