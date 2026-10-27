import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X
} from 'lucide-react';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationItem,
  deleteAllNotifications 
} from '../utils/notificationService';

export default function AdminNotificationDropdown({ buttonClassName = '', containerClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadData = async () => {
    const data = await fetchNotifications();
    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    const interval = setInterval(loadData, 30000);

    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

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

  const handleDeleteAll = async (e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete all notifications?')) {
      const res = await deleteAllNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'wallet_recharge':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'payout_request':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'payout_processed':
        return <Check className="w-5 h-5 text-emerald-600" />;
      case 'refund_request':
        return <RefreshCw className="w-5 h-5 text-rose-600" />;
      case 'payment_issue':
      case 'payment_alert':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'expert_registration':
        return <UserCheck className="w-5 h-5 text-purple-600" />;
      case 'expert_documents':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'expert_reapproval':
        return <UserCheck className="w-5 h-5 text-amber-600" />;
      case 'expert_pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'complaint_report':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'system_alert':
        return <Activity className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className={`relative inline-block ${containerClassName}`} ref={dropdownRef}>
      {/* Bell Button with Dynamic Count Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Admin Notifications"
        title={unreadCount > 0 ? `${unreadCount} unread system alerts` : 'Notifications'}
        className={buttonClassName || "relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 rounded-full bg-red-500 text-white font-bold text-[10px] flex items-center justify-center shadow-xs animate-pulse">
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

      {/* Popover */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col text-slate-800 max-h-[82vh] sm:max-h-[520px]">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">Admin Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 transition-colors"
                >
                  <CheckCheck size={13} /> Mark read
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 transition-colors"
                  title="Delete all notifications"
                >
                  <Trash2 size={13} /> Delete all
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
                title="Close alerts"
                aria-label="Close alerts"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-slate-100 bg-white text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                <Bell className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No Notifications</p>
                <p className="text-xs mt-1">All admin alerts have been acknowledged.</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                    !notif.isRead 
                      ? 'bg-blue-50/40 hover:bg-blue-50/70' 
                      : 'hover:bg-slate-50 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={`text-sm leading-tight text-slate-900 ${!notif.isRead ? 'font-bold' : 'font-semibold'}`}>
                        {notif.title}
                      </h4>
                      {notif.badge && !notif.isRead && (
                        <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                          {notif.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      {notif.actionText && (
                        <span className="font-semibold text-blue-600 group-hover:underline flex items-center gap-1">
                          {notif.actionText} <ExternalLink size={11} />
                        </span>
                      )}
                      <span className="text-slate-400">
                        {notif.timeAgo || 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notif._id, e)}
                      title="Delete notification"
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center absolute right-3 top-1/2 -translate-y-1/2 group-hover:hidden" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs font-bold text-blue-600 hover:underline transition-colors block w-full py-1"
            >
              View All Admin Notifications &rarr;
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
