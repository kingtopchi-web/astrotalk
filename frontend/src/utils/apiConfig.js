import axios from 'axios';

// Detect if running on localhost
export const isLocalhost = Boolean(
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local'))
);

export const LOCAL_API_URL = 'http://localhost:5000/api';
export const PROD_API_URL = 'https://experthub.nextgoodtechnologies.in/api';

// Prefer local backend during local development; fallback to Render in production
export const API_BASE_URL = isLocalhost ? LOCAL_API_URL : PROD_API_URL;

/**
 * Returns full API URL for a given endpoint path.
 * If endpoint already starts with http, returns it as is.
 */
export const getApiUrl = (path = '') => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Robust fetch for free chat settings & user eligibility.
 * 1. Queries /bookings/free-chat-status (with auth token if present)
 * 2. If it fails or is unavailable, falls back to /public/stats to get exact admin duration
 */
export const fetchFreeChatConfig = async () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Try primary status endpoint (tries local or prod depending on host)
  const candidateUrls = isLocalhost
    ? [`${LOCAL_API_URL}/bookings/free-chat-status`, `${PROD_API_URL}/bookings/free-chat-status`]
    : [`${PROD_API_URL}/bookings/free-chat-status`, `${LOCAL_API_URL}/bookings/free-chat-status`];

  for (const url of candidateUrls) {
    try {
      const res = await axios.get(url, { headers, timeout: 5000 });
      if (res.data && typeof res.data.freeChatDurationMinutes !== 'undefined') {
        return res.data;
      }
    } catch (e) {
      // Continue to next candidate
    }
  }

  // Fallback: public stats or public settings
  const publicUrls = isLocalhost
    ? [`${LOCAL_API_URL}/public/stats`, `${PROD_API_URL}/public/stats`]
    : [`${PROD_API_URL}/public/stats`, `${LOCAL_API_URL}/public/stats`];

  for (const url of publicUrls) {
    try {
      const res = await axios.get(url, { timeout: 5000 });
      if (res.data && typeof res.data.freeChatDurationMinutes !== 'undefined') {
        return {
          enableFreeChat: res.data.enableFreeChat !== false,
          freeChatDurationMinutes: Number(res.data.freeChatDurationMinutes) || 5,
          hasUsedFreeChat: false,
          userId: null
        };
      }
    } catch (e) {
      // Continue
    }
  }

  return {
    enableFreeChat: true,
    freeChatDurationMinutes: 5,
    hasUsedFreeChat: false,
    userId: null
  };
};
