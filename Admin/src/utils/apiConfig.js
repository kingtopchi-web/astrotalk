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
export const FALLBACK_RENDER_URL = 'https://astrotalk-hlg2.onrender.com/api';

// Use local backend when developing on localhost; otherwise use production API
export const API_BASE_URL = isLocalhost ? LOCAL_API_URL : PROD_API_URL;
export const ADMIN_API_URL = `${API_BASE_URL}/admin`;

/**
 * Returns full API URL for a given path.
 * If already absolute, returns as-is.
 */
export const getApiUrl = (path = '') => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export const getAdminApiUrl = (path = '') => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${ADMIN_API_URL}${cleanPath}`;
};

export const getAdminHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create a pre-configured Axios instance for Admin
const adminApi = axios.create({
  baseURL: ADMIN_API_URL,
  timeout: 15000,
});

adminApi.interceptors.request.use((config) => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default adminApi;
