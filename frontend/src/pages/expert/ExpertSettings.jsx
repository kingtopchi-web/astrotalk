import React, { useState, useEffect } from 'react';
import { Save, Bell, Lock, Building2, Check, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../utils/apiConfig';

const ExpertSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

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
      setStatusMessage({ type: '', text: '' });
      const token = localStorage.getItem('token');
      
      let payload = {};
      if (section === 'notifications') {
        payload = { notificationPreferences: formData.notificationPreferences };
      } else if (section === 'security') {
        if (!formData.currentPassword || !formData.newPassword) {
          setStatusMessage({ type: 'error', text: 'Please fill in both current and new password' });
          setLoading(false);
          return;
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setStatusMessage({ type: 'error', text: 'New passwords do not match' });
          setLoading(false);
          return;
        }
        payload = {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        };
      } else if (section === 'bank') {
        payload = { bankDetails: formData.bankDetails };
      }

      const res = await axios.put(getApiUrl('/experts/settings'), payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStatusMessage({ type: 'success', text: res.data.message || 'Settings updated successfully' });

      if (section === 'security') {
        setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      }
    } catch (error) {
      setStatusMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences, security, and payout methods</p>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in ${
          statusMessage.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="font-bold text-xs hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:flex-row w-full">
        {/* Sidebar tabs */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-100 bg-[#FAF8F5] flex md:flex-col p-4 sm:p-5 gap-2 shrink-0 overflow-x-auto">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('notifications');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab('security');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'security' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Lock size={18} />
            <span>Security & Password</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setActiveTab('bank');
              setStatusMessage({ type: '', text: '' });
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm whitespace-nowrap cursor-pointer ${
              activeTab === 'bank' 
                ? 'bg-[#D97706] text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Building2 size={18} />
            <span>Bank Details</span>
          </button>
        </div>

        {/* Content area: Expands to fill full width naturally */}
        <div className="flex-1 p-6 sm:p-8 md:p-10 min-w-0 w-full">
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Notification Preferences</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Control how you receive booking alerts and message updates.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white cursor-pointer hover:border-amber-300 transition-all shadow-2xs">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="email"
                      checked={formData.notificationPreferences.email}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer" 
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Email Notifications</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">Receive emails for new bookings, messages, and payout updates.</div>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white cursor-pointer hover:border-amber-300 transition-all shadow-2xs">
                  <div className="flex items-center h-5 mt-1">
                    <input 
                      type="checkbox" 
                      name="push"
                      checked={formData.notificationPreferences.push}
                      onChange={(e) => handleChange(e, 'notificationPreferences')}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer" 
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Push Notifications</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">Receive instant browser alerts when a client calls or joins.</div>
                  </div>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleSave('notifications')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Security & Password</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Update your account password to maintain security.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange} 
                    placeholder="Enter current password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange} 
                    placeholder="Enter new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    placeholder="Repeat new password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleSave('security')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-6 w-full">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Bank Details (Payouts)</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Add your bank account to receive automated consultation payouts.</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck size={14} />
                  <span>Direct NEFT/IMPS</span>
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Holder Name</label>
                  <input 
                    type="text" 
                    name="accountName" 
                    value={formData.bankDetails.accountName} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="e.g. Ramesh Kumar" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Name</label>
                  <input 
                    type="text" 
                    name="bankName" 
                    value={formData.bankDetails.bankName} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="e.g. HDFC Bank" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Number</label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={formData.bankDetails.accountNumber} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800" 
                    placeholder="Enter Bank Account Number" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">IFSC Code</label>
                  <input 
                    type="text" 
                    name="ifscCode" 
                    value={formData.bankDetails.ifscCode} 
                    onChange={(e) => handleChange(e, 'bankDetails')} 
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none text-slate-800 uppercase" 
                    placeholder="e.g. HDFC0001234" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="button"
                  onClick={() => handleSave('bank')} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-70 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{loading ? 'Saving...' : 'Save Bank Details'}</span>
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
