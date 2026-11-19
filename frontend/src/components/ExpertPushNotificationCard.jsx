import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  PhoneCall,
  Video,
  MessageSquare,
  Volume2,
  VolumeX,
  Smartphone,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  triggerTestPushNotification
} from '../utils/pushManager';

export default function ExpertPushNotificationCard() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // PWA install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Notification Preferences
  const [preferences, setPreferences] = useState({
    push: true,
    chatPush: true,
    audioCallPush: true,
    videoCallPush: true,
    sounds: true,
    vibration: true
  });

  useEffect(() => {
    // 1. Check support and initial permission
    const isSupp = isPushSupported();
    setSupported(isSupp);
    if (!isSupp) return;

    setPermission(getNotificationPermission());

    // 2. Check if already subscribed on this device
    getExistingSubscription().then((sub) => {
      setIsSubscribed(Boolean(sub));
    });

    // 3. Fetch server preferences
    fetchNotificationPreferences()
      .then((prefs) => {
        if (prefs) setPreferences(prefs);
      })
      .catch((err) => {
        console.warn('Could not load notification preferences:', err);
      });

    // 4. Check if running as installed standalone PWA
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isNavStandalone = window.navigator.standalone === true; // iOS Safari
      setIsStandalone(Boolean(isDisplayStandalone || isNavStandalone));
    };
    checkStandalone();

    // 5. Capture PWA beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Handle Master Enable / Disable Push
  const handleTogglePush = async () => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await unsubscribeFromPush();
        if (success) {
          setIsSubscribed(false);
          setStatusMessage({ type: 'info', text: 'Push notifications disabled on this device.' });
        }
      } else {
        // Subscribe
        await subscribeToPush();
        setIsSubscribed(true);
        setPermission(getNotificationPermission());
        setStatusMessage({
          type: 'success',
          text: 'Push notifications enabled! You will now receive live WhatsApp-like calls and chat requests even when your browser is closed.'
        });
      }
    } catch (err) {
      console.error('Toggle push error:', err);
      setPermission(getNotificationPermission());
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update push notifications permission.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle individual preference toggle
  const handleTogglePreference = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await updateNotificationPreferences(updated);
    } catch (err) {
      console.error('Failed to update preference:', err);
      // Revert on error
      setPreferences(preferences);
    }
  };

  // Handle Test Notification
  const handleSendTest = async () => {
    setTestSending(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const res = await triggerTestPushNotification();
      setStatusMessage({
        type: 'success',
        text: 'Test notification dispatched! Check your device notification tray or lock screen.'
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to send test push notification.'
      });
    } finally {
      setTestSending(false);
    }
  };

  // Handle Install PWA
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setStatusMessage({ type: 'success', text: 'ExpertHub app successfully installed to your device!' });
    }
  };

  if (!supported) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0 text-amber-600" />
          <div>
            <h4 className="font-bold text-sm">Push Notifications Not Supported</h4>
            <p className="text-xs mt-0.5 opacity-90">
              Your current browser does not support the W3C Push API or Service Workers. For incoming calls when your screen is locked, please open ExpertHub in Google Chrome, Microsoft Edge, or install our Android/iOS PWA.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-50/50 via-white to-white dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
            isSubscribed 
              ? 'bg-amber-500 text-white' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
          }`}>
            {isSubscribed ? <BellRing size={22} className="animate-bounce" /> : <BellOff size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Incoming Call & Chat Push Notifications
              </h3>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                permission === 'granted' && isSubscribed
                  ? 'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                  : permission === 'denied'
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                {permission === 'granted' && isSubscribed ? 'Active & Receiving' : permission === 'denied' ? 'Permission Blocked' : 'Not Enabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Receive live WhatsApp-style audio calls, video calls, and chat requests on your mobile phone even when your browser is closed or phone screen is locked.
            </p>
          </div>
        </div>

        {/* Master Action Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleTogglePush}
            disabled={loading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
              isSubscribed
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {loading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : isSubscribed ? (
              <BellOff size={15} />
            ) : (
              <Bell size={15} />
            )}
            <span>{loading ? 'Configuring...' : isSubscribed ? 'Disable on this Device' : 'Enable Mobile Notifications'}</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage.text && (
        <div className={`px-5 py-3 text-xs sm:text-sm flex items-start gap-2.5 border-b ${
          statusMessage.type === 'success'
            ? 'bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'
            : statusMessage.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
        }`}>
          {statusMessage.type === 'success' && <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-600" />}
          {statusMessage.type === 'error' && <XCircle size={16} className="shrink-0 mt-0.5 text-red-600" />}
          {statusMessage.type === 'info' && <AlertTriangle size={16} className="shrink-0 mt-0.5 text-blue-600" />}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Permission Denied Guide */}
      {permission === 'denied' && (
        <div className="p-4 sm:p-5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs">
          <div className="flex items-start gap-2.5">
            <XCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold">Notification permission is currently blocked in your browser settings.</strong>
              <p>
                To enable incoming call rings: Click the <strong>lock icon 🔒</strong> in your browser address bar &rarr; select <strong>Site Settings</strong> &rarr; change <strong>Notifications</strong> to <strong>Allow</strong>, then refresh this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Notification Controls Grid */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Audio Call Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            preferences.audioCallPush && isSubscribed
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-75'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <PhoneCall size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Audio Calls</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">High priority ringtone</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.audioCallPush}
                  onChange={() => handleTogglePreference('audioCallPush')}
                  className="sr-only peer"
                  disabled={!isSubscribed}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-40"></div>
              </label>
            </div>
          </div>

          {/* Video Call Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            preferences.videoCallPush && isSubscribed
              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-75'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Video size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Video Calls</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Live camera consultation alert</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.videoCallPush}
                  onChange={() => handleTogglePreference('videoCallPush')}
                  className="sr-only peer"
                  disabled={!isSubscribed}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-40"></div>
              </label>
            </div>
          </div>

          {/* Chat Requests Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            preferences.chatPush && isSubscribed
              ? 'bg-green-50/40 dark:bg-green-950/20 border-green-200 dark:border-green-800/60'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-75'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Chat Requests</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">New client conversation alerts</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.chatPush}
                  onChange={() => handleTogglePreference('chatPush')}
                  className="sr-only peer"
                  disabled={!isSubscribed}
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-disabled:opacity-40"></div>
              </label>
            </div>
          </div>

        </div>

        {/* PWA App Status & Test Trigger Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Smartphone size={18} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Installed App Status: </span>
              {isStandalone ? (
                <span className="text-green-600 dark:text-green-400 font-bold">Standalone PWA Active</span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Browser Tab Mode</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Install App Button (if eligible) */}
            {deferredPrompt && !isStandalone && (
              <button
                type="button"
                onClick={handleInstallPWA}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Download size={13} />
                <span>Add App to Home Screen</span>
              </button>
            )}

            {/* Test Notification Button */}
            <button
              type="button"
              onClick={handleSendTest}
              disabled={!isSubscribed || testSending}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-40"
              title={isSubscribed ? 'Send a test push alert to verify notification sound and vibration' : 'Enable notifications first'}
            >
              {testSending ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
              <span>{testSending ? 'Sending...' : 'Test Push Notification'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
