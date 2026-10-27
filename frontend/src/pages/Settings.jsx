import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../components/UserLayout';
import { Settings as SettingsIcon, Bell, Lock } from 'lucide-react';
import { getApiUrl } from '../utils/apiConfig';

function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '', bio: '', location: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({
    email: { consultation: true, payment: true, wallet: true, messages: true, support: true, marketing: false },
    push: { consultation: true, messages: true, payment: true, wallet: false, support: true }
  });

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(getApiUrl('/settings/test-email'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', res.data.message || 'Test email sent successfully!');
    } catch (error) {
      console.error(error);
      showMessage('error', error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTestEmail(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(getApiUrl('/settings'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setUserData(data);
      setProfileForm({ name: data.name || '', mobile: data.mobile || '', bio: data.bio || '', location: data.location || '', gender: data.gender || '' });
      if (data.notificationPreferences) {
        setNotifications(data.notificationPreferences);
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          storedUser.notificationPreferences = data.notificationPreferences;
          localStorage.setItem('user', JSON.stringify(storedUser));
        } catch (e) {}
      }
    } catch (error) {
      console.error(error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleToggleNotification = async (channel, key, checked) => {
    const updatedNotifications = {
      ...notifications,
      [channel]: {
        ...notifications[channel],
        [key]: checked
      }
    };
    setNotifications(updatedNotifications);

    // Update localStorage user object immediately
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.notificationPreferences = updatedNotifications;
      localStorage.setItem('user', JSON.stringify(storedUser));
    } catch (e) {}

    // Dispatch real-time update event so header and notification dropdown update dynamically
    window.dispatchEvent(new CustomEvent('notifications-updated'));

    // Auto-save to backend
    try {
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl('/settings/preferences'), {
        notificationPreferences: updatedNotifications
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', `${channel === 'email' ? 'Email' : 'Push'} ${key} notification turned ${checked ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('Failed to auto-save preference:', error);
      showMessage('error', 'Failed to sync preferences to server');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl('/settings/profile'), profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Profile updated successfully');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showMessage('error', 'New passwords do not match');
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl('/settings/password'), {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(getApiUrl('/settings/preferences'), {
        notificationPreferences: notifications
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.notificationPreferences = notifications;
        localStorage.setItem('user', JSON.stringify(storedUser));
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      showMessage('success', 'Preferences updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(getApiUrl('/settings/deactivate'), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      showMessage('error', 'Failed to deactivate account');
    }
  };

  if (loading) {
    return (
      <UserLayout title="Settings" subtitle="Manage your account settings and preferences">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UserLayout>
    );
  }

  const tabs = [
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <UserLayout title="Settings" subtitle="Manage your account settings and preferences">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-5 w-full">
        
        {/* Sidebar */}
        <div className="w-full md:w-60 shrink-0 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <SettingsIcon size={16} /> Settings Menu
              </h3>
            </div>
            <div className="p-1.5 flex flex-col gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone moved to left sidebar under Settings Menu */}
          <div className="bg-red-50/90 rounded-xl border border-red-200/80 p-4 shadow-2xs">
            <h4 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h4>
            <p className="text-red-600 text-xs mb-3 leading-relaxed">
              Once you deactivate your account, there is no going back. Please be certain.
            </p>
            <button 
              onClick={handleDeactivate} 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs text-center active:scale-98"
            >
              Deactivate Account
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          {message.text && (
            <div className={`mb-4 p-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {message.text}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4 sm:space-y-5 w-full">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Change Password</h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <form onSubmit={handlePasswordSave} className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                      <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full px-3.5 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">New Password</label>
                      <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-3.5 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                      <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-3.5 py-2 sm:py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500" required />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-50">
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">Notification Preferences</h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage how you receive alerts and updates.</p>
                </div>
                <button onClick={handlePreferencesSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl transition-all text-xs sm:text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
              <div className="p-4 sm:p-5 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">notifications_active</span> In-App / Push Notifications
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Control notifications in your header bell icon and live screen popups.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {Object.keys(notifications.push).map(key => {
                      const labels = {
                        consultation: { title: 'Consultation & Bookings', desc: 'Alerts when booking is confirmed, expert joins, or call starts' },
                        messages: { title: 'Chat & Direct Messages', desc: 'Instant alerts when you receive a new chat message' },
                        payment: { title: 'Payment & Billing', desc: 'Updates on invoice generation, payments, and refunds' },
                        wallet: { title: 'Wallet & Recharge', desc: 'Alerts on wallet balance additions and consultation deductions' },
                        support: { title: 'Customer Support', desc: 'Updates on your complaints, tickets, and inquiries' }
                      };
                      const item = labels[key] || { title: `${key} Alerts`, desc: `Enable or disable ${key} notifications` };

                      return (
                        <div key={`push-${key}`} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white transition-all flex items-center justify-between">
                          <div className="pr-4">
                            <span className="text-slate-800 font-semibold text-sm block">{item.title}</span>
                            <span className="text-slate-500 text-xs">{item.desc}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={!!notifications.push[key]} 
                              onChange={(e) => handleToggleNotification('push', key, e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h4 className="font-bold text-slate-800 mb-1 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">mail</span> Email Notifications
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">Emails sent directly to your registered inbox.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {Object.keys(notifications.email).map(key => {
                      const labels = {
                        consultation: { title: 'Consultation & Appointments', desc: 'Email reminders before consultations and summary after completion' },
                        payment: { title: 'Payment Invoices', desc: 'Receipts and transaction invoices sent to your email' },
                        wallet: { title: 'Wallet Transactions', desc: 'Email confirmation for money added or refunded to wallet' },
                        messages: { title: 'Unread Message Digests', desc: 'Summary of unread messages when you are offline' },
                        support: { title: 'Helpdesk & Ticket Replies', desc: 'Email responses from support team for open queries' },
                        marketing: { title: 'Offers & Promotions', desc: 'Periodic emails with seasonal discounts and new feature announcements' }
                      };
                      const item = labels[key] || { title: `${key} Updates`, desc: `Enable or disable ${key} emails` };

                      return (
                        <div key={`email-${key}`} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white transition-all flex items-center justify-between">
                          <div className="pr-4">
                            <span className="text-slate-800 font-semibold text-sm block">{item.title}</span>
                            <span className="text-slate-500 text-xs">{item.desc}</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={!!notifications.email[key]} 
                              onChange={(e) => handleToggleNotification('email', key, e.target.checked)} 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </UserLayout>
  );
}

export default Settings;
