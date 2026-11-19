const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const Expert = require('../models/Expert');

// ─── 1. Configure VAPID Credentials ──────────────────────────────────────────
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGNzQXIh2IwgLVu19r_UOmNX_G834rrr61JoVzkZYgMQzMnyjbGFUgKI7_yKpFgUsTPWaKjixttJmwbfPbElj-4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '4fQFEsOV-nh30atx7hSGVtS5GUtemgJ5_Epv-e_dl9A';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@experthub.in';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[WebPush] VAPID details initialized successfully.');
} catch (err) {
  console.error('[WebPush] Failed to initialize VAPID details:', err.message);
}

// Helper to get public key for frontend
const getPublicKey = () => VAPID_PUBLIC_KEY;

// ─── 2. Subscription Management ──────────────────────────────────────────────
/**
 * Register or update push subscription for an expert / user.
 */
const saveSubscription = async ({ userId, userRole = 'EXPERT', subscription, userAgent = '', deviceType = 'unknown' }) => {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Invalid push subscription format: endpoint and keys are required');
  }

  const endpoint = subscription.endpoint;
  const keys = subscription.keys;
  const expirationTime = subscription.expirationTime || null;

  const result = await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      userId,
      userRole,
      userModel: userRole === 'EXPERT' ? 'Expert' : 'User',
      endpoint,
      keys,
      expirationTime,
      userAgent: userAgent || '',
      deviceType: deviceType || 'unknown',
      lastUsedAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return result;
};

/**
 * Remove an invalid or unsubscribed push subscription endpoint.
 */
const removeSubscription = async (endpoint) => {
  if (!endpoint) return null;
  return await PushSubscription.findOneAndDelete({ endpoint });
};

// ─── 3. Core Notification Dispatcher ─────────────────────────────────────────
/**
 * Core dispatch function that delivers web push payloads to all registered devices for an expert.
 * Automatically cleans up expired subscriptions (HTTP 404/410).
 */
