// ==============================================================================
// ExpertHub Service Worker - Push Notifications & PWA Support
// Supports Incoming Calls (Audio/Video) and Chat Notifications when the browser is closed
// ==============================================================================

const CACHE_NAME = 'experthub-v1';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed successfully.');
  self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activated and claimed clients.');
  event.waitUntil(self.clients.claim());
});

// ─── PUSH NOTIFICATION RECEIVER ──────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push event received.');

  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = {
        title: 'ExpertHub Notification',
        body: event.data.text()
      };
    }
  }

  const title = payload.title || 'ExpertHub Alert';
  const data = payload.data || {};
  const kind = data.kind || 'call';
  const isCall = kind === 'call';

  // Configure high-urgency call notification options
  const options = {
    body: payload.body || 'You have an incoming consultation request.',
    icon: payload.icon || '/logo.png',
    badge: payload.badge || '/logo.png',
    tag: payload.tag || (data.consultationId ? `call_${data.consultationId}` : 'experthub_notification'),
    renotify: payload.renotify !== false,
    requireInteraction: payload.requireInteraction !== undefined ? payload.requireInteraction : isCall, // Persistent for calls
    vibrate: payload.vibrate || (isCall ? [300, 150, 300, 150, 500, 200, 300, 150, 500] : [200, 100, 200]),
    sound: payload.sound || (isCall ? '/sounds/incoming-call.mp3' : '/sounds/notification.mp3'),
    timestamp: payload.timestamp || Date.now(),
    data: {
      ...data,
      receivedAt: Date.now()
    },
    actions: payload.actions || (isCall
      ? [
          { action: 'accept_call', title: '📞 Accept' },
          { action: 'decline_call', title: '❌ Decline' }
        ]
      : [
          { action: 'accept_chat', title: '💬 Accept Chat' },
          { action: 'decline_chat', title: '❌ Decline' }
        ])
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      // Also notify any currently open client tabs
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: { title, ...options }
          });
        });
      });
    })
  );
});

// ─── NOTIFICATION CLICK HANDLER ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};

  console.log('[ServiceWorker] Notification clicked, action:', action, 'data:', data);

  // 1. If expert clicked "Decline" / "Decline Chat"
  if (action === 'decline_call' || action === 'decline_chat') {
    if (data.consultationId && data.rejectApi) {
      const rejectUrl = data.rejectApi.startsWith('http')
        ? data.rejectApi
        : `${self.location.origin}${data.rejectApi}`;

      event.waitUntil(
        fetch(rejectUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Declined via mobile push notification' })
        })
          .then((res) => res.json())
          .then((resData) => {
            console.log('[ServiceWorker] Consultation declined successfully:', resData);
            // Notify any open client windows to update UI and stop ringing
            return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
              clients.forEach((c) => {
                c.postMessage({
                  type: 'CONSULTATION_DECLINED_BY_NOTIFICATION',
                  consultationId: data.consultationId
                });
              });
            });
          })
          .catch((err) => {
            console.error('[ServiceWorker] Failed to decline consultation remotely:', err);
          })
      );
    }
    return;
  }

  // 2. Expert clicked "Accept" or clicked anywhere on the notification
  let targetPath = '/expert/dashboard';
  if (action === 'accept_call' && data.acceptUrl) {
    targetPath = data.acceptUrl;
  } else if (action === 'accept_chat' && data.acceptUrl) {
    targetPath = data.acceptUrl;
  } else if (data.url) {
    targetPath = data.url;
  }

  const destinationUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate to destination
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.url !== destinationUrl) {
            client.navigate(destinationUrl);
          }
          return;
        }
      }
      // If no window is open, launch a new standalone window
      if (self.clients.openWindow) {
        return self.clients.openWindow(destinationUrl);
      }
    })
  );
});

// ─── NOTIFICATION DISMISS / CLOSE ────────────────────────────────────────────
self.addEventListener('notificationclose', (event) => {
  console.log('[ServiceWorker] Notification closed without action.');
});
