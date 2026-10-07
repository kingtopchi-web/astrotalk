import React, { useState, useEffect } from 'react';
import { Save, Bell, Lock, Building2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ExpertSettings = () => {
  const { user, login } = useAuth(); // login function can update local user state if needed
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notificationPreferences: {
      email: true,
      push: true
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        notificationPreferences: user.notificationPreferences || { email: true, push: true },
        bankDetails: user.bankDetails || {
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: ''
        }
      }));
    }
  }, [user]);

  const handleChange = (e, section) => {
    const { name, value, type, checked } = e.target;
    
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (section) => {
    try {
      setLoading(true);
      const payload = {};
      
      if (section === 'security') {
        if (!formData.currentPassword || !formData.newPassword) {
          alert('Please enter current and new passwords');
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          alert('New passwords do not match');
          return;
        }
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      } else if (section === 'notifications') {
        payload.notificationPreferences = formData.notificationPreferences;
      } else if (section === 'bank') {
        payload.bankDetails = formData.bankDetails;
      }
      const token = localStorage.getItem('token');
      const res = await axios.put('https://astrotalk-hlg2.onrender.com/api/experts/settings', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      
      if (res.data.expert) {
        // Optionally update the context user
        // login(res.data.expert, token);
      }

      if (section === 'security') {
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and security</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 flex md:flex-col p-4 gap-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium whitespace-nowrap ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Bell size={18} />
            Notifications
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium whitespace-nowrap ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Lock size={18} />
            Security & Password
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium whitespace-nowrap ${activeTab === 'bank' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
          >
            <Building2 size={18} />
            Bank Details
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 sm:p-8">
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Notification Preferences</h2>
              
              <div className="space-y-4 max-w-md">
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 transition-colors">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="email"
                      checked={formData.notificationPreferences.email}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" 
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Email Notifications</div>
                    <div className="text-sm text-slate-500">Receive emails for new bookings, messages, and updates.</div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-blue-300 transition-colors">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="push"
                      checked={formData.notificationPreferences.push}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600" 
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">Push Notifications</div>
                    <div className="text-sm text-slate-500">Receive browser notifications for real-time alerts.</div>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button onClick={() => handleSave('notifications')} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70">
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Security & Password</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Password</label>
                  <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">New Password</label>
                  <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>

              <div className="pt-4">
                <button onClick={() => handleSave('security')} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70">
                  <Save size={18} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-xl font-bold text-slate-800 border-b pb-4">Bank Details (Payouts)</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Holder Name</label>
                  <input type="text" name="accountName" value={formData.bankDetails.accountName} onChange={(e) => handleChange(e, 'bankDetails')} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Account Number</label>
                  <input type="text" name="accountNumber" value={formData.bankDetails.accountNumber} onChange={(e) => handleChange(e, 'bankDetails')} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Enter Account Number" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input type="text" name="ifscCode" value={formData.bankDetails.ifscCode} onChange={(e) => handleChange(e, 'bankDetails')} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. HDFC0001234" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={(e) => handleChange(e, 'bankDetails')} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. HDFC Bank" />
                </div>
              </div>

              <div className="pt-4">
                <button onClick={() => handleSave('bank')} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-70">
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ExpertSettings;
