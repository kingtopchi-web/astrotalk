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
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '', bio: '', location: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({
    email: { consultation: true, payment: true, wallet: true, messages: true, support: true, marketing: false },
    push: { consultation: true, messages: true, payment: true, wallet: false, support: true }
  });

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
      if (data.notificationPreferences) setNotifications(data.notificationPreferences);
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

        </div>
      </div>
    </UserLayout>
  );
}

export default Settings;
