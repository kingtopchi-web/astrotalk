import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  clearAllNotifications
} from '../../utils/notificationService';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  PhoneCall, 
  TrendingUp, 
  Clock,
  Inbox
} from 'lucide-react';

function ExpertNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications('EXPERT');
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
    const res = await markNotificationAsRead(id, 'EXPERT');
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead('EXPERT');
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    const res = await clearAllNotifications('EXPERT');
    setNotifications(res.notifications || []);
    setUnreadCount(res.unreadCount || 0);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await deleteNotificationItem(id, 'EXPERT');
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id, 'EXPERT');
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'consultation_request':
        return <Inbox className="w-6 h-6 text-amber-500" />;
      case 'incoming_call':
        return <PhoneCall className="w-6 h-6 text-rose-500" />;
      case 'earnings_update':
        return <TrendingUp className="w-6 h-6 text-emerald-500" />;
      case 'upcoming_session':
        return <Clock className="w-6 h-6 text-cyan-500" />;
      default:
        return <Bell className="w-6 h-6 text-primary" />;
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
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Expert Notifications</h1>
          <p className="text-sm text-on-surface/60 mt-1">
            Real-time session requests, call alerts, schedule reminders, and earnings updates.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-surface-light hover:bg-primary/20 text-on-surface hover:text-primary rounded-xl text-sm font-semibold border border-border-color transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <CheckCheck size={16} /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold border border-rose-200 transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 bg-surface-light p-2 rounded-2xl border border-border-color">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            filter === 'all'
              ? 'bg-primary text-background shadow-sm'
              : 'text-on-surface/60 hover:text-on-surface'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-primary text-background shadow-sm'
              : 'text-on-surface/60 hover:text-on-surface'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-xs ${filter === 'unread' ? 'bg-background/30 text-background' : 'bg-rose-500 text-white'}`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-surface-light border border-border-color rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 bg-surface-light border border-border-color rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-1">No Alerts Right Now</h3>
          <p className="text-on-surface/60 text-sm max-w-sm">
            {filter === 'unread'
              ? "You've addressed all pending alerts!"
              : "When new consultation requests or updates arrive, they will appear here."}
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
                  ? 'bg-primary/5 border-primary/40 hover:border-primary'
                  : 'bg-surface-light border-border-color hover:border-primary/40 opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border-color flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                    <h4 className={`text-base text-on-surface leading-snug ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
                      {notif.title}
                    </h4>
                    {notif.badge && !notif.isRead && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 text-xs font-bold uppercase tracking-wider">
                        {notif.badge}
                      </span>
                    )}
                    <span className="text-xs text-on-surface/50 ml-auto sm:ml-0">
                      {notif.timeAgo || 'Recently'}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface/70 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.actionText && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold group-hover:bg-primary group-hover:text-background transition-colors">
                        {notif.actionText}
                        <ExternalLink size={13} />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-color/40">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMarkAsRead(notif._id, e)}
                    title="Mark as read"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-light hover:bg-emerald-500/20 text-on-surface hover:text-emerald-500 border border-border-color transition-colors flex items-center gap-1"
                  >
                    <Check size={14} /> Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(notif._id, e)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-on-surface/50 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
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

export default ExpertNotifications;
