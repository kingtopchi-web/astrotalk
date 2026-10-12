import axios from 'axios';

const API_BASE = 'https://astrotalk-hlg2.onrender.com/api';

// Initial role-based sample notifications matching the user's exact specification
export const getInitialNotificationsByRole = (role) => {
  if (role === 'EXPERT') {
    return [
      {
        _id: 'exp-1',
        title: 'New Consultation Request',
        message: 'Priya Sharma requested a 30-minute video consultation.',
        actionText: 'View request · Accept or reject',
        badge: 'New',
        link: '/expert/consultations',
        type: 'consultation_request',
        isRead: false,
        timeAgo: 'Just now',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'exp-2',
        title: 'Incoming Call',
        message: 'A user is requesting an audio/video session.',
        actionText: 'Open incoming call screen',
        badge: '',
        link: '/expert/consultations',
        type: 'incoming_call',
        isRead: false,
        timeAgo: '10 min ago',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        _id: 'exp-3',
        title: 'Earnings Update',
        message: 'Your consultation earnings or payout status has been updated.',
        actionText: 'View earnings',
        badge: '',
        link: '/expert/earnings',
        type: 'earnings_update',
        isRead: true,
        timeAgo: '2 hours ago',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        _id: 'exp-4',
        title: 'Upcoming Session',
        message: 'You have a consultation scheduled in 15 minutes.',
        actionText: 'View schedule',
        badge: '',
        link: '/expert/schedule',
        type: 'upcoming_session',
        isRead: true,
        timeAgo: '4 hours ago',
        createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ];
  }

  if (role === 'ADMIN') {
    return [
      {
        _id: 'adm-1',
        title: 'New Expert Registration',
        message: 'A new expert has submitted an application for approval.',
        actionText: 'Review application',
        badge: 'New',
        link: '/admin/experts',
        type: 'expert_registration',
        isRead: false,
        timeAgo: '5 min ago',
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        _id: 'adm-2',
        title: 'Payment / Refund Alert',
        message: 'A payment, refund or payout requires attention.',
        actionText: 'Open transaction details',
        badge: '',
        link: '/admin/payments',
        type: 'payment_alert',
        isRead: false,
        timeAgo: '20 min ago',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      },
      {
        _id: 'adm-3',
        title: 'New Complaint or Report',
        message: 'A user has reported an issue with a consultation.',
        actionText: 'Review support case',
        badge: '',
        link: '/admin/consultations',
        type: 'complaint_report',
        isRead: false,
        timeAgo: '1 hour ago',
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        _id: 'adm-4',
        title: 'System Alert',
        message: 'Important failures or unusual activity requiring admin attention.',
        actionText: 'Open system monitoring',
        badge: '',
        link: '/admin/dashboard',
        type: 'system_alert',
        isRead: true,
        timeAgo: '5 hours ago',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ];
  }

  // USER Notifications
  return [
    {
      _id: 'usr-1',
      title: 'Booking Confirmed',
      message: 'Your consultation with Dr. Rahul has been confirmed.',
      actionText: 'Open booking details',
      badge: 'New',
      link: '/bookings',
      type: 'booking_confirmed',
      isRead: false,
      timeAgo: '2 min ago',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
    },
    {
      _id: 'usr-2',
      title: 'Expert Ready to Connect',
      message: 'Your video consultation is ready to start.',
      actionText: 'Join consultation',
      badge: '',
      link: '/bookings',
      type: 'expert_ready',
      isRead: false,
      timeAgo: '15 min ago',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      _id: 'usr-3',
      title: 'New Chat Message',
      message: 'Your expert has sent you a message.',
      actionText: 'Open chat',
      badge: '',
      link: '/messages',
      type: 'chat_message',
      isRead: false,
      timeAgo: '45 min ago',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      _id: 'usr-4',
      title: 'Wallet Update',
      message: 'Your recharge or consultation payment status has changed.',
      actionText: 'View transactions',
      badge: '',
      link: '/wallet',
      type: 'wallet_update',
      isRead: true,
      timeAgo: '3 hours ago',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      _id: 'usr-5',
      title: 'Rate Your Consultation',
      message: 'Share your feedback about your completed session.',
      actionText: 'Write a review',
      badge: '',
      link: '/bookings',
      type: 'rate_consultation',
      isRead: true,
      timeAgo: 'Yesterday',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];
};

const getStorageKey = (role) => `app_notifications_${role || 'USER'}`;
const getDeletedKey = (role) => `app_notifications_deleted_${role || 'USER'}`;

export const fetchNotifications = async (role = 'USER') => {
  const token = localStorage.getItem('token');
  const storageKey = getStorageKey(role);
  const deletedKey = getDeletedKey(role);

  // Load set of deleted IDs
  let deletedIds = [];
  try {
    const rawDel = localStorage.getItem(deletedKey);
    if (rawDel) deletedIds = JSON.parse(rawDel);
  } catch (e) {}

  // Check cached storage first
  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {
    console.error('Storage parse error:', e);
  }

  const isInitializedKey = `app_notifs_inited_${role || 'USER'}`;
  const hasInitialized = localStorage.getItem(isInitializedKey);

  if (!hasInitialized && (!localList || localList.length === 0)) {
    localList = getInitialNotificationsByRole(role);
    localStorage.setItem(storageKey, JSON.stringify(localList));
    localStorage.setItem(isInitializedKey, 'true');
  }

  // Filter out any locally deleted IDs
  localList = localList.filter(n => !deletedIds.includes(n._id));

  if (token) {
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });

      if (res.data && res.data.notifications) {
        // Filter out any deleted IDs
        const filteredFromBackend = res.data.notifications.filter(n => !deletedIds.includes(n._id) && !n.isDeleted);
        localStorage.setItem(storageKey, JSON.stringify(filteredFromBackend));
        localStorage.setItem(isInitializedKey, 'true');
        const unreadCount = filteredFromBackend.filter(n => !n.isRead).length;
        return {
          notifications: filteredFromBackend,
          unreadCount
        };
      }
    } catch (err) {
      console.warn('Backend notifications endpoint unreachable, using synced local state:', err.message);
    }
  }

  const unreadCount = localList.filter(n => !n.isRead).length;
  return {
    notifications: localList,
    unreadCount
  };
};

