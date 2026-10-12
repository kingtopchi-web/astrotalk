import axios from 'axios';

const API_BASE = 'https://astrotalk-hlg2.onrender.com/api';

export const getInitialNotificationsByRole = () => {
  return [
    {
      _id: 'adm-1',
      title: 'New Expert Registration',
      message: 'A new expert has submitted an application for approval.',
      actionText: 'Review application',
      badge: 'New',
      link: '/experts',
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
      link: '/payments',
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
      link: '/consultations',
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
      link: '/dashboard',
      type: 'system_alert',
      isRead: true,
      timeAgo: '5 hours ago',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    }
  ];
};

const storageKey = 'app_notifications_ADMIN';

const deletedKey = 'admin_notifications_deleted';
const isInitializedKey = 'admin_notifs_inited';

export const fetchNotifications = async () => {
  const token = localStorage.getItem('token');
  
  let deletedIds = [];
  try {
    const rawDel = localStorage.getItem(deletedKey);
    if (rawDel) deletedIds = JSON.parse(rawDel);
  } catch (e) {}

  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  const hasInitialized = localStorage.getItem(isInitializedKey);

  if (!hasInitialized && (!localList || localList.length === 0)) {
    localList = getInitialNotificationsByRole();
    localStorage.setItem(storageKey, JSON.stringify(localList));
    localStorage.setItem(isInitializedKey, 'true');
  }

  localList = localList.filter(n => !deletedIds.includes(n._id));

  if (token) {
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });

      if (res.data && res.data.notifications) {
        const filteredFromBackend = res.data.notifications.filter(n => !deletedIds.includes(n._id) && !n.isDeleted);
        localStorage.setItem(storageKey, JSON.stringify(filteredFromBackend));
        localStorage.setItem(isInitializedKey, 'true');
        const unreadCount = filteredFromBackend.filter(n => !n.isRead).length;
        return {
          notifications: filteredFromBackend,
          unreadCount
        };
      }
    } catch (err) {}
  }

  const unreadCount = localList.filter(n => !n.isRead).length;
  return {
    notifications: localList,
    unreadCount
  };
};

export const markNotificationAsRead = async (id) => {
  const token = localStorage.getItem('token');
  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  localList = localList.map(n => n._id === id ? { ...n, isRead: true } : n);
  localStorage.setItem(storageKey, JSON.stringify(localList));

  window.dispatchEvent(new CustomEvent('notifications-updated', {
    detail: { unreadCount: localList.filter(n => !n.isRead).length }
  }));

  if (token) {
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, {
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

export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem('token');
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
    } catch (err) {}
  }

  return {
    notifications: localList,
    unreadCount: 0
  };
};

export const deleteNotificationItem = async (id) => {
  const token = localStorage.getItem('token');

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
