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
  Clock
} from 'lucide-react';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem 
} from '../utils/notificationService';
import { createSocket } from '../utils/socket';
import { soundService } from '../utils/soundService';

export default function NotificationDropdown({ role = 'USER', viewAllPath = '/notifications' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
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

      socket.on('new_notification', (newNotif) => {
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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
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
        return <Wallet className="w-5 h-5 text-amber-500" />;
      case 'rate_consultation':
        return <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
      case 'consultation_request':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'incoming_call':
        return <PhoneCall className="w-5 h-5 text-rose-500" />;
      case 'earnings_update':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'upcoming_session':
        return <Clock className="w-5 h-5 text-cyan-500" />;
      case 'expert_registration':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      case 'payment_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'complaint_report':
        return <FileText className="w-5 h-5 text-amber-500" />;
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
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
        className="relative p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-muted transition-colors flex items-center justify-center focus:outline-none"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-on-background animate-in fade-in zoom-in-95 duration-150">
          
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

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-border/60 bg-surface-card text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
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
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-primary text-background'
                  : 'text-on-surface-variant hover:text-on-background bg-surface-muted'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60 hide-scrollbar">
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
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-4 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                    !notif.isRead 
                      ? 'bg-primary/5 hover:bg-primary/10' 
                      : 'hover:bg-surface-muted/60 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl bg-surface-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={`text-sm leading-tight text-on-background ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </h4>
                      {notif.badge && !notif.isRead && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                          {notif.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      {notif.actionText && (
                        <span className="font-semibold text-primary group-hover:underline flex items-center gap-1">
                          {notif.actionText} <ExternalLink size={11} />
                        </span>
                      )}
                      <span className="text-on-surface-variant/70">
                        {notif.timeAgo || 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Mark read, delete) */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 rounded-md text-on-surface-variant hover:text-emerald-400 hover:bg-surface-muted transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete notification"
                      className="p-1 rounded-md text-on-surface-variant hover:text-rose-400 hover:bg-surface-muted transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center absolute right-3 top-1/2 -translate-y-1/2 group-hover:hidden" />
                  )}
                </div>
              ))
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
              className="text-xs font-bold text-primary hover:underline transition-colors block w-full py-1"
            >
              View All Notifications &rarr;
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
