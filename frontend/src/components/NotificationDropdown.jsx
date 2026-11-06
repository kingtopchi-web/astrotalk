import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Megaphone,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  clearAllNotifications
} from '../utils/notificationService';
import { createSocket } from '../utils/socket';
import { soundService } from '../utils/soundService';

export default function NotificationDropdown({ role = 'USER', viewAllPath = '/notifications' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [selectedNotification, setSelectedNotification] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadData = async () => {
    const data = await fetchNotifications(role);
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    // Periodic refresh
    const interval = setInterval(loadData, 20000);

    // Real-time socket updates
    let socket = null;
    try {
      socket = createSocket();
      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem('user'));
      } catch (e) {}

      if (storedUser?._id) {
        socket.emit('join_user', storedUser._id);
      }
      if (role) {
        socket.emit('join_role', role);
      }

      socket.on('new_notification', () => {
        soundService.playNotificationSound();
        loadData();
      });
    } catch (err) {
      console.warn('Socket connection warning:', err);
    }

    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      clearInterval(interval);
      if (socket) {
        socket.off('new_notification');
        socket.disconnect();
      }
    };
  }, [role]);

  // Close when clicking or tapping outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Resolve appropriate route based on role and notification metadata
  const resolveTargetLink = (notif) => {
    if (!notif) return null;
    let target = (notif.link || '').trim();

    if (!target) {
      // Auto-fallback link based on type if missing
      switch (notif.type) {
        case 'booking_confirmed':
        case 'expert_ready':
        case 'rate_consultation':
          target = role === 'EXPERT' ? '/expert/consultations' : '/bookings';
          break;
        case 'chat_message':
          target = role === 'EXPERT' ? '/expert/messages' : '/messages';
          break;
        case 'wallet_update':
        case 'wallet_recharge':
        case 'wallet_topup':
          target = role === 'EXPERT' ? '/expert/earnings' : '/wallet';
          break;
        case 'consultation_request':
        case 'incoming_call':
          target = role === 'EXPERT' ? '/expert/consultations' : '/bookings';
          break;
        case 'earnings_update':
        case 'payout_request':
        case 'payout_processed':
          target = role === 'EXPERT' ? '/expert/earnings' : '/wallet';
          break;
        case 'upcoming_session':
          target = role === 'EXPERT' ? '/expert/schedule' : '/bookings';
          break;
        default:
          target = '';
      }
    }

    // Normalize /consultations/:id to /live/:id
    if (target.startsWith('/consultations/')) {
      const consultationId = target.replace('/consultations/', '').split('?')[0];
      target = `/live/${consultationId}?type=video`;
    }

    // Role-based route normalization
    if (role === 'EXPERT') {
      if (target === '/bookings' || target === '/booking') target = '/expert/consultations';
      if (target === '/wallet') target = '/expert/earnings';
      if (target === '/messages') target = '/expert/messages';
      if (target === '/profile') target = '/expert/profile';
      if (target === '/settings') target = '/expert/settings';
    } else {
      if (target.startsWith('/expert/consultations')) target = '/bookings';
      if (target.startsWith('/expert/earnings')) target = '/wallet';
      if (target.startsWith('/expert/messages')) target = '/messages';
      if (target.startsWith('/expert/profile')) target = '/profile';
      if (target.startsWith('/expert/settings')) target = '/settings';
      if (target.startsWith('/expert/schedule')) target = '/bookings';
    }

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

  const handleClearAll = async (e) => {
    if (e) e.stopPropagation();
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

  // When clicking anywhere on the notification card:
  // Navigate directly if an action link exists; otherwise open the detail modal ("ander jana")
  const handleItemClick = (notif, e) => {
    if (e) e.stopPropagation();

    // Optimistically mark as read immediately
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    const target = resolveTargetLink(notif);
    if (target) {
      setIsOpen(false);
      navigate(target);
    } else {
      // If it's a message/announcement with no specific route, open detail view
      setSelectedNotification(notif);
    }
  };

  // Open the detail modal explicitly
  const handleOpenDetailModal = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    setSelectedNotification(notif);
  };

  // Direct action navigation from modal or action pill
  const handleDirectNavigate = (notif, e) => {
    if (e) e.stopPropagation();

    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      markNotificationAsRead(notif._id, role);
    }

    const target = resolveTargetLink(notif);
    setIsOpen(false);
    setSelectedNotification(null);
    if (target) {
      navigate(target);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'expert_ready':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'chat_message':
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'wallet_update':
      case 'wallet_recharge':
      case 'wallet_topup':
        return <Wallet className="w-5 h-5 text-amber-500" />;
      case 'rate_consultation':
        return <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
      case 'consultation_request':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'incoming_call':
        return <PhoneCall className="w-5 h-5 text-rose-500" />;
      case 'earnings_update':
      case 'payout_processed':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'upcoming_session':
        return <Clock className="w-5 h-5 text-cyan-500" />;
      case 'system_alert':
        return <Megaphone className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button with Live Unread Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        className="relative p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-muted transition-colors flex items-center justify-center focus:outline-none cursor-pointer"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile Backdrop to tap outside anywhere to hide */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 sm:hidden transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-on-background animate-in fade-in zoom-in-95 duration-150 max-h-[82vh] sm:max-h-[520px]">
          
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-surface-muted/50">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-base text-on-background">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-xs">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 size={13} /> Clear all
                </button>
              )}
              {/* Close Button on Mobile & Desktop */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-muted transition-colors cursor-pointer ml-1"
                title="Close notifications"
                aria-label="Close notifications"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/60 bg-surface-card text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-background'
                  : 'text-on-surface-variant hover:text-on-background bg-surface-muted'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-primary text-background'
                  : 'text-on-surface-variant hover:text-on-background bg-surface-muted'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 max-h-[60vh] sm:max-h-[380px] overflow-y-auto divide-y divide-border/60 hide-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 text-primary opacity-60">
                  notifications_off
                </span>
                <p className="text-sm font-semibold text-on-background">No notifications</p>
                <p className="text-xs mt-1 text-on-surface-variant">
                  {filter === 'unread' ? "You have read all your alerts!" : "You're completely caught up."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const targetLink = resolveTargetLink(notif);
                return (
                  <div
                    key={notif._id}
                    onClick={(e) => handleItemClick(notif, e)}
                    className={`p-4 transition-all cursor-pointer group flex items-start gap-3 relative hover:bg-primary/5 active:scale-[0.99] ${
                      !notif.isRead 
                        ? 'bg-primary/5' 
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      {getIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className={`text-sm leading-tight text-on-background group-hover:text-primary transition-colors ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notif.title}
                        </h4>
                        {notif.badge && !notif.isRead && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                            {notif.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap">
                        {targetLink ? (
                          <button
                            type="button"
                            onClick={(e) => handleDirectNavigate(notif, e)}
                            className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 px-2 py-0.5 rounded-md hover:bg-primary hover:text-white transition-all"
                          >
                            {notif.actionText || 'Open details'} <ChevronRight size={12} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenDetailModal(notif, e)}
                            className="font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View announcement <ExternalLink size={11} />
                          </button>
                        )}
                        <span className="text-on-surface-variant/70">
                          {notif.timeAgo || 'Recently'}
                        </span>
                      </div>
                    </div>

                    {/* Actions (Mark read, delete) */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          title="Mark as read"
                          className="p-1 rounded-md text-on-surface-variant hover:text-emerald-500 hover:bg-surface-muted transition-colors cursor-pointer"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif._id, e)}
                        title="Delete notification"
                        className="p-1 rounded-md text-on-surface-variant hover:text-rose-500 hover:bg-surface-muted transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center absolute right-3 bottom-3" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-surface-muted/50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(viewAllPath);
              }}
              className="text-xs font-bold text-primary hover:underline transition-colors block w-full py-1 cursor-pointer"
            >
              View All Notifications &rarr;
            </button>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* NOTIFICATION DETAIL MODAL ("ANDER JANA") */}
      {/* ========================================================= */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card border border-border text-on-background rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border flex items-center justify-center shrink-0">
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {selectedNotification.type ? selectedNotification.type.replace(/_/g, ' ') : 'Notification'}
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

            {/* Notification Title */}
            <h3 className="text-lg font-bold text-on-background leading-snug">
              {selectedNotification.title}
            </h3>

            {/* Full Message */}
            <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border/80 text-sm text-on-background leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto">
              {selectedNotification.message}
            </div>

            {/* Modal Actions */}
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
  );
}