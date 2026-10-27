import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const API_BASE = API_BASE_URL;

// Filter out irrelevant or user-specific notifications (like rate consultation, user bookings, etc.)
export const filterAdminNotifications = (list = []) => {
  const disallowedTypes = [
    'rate_consultation',
    'booking_confirmed',
    'expert_ready',
    'chat_message',
    'incoming_call',
    'upcoming_session'
  ];

  return list.filter(n => {
    if (!n) return false;
    const type = (n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    
    // Exclude user-specific consultation ratings or chat/call pings
    if (disallowedTypes.includes(type)) return false;
    if (title.includes('rate your') || title.includes('rate consultation')) return false;
    if (title.includes('booking confirmed') || title.includes('expert ready')) return false;
    
    return true;
  });
};

export const getInitialNotificationsByRole = () => {
  return [
    {
      _id: 'adm-wallet-1',
      title: 'Wallet Recharge Successful',
      message: 'User Rohit Verma added ₹1,000.00 to their wallet via Razorpay.',
      actionText: 'View transaction',
      badge: 'Payment',
      link: '/transactions',
      type: 'wallet_recharge',
      isRead: false,
      timeAgo: '10 min ago',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      _id: 'adm-exp-reg-1',
      title: 'New Expert Registration',
      message: 'Dr. Sameer Kapoor (Astrology & Vedic) has submitted an application for verification.',
      actionText: 'Review application',
      badge: 'New',
      link: '/expert-applications',
      type: 'expert_registration',
      isRead: false,
      timeAgo: '25 min ago',
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      _id: 'adm-payout-req-1',
      title: 'Expert Payout Request',
      message: 'Dr. Priya Sharma requested a payout of ₹4,500.00 to registered bank account.',
      actionText: 'Process payout',
      badge: 'Payout',
      link: '/transactions',
      type: 'payout_request',
      isRead: false,
      timeAgo: '45 min ago',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    },
    {
      _id: 'adm-docs-1',
      title: 'Expert Documents Uploaded',
      message: 'Expert Kavita Mehta uploaded degree certificates & ID verification documents.',
      actionText: 'Verify documents',
      badge: 'Documents',
      link: '/expert-applications',
      type: 'expert_documents',
      isRead: false,
      timeAgo: '1 hour ago',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'adm-reapproval-1',
      title: 'Expert Re-approval Request',
      message: 'Expert Rajesh Rao updated profile qualification & rates and requested re-approval.',
      actionText: 'Review profile',
      badge: 'Re-approval',
      link: '/expert-applications',
      type: 'expert_reapproval',
      isRead: false,
      timeAgo: '2 hours ago',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      _id: 'adm-refund-1',
      title: 'Refund Request Received',
      message: 'User Sneha Kapoor submitted a refund request for Consultation session #CS-3021.',
      actionText: 'Review refund',
      badge: 'Refund',
      link: '/refunds',
      type: 'refund_request',
      isRead: false,
      timeAgo: '3 hours ago',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      _id: 'adm-pay-issue-1',
      title: 'Payment Verification Issue',
      message: 'Signature mismatch detected on Razorpay order #order_98312 for ₹500.00 wallet recharge.',
      actionText: 'Investigate issue',
      badge: 'Alert',
      link: '/transactions',
      type: 'payment_issue',
      isRead: true,
      timeAgo: '5 hours ago',
      createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      _id: 'adm-payout-success-1',
      title: 'Payout Processed Successfully',
      message: 'Payout of ₹3,200.00 to Astrologer Ankit has been marked as completed.',
      actionText: 'View payout log',
      badge: 'Completed',
      link: '/transactions',
      type: 'payout_processed',
      isRead: true,
      timeAgo: '6 hours ago',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
    },
    {
      _id: 'adm-pending-1',
      title: 'Expert Approvals Pending',
      message: '3 expert verification applications are currently awaiting admin review.',
      actionText: 'View pending experts',
      badge: 'Pending',
      link: '/expert-applications',
      type: 'expert_pending',
      isRead: true,
      timeAgo: '1 day ago',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];
};

const storageKey = 'app_notifications_ADMIN';
const deletedKey = 'admin_notifications_deleted';
const isInitializedKey = 'admin_notifs_inited_v3';

export const fetchNotifications = async () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  
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

  // Re-seed only if initialized key not found
  if (!hasInitialized) {
    localList = getInitialNotificationsByRole();
    localStorage.setItem(storageKey, JSON.stringify(localList));
    localStorage.setItem(isInitializedKey, 'true');
  }

  // Strictly filter out deleted and any non-admin/user-specific items
  localList = filterAdminNotifications(localList.filter(n => !deletedIds.includes(n._id)));

  if (token) {
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });

      if (res.data && res.data.notifications) {
        const filteredFromBackend = filterAdminNotifications(
          res.data.notifications.filter(n => !deletedIds.includes(n._id) && !n.isDeleted)
        );
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
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
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
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

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

export const deleteAllNotifications = async () => {
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  let localList = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localList = JSON.parse(raw);
  } catch (e) {}

  let deletedIds = [];
  try {
    const rawDel = localStorage.getItem(deletedKey);
    if (rawDel) deletedIds = JSON.parse(rawDel);
  } catch (e) {}

  localList.forEach(n => {
    if (n._id && !deletedIds.includes(n._id)) {
      deletedIds.push(n._id);
    }
  });

  localStorage.setItem(deletedKey, JSON.stringify(deletedIds));
  localStorage.setItem(storageKey, JSON.stringify([]));
  localStorage.setItem(isInitializedKey, 'true');

  window.dispatchEvent(new CustomEvent('notifications-updated', {
    detail: { unreadCount: 0 }
  }));

  if (token) {
    try {
      await axios.delete(`${API_BASE}/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000
      });
    } catch (err) {}
  }

  return {
    notifications: [],
    unreadCount: 0
  };
};
