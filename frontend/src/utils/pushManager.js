import axios from 'axios';
import { getApiUrl } from './apiConfig';

/**
 * Convert a base64 string to a Uint8Array for PushManager subscription.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Detect device type for subscription record
 */
function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Check if the current browser environment supports Push Notifications and Service Workers
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current browser notification permission
 * @returns {'default' | 'granted' | 'denied' | 'unsupported'}
 */
export function getNotificationPermission() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Register the Service Worker (if not already registered)
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    await navigator.serviceWorker.ready;
    console.log('[PushManager] Service Worker ready with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[PushManager] Service Worker registration failed:', err);
    throw err;
  }
}

/**
 * Retrieve the current active push subscription, if any exists on this device
 */
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[PushManager] Error fetching existing subscription:', err);
    return null;
  }
}

/**
 * Subscribe the current device to Web Push notifications.
 * Prompts user for permission when invoked.
 */
export async function subscribeToPush(token = null) {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser/device.');
  }

  const authToken = token || localStorage.getItem('token');
  if (!authToken) {
    throw new Error('User must be logged in to enable push notifications.');
  }

  // 1. Request notification permission (must be user gesture initiated)
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notification permission was denied in your browser settings. Please click the lock icon in your browser URL bar to allow notifications.'
        : 'Notification permission was dismissed.'
    );
  }

  // 2. Fetch VAPID public key from backend
  const keyRes = await axios.get(getApiUrl('/push-notifications/public-key'));
  const publicKey = keyRes.data?.publicKey;
  if (!publicKey) {
    throw new Error('Could not retrieve VAPID public key from server.');
  }

  // 3. Register or get active Service Worker
  const registration = await registerServiceWorker();

  // 4. Subscribe with PushManager
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });
  }

  // 5. Save subscription to backend
  const subJson = subscription.toJSON();
  await axios.post(
    getApiUrl('/push-notifications/subscribe'),
    {
      subscription: subJson,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType()
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );

  console.log('[PushManager] Successfully subscribed and synced with server.');
  return subscription;
}

/**
 * Unsubscribe current device from push notifications
 */
export async function unsubscribeFromPush(token = null) {
  if (!isPushSupported()) return false;

  const authToken = token || localStorage.getItem('token');
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    if (authToken && endpoint) {
      try {
        await axios.post(
          getApiUrl('/push-notifications/unsubscribe'),
          { endpoint },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (e) {
        console.warn('[PushManager] Error notifying backend of unsubscription:', e);
      }
    }
    return true;
  }
  return false;
}

/**
 * Fetch expert's notification preferences
 */
export async function fetchNotificationPreferences(token = null) {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) return null;

  const res = await axios.get(getApiUrl('/push-notifications/preferences'), {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  return res.data?.preferences;
}

/**
 * Update expert's notification preferences
 */
export async function updateNotificationPreferences(preferences, token = null) {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) return null;

  const res = await axios.put(
    getApiUrl('/push-notifications/preferences'),
    preferences,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return res.data?.preferences;
}

/**
 * Trigger a test push notification from backend
 */
export async function triggerTestPushNotification(token = null) {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) throw new Error('Not authenticated');

  const res = await axios.post(
    getApiUrl('/push-notifications/test'),
    {},
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return res.data;
}
