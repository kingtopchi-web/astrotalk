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
  Inbox,
  Video,
  MessageSquare,
  Wallet,
  Megaphone,
  X,
  ChevronRight
} from 'lucide-react';

function ExpertNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
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

  // Expert route resolution & normalization
  const resolveTargetLink = (notif) => {
    if (!notif) return null;
    let target = (notif.link || '').trim();

    if (!target) {
      switch (notif.type) {
        case 'consultation_request':
        case 'incoming_call':
        case 'booking_confirmed':
        case 'expert_ready':
        case 'rate_consultation':
          target = '/expert/consultations';
          break;
        case 'chat_message':
          target = '/expert/messages';
          break;
        case 'earnings_update':
        case 'wallet_update':
        case 'wallet_recharge':
        case 'payout_request':
        case 'payout_processed':
          target = '/expert/earnings';
          break;
        case 'upcoming_session':
          target = '/expert/schedule';
          break;
        default:
          target = '';
      }
    }

    if (target.startsWith('/consultations/')) {
      const consultationId = target.replace('/consultations/', '').split('?')[0];
      target = `/live/${consultationId}?type=video`;
    }

    if (target === '/bookings' || target === '/booking') target = '/expert/consultations';
    if (target === '/wallet') target = '/expert/earnings';
    if (target === '/messages') target = '/expert/messages';
    if (target === '/profile') target = '/expert/profile';
    if (target === '/settings') target = '/expert/settings';

    return target;
  };

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

  const handleItemClick = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, 'EXPERT');
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
      markNotificationAsRead(notif._id, 'EXPERT');
    }

    setSelectedNotification(notif);
  };

  const handleDirectNavigate = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, 'EXPERT');
    }

    const target = resolveTargetLink(notif);
    setSelectedNotification(null);
    if (target) {
      navigate(target);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'consultation_request':
        return <Inbox className="w-6 h-6 text-amber-500" />;
      case 'incoming_call':
        return <PhoneCall className="w-6 h-6 text-rose-500" />;
      case 'earnings_update':
      case 'payout_processed':
        return <TrendingUp className="w-6 h-6 text-emerald-500" />;
      case 'upcoming_session':
        return <Clock className="w-6 h-6 text-cyan-500" />;
      case 'chat_message':
        return <MessageSquare className="w-6 h-6 text-indigo-500" />;
      case 'expert_ready':
      case 'video_call':
        return <Video className="w-6 h-6 text-blue-500" />;
      case 'wallet_update':
      case 'wallet_recharge':
        return <Wallet className="w-6 h-6 text-amber-500" />;
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Expert Notifications
          </h1>
          <p className="text-sm text-on-surface/60 mt-1">
            Real-time consultation requests, call alerts, platform announcements, and earnings updates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-surface-light hover:bg-surface-muted text-on-surface rounded-xl text-sm font-semibold border border-border-color shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-4 py-2 bg-surface-light hover:bg-rose-500/10 text-on-surface hover:text-rose-500 rounded-xl text-sm font-semibold border border-border-color shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-surface-light p-1.5 rounded-2xl border border-border-color shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-primary text-background shadow-xs'
              : 'text-on-surface/70 hover:text-on-surface'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'unread'
              ? 'bg-primary text-background shadow-xs'
              : 'text-on-surface/70 hover:text-on-surface'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-xs ${filter === 'unread' ? 'bg-background/20 text-background' : 'bg-rose-500 text-white'}`}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-surface-light border border-border-color rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 bg-surface-light border border-border-color rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-xs">
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
          {filteredNotifications.map((notif) => {
            const targetLink = resolveTargetLink(notif);
            return (
              <div
                key={notif._id}
                onClick={(e) => handleItemClick(notif, e)}
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
                      <h4 className={`text-base text-on-surface leading-snug group-hover:text-primary transition-colors ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted text-on-surface hover:bg-primary/10 hover:text-primary text-xs font-bold transition-all cursor-pointer"
                        >
                          View announcement
                          <ExternalLink size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border-color/40">
                  {!notif.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      title="Mark as read"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-light hover:bg-emerald-500/20 text-on-surface hover:text-emerald-500 border border-border-color transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} /> Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(notif._id, e)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-on-surface/50 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                  <div className="text-[11px] text-on-surface/60 mt-0.5">
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
                className="w-8 h-8 rounded-full bg-surface-muted hover:bg-border text-on-surface/70 hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-on-surface leading-snug">
              {selectedNotification.title}
            </h3>

            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border/80 text-sm text-on-surface leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {selectedNotification.message}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl border border-border text-on-surface/70 hover:bg-surface-muted text-xs font-semibold transition-colors cursor-pointer"
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
  );
}

export default ExpertNotifications;