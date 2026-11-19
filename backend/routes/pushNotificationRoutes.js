const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Expert = require('../models/Expert');
const pushService = require('../services/pushNotificationService');

// @route   GET /api/push-notifications/public-key
// @desc    Get VAPID public key for browser PushManager subscription
// @access  Public
router.get('/public-key', (req, res) => {
  try {
    const publicKey = pushService.getPublicKey();
    res.json({ success: true, publicKey });
  } catch (error) {
    console.error('[PushRoutes] Error getting public key:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve VAPID public key' });
  }
});

// @route   POST /api/push-notifications/subscribe
// @desc    Register a device push subscription for the logged-in user / expert
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { subscription, userAgent, deviceType } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Missing push subscription payload or keys' });
    }

    const saved = await pushService.saveSubscription({
      userId: req.user._id,
      userRole: req.user.role || 'EXPERT',
      subscription,
      userAgent: userAgent || req.headers['user-agent'] || '',
      deviceType: deviceType || 'unknown'
    });

    res.status(201).json({
      success: true,
      message: 'Push subscription successfully registered for device',
      subscriptionId: saved._id
    });
  } catch (error) {
    console.error('[PushRoutes] Error registering subscription:', error);
    res.status(500).json({ success: false, message: 'Failed to register push subscription', error: error.message });
  }
});

// @route   POST /api/push-notifications/unsubscribe
// @desc    Unregister a device push subscription
// @access  Private
router.post('/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint is required to unsubscribe' });
    }

    await pushService.removeSubscription(endpoint);
    res.json({ success: true, message: 'Push subscription removed successfully' });
  } catch (error) {
    console.error('[PushRoutes] Error unsubscribing:', error);
    res.status(500).json({ success: false, message: 'Failed to remove push subscription', error: error.message });
  }
});

// @route   GET /api/push-notifications/preferences
// @desc    Get expert's notification preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const expert = await Expert.findById(req.user._id).select('notificationPreferences');
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert profile not found' });
    }

    const defaultPrefs = {
      push: true,
      chatPush: true,
      audioCallPush: true,
      videoCallPush: true,
      sounds: true,
      vibration: true,
      email: true
    };

    const merged = { ...defaultPrefs, ...(expert.notificationPreferences?.toObject?.() || expert.notificationPreferences || {}) };
    res.json({ success: true, preferences: merged });
  } catch (error) {
    console.error('[PushRoutes] Error getting preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch preferences', error: error.message });
  }
});

// @route   PUT /api/push-notifications/preferences
// @desc    Update expert's notification preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { push, chatPush, audioCallPush, videoCallPush, sounds, vibration, email } = req.body;

    const expert = await Expert.findById(req.user._id);
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }

    const current = expert.notificationPreferences || {};
    expert.notificationPreferences = {
      push: typeof push === 'boolean' ? push : (current.push ?? true),
      chatPush: typeof chatPush === 'boolean' ? chatPush : (current.chatPush ?? true),
      audioCallPush: typeof audioCallPush === 'boolean' ? audioCallPush : (current.audioCallPush ?? true),
      videoCallPush: typeof videoCallPush === 'boolean' ? videoCallPush : (current.videoCallPush ?? true),
      sounds: typeof sounds === 'boolean' ? sounds : (current.sounds ?? true),
      vibration: typeof vibration === 'boolean' ? vibration : (current.vibration ?? true),
      email: typeof email === 'boolean' ? email : (current.email ?? true)
    };

    await expert.save();

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: expert.notificationPreferences
    });
  } catch (error) {
    console.error('[PushRoutes] Error updating preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update preferences', error: error.message });
  }
});

// @route   POST /api/push-notifications/test
// @desc    Trigger a test push notification to verify the expert's phone receives it
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const result = await pushService.sendTestPush(req.user._id);
    res.json({
      success: true,
      message: 'Test notification triggered',
      details: result
    });
  } catch (error) {
    console.error('[PushRoutes] Error sending test push:', error);
    res.status(500).json({ success: false, message: 'Failed to send test notification', error: error.message });
  }
});

module.exports = router;
