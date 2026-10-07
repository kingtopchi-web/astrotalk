import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserLayout from '../components/UserLayout';
import { Settings as SettingsIcon, Bell, Lock, User, Shield, Moon, Globe, LogOut } from 'lucide-react';

function Settings() {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '', bio: '', location: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({
    email: { consultation: true, payment: true, wallet: true, messages: true, support: true, marketing: false },
    push: { consultation: true, messages: true, payment: true, wallet: false, support: true }
  });
  const [privacy, setPrivacy] = useState({ profileVisibility: 'public', onlineStatus: true, readReceipts: true });
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      setUserData(data);
      setProfileForm({ name: data.name || '', mobile: data.mobile || '', bio: data.bio || '', location: data.location || '', gender: data.gender || '' });
      if (data.notificationPreferences) setNotifications(data.notificationPreferences);
      if (data.privacySettings) setPrivacy(data.privacySettings);
      if (data.theme) setTheme(data.theme);
      if (data.language) setLanguage(data.language);
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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/settings/profile', profileForm, {
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
      await axios.put('http://localhost:5000/api/settings/password', {
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
      await axios.put('http://localhost:5000/api/settings/preferences', {
        notificationPreferences: notifications,
        privacySettings: privacy,
        theme,
        language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      await axios.post('http://localhost:5000/api/settings/deactivate', {}, {
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
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Moon }
  ];

  return (
    <UserLayout title="Settings" subtitle="Manage your account settings and preferences">
      <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <SettingsIcon size={18} /> Settings Menu
              </h3>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {message.text}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800">Change Password</h3>
                  <p className="text-slate-500 text-sm mt-1">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <form onSubmit={handlePasswordSave} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                    <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                    <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500" required />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={saving} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50">
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
                <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
                <p className="text-red-600 text-sm mb-4">Once you deactivate your account, there is no going back. Please be certain.</p>
                <button onClick={handleDeactivate} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors">
                  Deactivate Account
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Notification Preferences</h3>
                  <p className="text-slate-500 text-sm mt-1">Manage how you receive alerts and updates.</p>
                </div>
                <button onClick={handlePreferencesSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
              <div className="p-6">
                <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Email Notifications</h4>
                <div className="space-y-4 mb-8">
                  {Object.keys(notifications.email).map(key => (
                    <div key={`email-${key}`} className="flex items-center justify-between">
                      <span className="text-slate-700 capitalize font-medium">{key} Updates</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notifications.email[key]} onChange={(e) => setNotifications({...notifications, email: {...notifications.email, [key]: e.target.checked}})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Push Notifications</h4>
                <div className="space-y-4">
                  {Object.keys(notifications.push).map(key => (
                    <div key={`push-${key}`} className="flex items-center justify-between">
                      <span className="text-slate-700 capitalize font-medium">{key} Alerts</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notifications.push[key]} onChange={(e) => setNotifications({...notifications, push: {...notifications.push, [key]: e.target.checked}})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Appearance Tabs are similar structurally */}
          {(activeTab === 'privacy' || activeTab === 'appearance') && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{activeTab === 'privacy' ? 'Privacy Settings' : 'Appearance'}</h3>
                <button onClick={handlePreferencesSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-all text-sm disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="p-6 space-y-6">
                {activeTab === 'privacy' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Profile Visibility</label>
                      <select value={privacy.profileVisibility} onChange={e => setPrivacy({...privacy, profileVisibility: e.target.value})} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="experts_only">Experts Only</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <div>
                        <span className="block text-slate-700 font-bold">Online Status</span>
                        <span className="text-sm text-slate-500">Show when you are active on the platform</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacy.onlineStatus} onChange={e => setPrivacy({...privacy, onlineStatus: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <div>
                        <span className="block text-slate-700 font-bold">Read Receipts</span>
                        <span className="text-sm text-slate-500">Let experts know when you've read their messages</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacy.readReceipts} onChange={e => setPrivacy({...privacy, readReceipts: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </>
                )}
                {activeTab === 'appearance' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Theme Preference</label>
                      <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                      <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-slate-200 bg-white">
                        <option value="en">English (US)</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </UserLayout>
  );
}

export default Settings;