export const markNotificationAsRead = async (id, role = 'USER') => {
  const token = localStorage.getItem('token');
  const storageKey = getStorageKey(role);

  // Update local storage immediately for zero-delay UX
  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  localList = localList.map(n => n._id === id ? { ...n, isRead: true } : n);
  localStorage.setItem(storageKey, JSON.stringify(localList));

  // Trigger event for bell icons
  window.dispatchEvent(new CustomEvent('notifications-updated', {
    detail: { unreadCount: localList.filter(n => !n.isRead).length }
  }));

  if (token) {
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });
    } catch (err) {
      console.warn('Backend mark read failed, local updated:', err.message);
    }
  }

  return {
    notifications: localList,
    unreadCount: localList.filter(n => !n.isRead).length
  };
};

export const markAllNotificationsAsRead = async (role = 'USER') => {
  const token = localStorage.getItem('token');
  const storageKey = getStorageKey(role);

  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  localList = localList.map(n => ({ ...n, isRead: true }));
  localStorage.setItem(storageKey, JSON.stringify(localList));

  window.dispatchEvent(new CustomEvent('notifications-updated', {
    detail: { unreadCount: 0 }
  }));

  if (token) {
    try {
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });
    } catch (err) {
      console.warn('Backend mark-all read failed, local updated:', err.message);
    }
  }

  return {
    notifications: localList,
    unreadCount: 0
  };
};

export const deleteNotificationItem = async (id, role = 'USER') => {
  const token = localStorage.getItem('token');
  const storageKey = getStorageKey(role);
  const deletedKey = getDeletedKey(role);

  // Track deleted ID permanently so refresh never brings it back
  let deletedIds = [];
  try {
    const rawDel = localStorage.getItem(deletedKey);
    if (rawDel) deletedIds = JSON.parse(rawDel);
  } catch (e) {}

  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
  }

  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  localList = localList.filter(n => n._id !== id);
  localStorage.setItem(storageKey, JSON.stringify(localList));

  window.dispatchEvent(new CustomEvent('notifications-updated', {
    detail: { unreadCount: localList.filter(n => !n.isRead).length }
  }));

  if (token) {
    try {
      await axios.delete(`${API_BASE}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });
    } catch (err) {}
  }

  return {
    notifications: localList,
    unreadCount: localList.filter(n => !n.isRead).length
  };
};