const sendPushToExpert = async (expertId, notificationPayload, options = {}) => {
  try {
    if (!expertId) return { success: false, reason: 'No expertId provided' };

    // 1. Check expert's dynamic notification preferences
    const expert = await Expert.findById(expertId).select('name notificationPreferences');
    if (!expert) return { success: false, reason: 'Expert not found' };

    const prefs = expert.notificationPreferences || {};
    if (prefs.push === false) {
      console.log(`[WebPush] Push skipped for expert ${expertId}: master push preference is disabled`);
      return { success: false, reason: 'Master push is disabled by expert' };
    }

    const kind = notificationPayload?.data?.kind || 'call';
    const callType = notificationPayload?.data?.type || 'audio';

    if (kind === 'chat' && prefs.chatPush === false) {
      console.log(`[WebPush] Chat push skipped for expert ${expertId}: chatPush is disabled`);
      return { success: false, reason: 'Chat push notifications disabled by expert' };
    }

    if (kind === 'call') {
      if (callType === 'video' && prefs.videoCallPush === false) {
        console.log(`[WebPush] Video call push skipped for expert ${expertId}: videoCallPush is disabled`);
        return { success: false, reason: 'Video call push notifications disabled by expert' };
      }
      if (callType === 'audio' && prefs.audioCallPush === false) {
        console.log(`[WebPush] Audio call push skipped for expert ${expertId}: audioCallPush is disabled`);
        return { success: false, reason: 'Audio call push notifications disabled by expert' };
      }
    }

    // 2. Fetch all active device subscriptions for this expert
    const subscriptions = await PushSubscription.find({ userId: expertId });
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`[WebPush] No push subscriptions found for expert ${expertId}`);
      return { success: false, count: 0, reason: 'No active device subscriptions' };
    }

    const stringifiedPayload = JSON.stringify(notificationPayload);

    const pushOptions = {
      TTL: options.TTL || (kind === 'call' ? 60 : 300), // Calls expire in 60s, chats in 5 mins
      urgency: options.urgency || (kind === 'call' ? 'high' : 'normal'),
      vapidDetails: {
        subject: VAPID_SUBJECT,
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: VAPID_PRIVATE_KEY
      }
    };

    console.log(`[WebPush] Sending push (${kind}) to ${subscriptions.length} device(s) of expert ${expert.name}`);

    // 3. Dispatch to all devices in parallel
    const sendPromises = subscriptions.map(async (subDoc) => {
      const pushSub = {
        endpoint: subDoc.endpoint,
        keys: {
          p256dh: subDoc.keys.p256dh,
          auth: subDoc.keys.auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, stringifiedPayload, pushOptions);
        await PushSubscription.findByIdAndUpdate(subDoc._id, { lastUsedAt: new Date() });
        return { status: 'fulfilled', endpoint: subDoc.endpoint };
      } catch (err) {
        console.warn(`[WebPush] Error sending to endpoint: ${subDoc.endpoint.slice(0, 45)}... status: ${err.statusCode}`);
        // 410 Gone or 404 Not Found: subscription is expired / user uninstalled / revoked permission
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[WebPush] Automatically purging dead subscription: ${subDoc.endpoint.slice(0, 40)}...`);
          await PushSubscription.findByIdAndDelete(subDoc._id).catch(() => {});
        }
        return { status: 'rejected', error: err.message, statusCode: err.statusCode };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter((r) => r.value?.status === 'fulfilled').length;

    return {
      success: true,
      deliveredDevices: successCount,
      totalDevices: subscriptions.length
    };
  } catch (error) {
    console.error('[WebPush] Error in sendPushToExpert:', error);
    return { success: false, error: error.message };
  }
};

// ─── 4. Specialized Push Dispatchers ─────────────────────────────────────────

/**
 * Dispatch an incoming audio or video call push notification to an expert's phone.
 * Renders WhatsApp / phone-like incoming call screen notification with Accept and Decline actions.
 */
const sendIncomingCallPush = async (expertId, callData = {}) => {
  const isVideo = (callData.type || '').toLowerCase() === 'video';
  const userName = callData.userName || 'A client';
  const consultationId = String(callData.consultationId || '');
  const isFree = Boolean(callData.isFree);

  const title = isVideo ? 'Incoming Video Call' : 'Incoming Audio Call';
  const body = `${userName} is calling you for a ${isVideo ? 'video' : 'voice'} consultation${isFree ? ' (Free)' : ''}.`;

  const payload = {
    title,
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `call_${consultationId}`,
    renotify: true,
    requireInteraction: true, // Keep notification persistently on screen until answered
    vibrate: [300, 150, 300, 150, 500, 200, 300, 150, 500], // High-cadence phone ring vibration pattern
    sound: '/sounds/incoming-call.mp3',
    timestamp: Date.now(),
    data: {
      kind: 'call',
      type: isVideo ? 'video' : 'audio',
      consultationId,
      userName,
      isFree,
      url: `/live/${consultationId}?type=${isVideo ? 'video' : 'audio'}&incoming=true`,
      acceptUrl: `/live/${consultationId}?type=${isVideo ? 'video' : 'audio'}&incoming=true`,
      rejectApi: `/api/bookings/${consultationId}/reject`
    },
    actions: [
      {
        action: 'accept_call',
        title: '📞 Accept'
      },
      {
        action: 'decline_call',
        title: '❌ Decline'
      }
    ]
  };

  return await sendPushToExpert(expertId, payload, { TTL: 60, urgency: 'high' });
};

/**
 * Dispatch an incoming chat consultation request push notification to an expert's phone.
 * Allows Accept Chat and Decline actions.
 */
const sendIncomingChatPush = async (expertId, chatData = {}) => {
  const userName = chatData.userName || 'A client';
  const consultationId = String(chatData.consultationId || '');
  const conversationId = String(chatData.conversationId || '');
  const isFree = Boolean(chatData.isFree);

  const title = 'New Chat Request';
  const body = `You have received a new chat request from ${userName}${isFree ? ' (Free)' : ''}.`;

  const payload = {
    title,
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `chat_${consultationId}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    sound: '/sounds/notification.mp3',
    timestamp: Date.now(),
    data: {
      kind: 'chat',
      type: 'chat',
      consultationId,
      conversationId,
      userName,
      isFree,
      url: '/expert/messages',
      acceptUrl: `/expert/messages${conversationId ? `?conversationId=${conversationId}` : ''}`,
      rejectApi: `/api/bookings/${consultationId}/reject`
    },
    actions: [
      {
        action: 'accept_chat',
        title: '💬 Accept Chat'
      },
      {
        action: 'decline_chat',
        title: '❌ Decline'
      }
    ]
  };

  return await sendPushToExpert(expertId, payload, { TTL: 300, urgency: 'normal' });
};

/**
 * Dispatch a verification/test push notification to an expert's device.
 */
const sendTestPush = async (expertId) => {
  const payload = {
    title: '🔔 Test Notification Successful!',
    body: 'Your device is successfully connected to ExpertHub. You will receive live calls and chat alerts here.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `test_${Date.now()}`,
    vibrate: [150, 100, 150],
    data: {
      kind: 'test',
      url: '/expert/dashboard'
    }
  };

  return await sendPushToExpert(expertId, payload, { TTL: 60, urgency: 'high' });
};

module.exports = {
  getPublicKey,
  saveSubscription,
  removeSubscription,
  sendPushToExpert,
  sendIncomingCallPush,
  sendIncomingChatPush,
  sendTestPush
};
