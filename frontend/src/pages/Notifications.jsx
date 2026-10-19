import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useAuth } from '../context/AuthContext';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  clearAllNotifications
} from '../utils/notificationService';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Video, 
  MessageSquare, 
  Wallet, 
  Star, 
  PhoneCall, 
  TrendingUp, 
  UserCheck, 
  AlertTriangle, 
  FileText,
  Clock,
  Inbox
} from 'lucide-react';

function Notifications() {
  const { user } = useAuth();
  const role = user?.role || 'USER';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    const data = await fetchNotifications(role);
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
  }, [role]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await markNotificationAsRead(id, role);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleMarkAllRead = async () => {
    const res = await markAllNotificationsAsRead(role);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    const res = await clearAllNotifications(role);
    setNotifications(res.notifications || []);
    setUnreadCount(res.unreadCount || 0);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const res = await deleteNotificationItem(id, role);
    setNotifications(res.notifications);
    setUnreadCount(res.unreadCount);
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id, role);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <Calendar className="w-6 h-6 text-emerald-500" />;
      case 'expert_ready':
        return <Video className="w-6 h-6 text-blue-500" />;
      case 'chat_message':
        return <MessageSquare className="w-6 h-6 text-indigo-500" />;
      case 'wallet_update':
        return <Wallet className="w-6 h-6 text-amber-500" />;
      case 'rate_consultation':
        return <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 'consultation_request':
        return <Inbox className="w-6 h-6 text-amber-500" />;
      case 'incoming_call':
        return <PhoneCall className="w-6 h-6 text-rose-500" />;
      case 'earnings_update':
        return <TrendingUp className="w-6 h-6 text-emerald-500" />;
      case 'upcoming_session':
        return <Clock className="w-6 h-6 text-cyan-500" />;
      case 'expert_registration':
        return <UserCheck className="w-6 h-6 text-purple-500" />;
      case 'payment_alert':
        return <AlertTriangle className="w-6 h-6 text-rose-500" />;
      case 'complaint_report':
        return <FileText className="w-6 h-6 text-amber-500" />;
      case 'system_alert':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default:
        return <Bell className="w-6 h-6 text-primary" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <UserLayout 
      title={role === 'EXPERT' ? 'Expert Notifications' : 'User Notifications'} 
      subtitle="Stay updated with real-time consultation alerts, updates, and messages."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top bar controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-card p-4 rounded-2xl border border-border shadow-sm">
          
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === 'all'
                  ? 'bg-primary text-background shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background bg-surface-muted'
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-primary text-background shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background bg-surface-muted'
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-surface-muted hover:bg-primary/20 text-on-surface hover:text-primary rounded-xl text-sm font-semibold border border-border transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
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

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-surface-card border border-border rounded-2xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 bg-surface-card border border-border rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-background mb-1">No Notifications Found</h3>
            <p className="text-on-surface-variant text-sm max-w-sm">
              {filter === 'unread'
                ? "You have caught up with all your unread alerts!"
                : "You don't have any notifications right now."}
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
                    ? 'bg-primary/5 border-primary/30 hover:border-primary'
                    : 'bg-surface-card border-border hover:border-primary/40 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Left icon & content */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                      <h4 className={`text-base text-on-background leading-snug ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
                        {notif.title}
                      </h4>
                      {notif.badge && !notif.isRead && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 text-xs font-bold uppercase tracking-wider">
                          {notif.badge}
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant/70 ml-auto sm:ml-0">
                        {notif.timeAgo || 'Recently'}
                      </span>
                    </div>

                    <p className="text-sm text-on-surface-variant leading-relaxed">
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

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-muted hover:bg-emerald-500/20 text-on-surface hover:text-emerald-500 border border-border transition-colors flex items-center gap-1"
                    >
                      <Check size={14} /> Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(notif._id, e)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </UserLayout>
  );
}

export default Notifications;
