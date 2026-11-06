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
  Inbox,
  Megaphone,
  X,
  ChevronRight
} from 'lucide-react';

function Notifications() {
  const { user } = useAuth();
  const role = user?.role || 'USER';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
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

  // Route normalization for User role
  const resolveTargetLink = (notif) => {
    if (!notif) return null;
    let target = (notif.link || '').trim();

    if (!target) {
      switch (notif.type) {
        case 'booking_confirmed':
        case 'expert_ready':
        case 'rate_consultation':
        case 'upcoming_session':
        case 'consultation_request':
        case 'incoming_call':
          target = '/bookings';
          break;
        case 'chat_message':
          target = '/messages';
          break;
        case 'wallet_update':
        case 'wallet_recharge':
        case 'wallet_topup':
          target = '/wallet';
          break;
        default:
          target = '';
      }
    }

    if (target.startsWith('/consultations/')) {
      const consultationId = target.replace('/consultations/', '').split('?')[0];
      target = `/live/${consultationId}?type=video`;
    }

    if (target.startsWith('/expert/consultations')) target = '/bookings';
    if (target.startsWith('/expert/earnings')) target = '/wallet';
    if (target.startsWith('/expert/messages')) target = '/messages';
    if (target.startsWith('/expert/profile')) target = '/profile';
    if (target.startsWith('/expert/settings')) target = '/settings';
    if (target.startsWith('/expert/schedule')) target = '/bookings';

    return target;
  };

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

  // Clicking a notification item
  const handleItemClick = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    const target = resolveTargetLink(notif);
    if (target) {
      navigate(target);
    } else {
      setSelectedNotification(notif);
    }
  };

  const handleOpenDetailModal = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    setSelectedNotification(notif);
  };

  const handleDirectNavigate = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    const target = resolveTargetLink(notif);
    setSelectedNotification(null);
    if (target) {
      navigate(target);
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
      case 'wallet_recharge':
      case 'wallet_topup':
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
        return <Megaphone className="w-6 h-6 text-blue-500" />;
      default:
        return <Bell className="w-6 h-6 text-primary" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <UserLayout 
      title="User Notifications" 
      subtitle="Stay updated with real-time consultation alerts, updates, announcements, and messages."
    >
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
        
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-background shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background hover:bg-surface-muted'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-background shadow-sm'
                  : 'text-on-surface-variant hover:text-on-background hover:bg-surface-muted'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${filter === 'unread' ? 'bg-background/20 text-background' : 'bg-rose-500 text-white'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 bg-surface-muted hover:bg-surface-muted/80 text-on-background rounded-xl text-xs font-bold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 bg-surface-muted hover:bg-rose-500/10 text-on-surface-variant hover:text-rose-500 rounded-xl text-xs font-bold border border-border transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-surface-card border border-border rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-10 sm:py-12 bg-surface-card border border-border rounded-xl flex flex-col items-center justify-center text-center px-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-on-background mb-1">No Notifications Found</h3>
            <p className="text-on-surface-variant text-xs sm:text-sm max-w-sm">
              {filter === 'unread'
                ? "You have caught up with all your unread alerts!"
                : "You don't have any notifications right now."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredNotifications.map((notif) => {
              const targetLink = resolveTargetLink(notif);
              return (
                <div
                  key={notif._id}
                  onClick={(e) => handleItemClick(notif, e)}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative shadow-sm hover:shadow-md ${
                    !notif.isRead
                      ? 'bg-primary/5 border-primary/40 hover:border-primary'
                      : 'bg-surface-card border-border hover:border-primary/40 opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Left icon & content */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-surface-muted border border-border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <h4 className={`text-base text-on-background leading-snug group-hover:text-primary transition-colors ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
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

                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        {targetLink ? (
                          <button
                            type="button"
                            onClick={(e) => handleDirectNavigate(notif, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-background text-xs font-bold transition-all cursor-pointer"
                          >
                            {notif.actionText || 'Open details'}
                            <ChevronRight size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDetailModal(notif, e)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-on-background hover:bg-primary/10 hover:text-primary text-xs font-bold transition-all cursor-pointer"
                          >
                            View announcement
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-muted hover:bg-emerald-500/20 text-on-surface hover:text-emerald-500 border border-border transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={14} /> Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal for Details ("Ander Jana") */}
        {selectedNotification && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-surface-card border border-border text-on-background rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border flex items-center justify-center shrink-0">
                    {getIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {selectedNotification.type ? selectedNotification.type.replace(/_/g, ' ') : 'Alert'}
                      </span>
                      {selectedNotification.badge && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 text-[10px] font-extrabold uppercase">
                          {selectedNotification.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {selectedNotification.timeAgo || new Date(selectedNotification.createdAt || Date.now()).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="w-8 h-8 rounded-full bg-surface-muted hover:bg-border text-on-surface-variant hover:text-on-background flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-lg font-bold text-on-background leading-snug">
                {selectedNotification.title}
              </h3>

              <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border/80 text-sm text-on-background leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
                {selectedNotification.message}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 rounded-xl border border-border text-on-surface-variant hover:bg-surface-muted text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>

                {resolveTargetLink(selectedNotification) && (
                  <button
                    type="button"
                    onClick={() => handleDirectNavigate(selectedNotification)}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-background text-xs font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {selectedNotification.actionText || 'Open details'}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </UserLayout>
  );
}

export default Notifications;