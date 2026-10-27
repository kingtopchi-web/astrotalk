import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Sliders,
  Save, CheckCircle, RefreshCw, Mail, Phone,
  Percent, Clock, AlertCircle
} from 'lucide-react';
import { LOCAL_API_URL, PROD_API_URL, isLocalhost } from '../utils/apiConfig';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // General
    platformName: 'Stitch Consultation Marketplace',
    supportEmail: 'support@stitchplatform.com',
    contactPhone: '+91 98765 43210',
    currency: 'INR',
    timezone: 'Asia/Kolkata (IST)',
    address: 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
    
    // Consultation & Commission
    platformCommissionRate: '20',
    minimumConsultationDuration: '15',
    cancellationWindowHours: '2',
    autoApproveExperts: false,
    enableInstantBooking: true,
    enableFreeChat: true,
    freeChatDurationMinutes: '5',
    
    // Security
    sessionTimeoutMinutes: '60',
    requireEmailVerification: true,
    twoFactorAdmin: false,
    maxLoginAttempts: '5',
    
    // Notifications
    emailNewBookings: true,
    emailExpertApplications: true,
    smsSessionReminders: true,
    adminAlertWeeklyDigest: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const getAdminApiUrls = () => {
    return isLocalhost
      ? [`${LOCAL_API_URL}/admin/settings`, `${PROD_API_URL}/admin/settings`]
      : [`${PROD_API_URL}/admin/settings`, `${LOCAL_API_URL}/admin/settings`];
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const urls = getAdminApiUrls();

      for (const url of urls) {
        try {
          const response = await fetch(url, { headers });
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({ ...prev, ...data }));
            return;
          }
        } catch (err) {
          // try next
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const urls = getAdminApiUrls();
      let saved = false;

      // Save to primary and also sync if both available
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(formData)
          });
          if (response.ok) {
            saved = true;
          }
        } catch (err) {
          // ignore error on secondary
        }
      }

      if (saved) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'consultation', label: 'Consultations & Rates', icon: Percent },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <SettingsIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
              <p className="text-sm text-slate-500">Configure marketplace behavior, commissions, security, and alerts.</p>
            </div>
          </div>
        </div>

        {/* Save button & status */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in">
              <CheckCircle size={15} />
              <span>Settings saved!</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main layout with tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-sm space-y-1 h-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">General Platform Information</h2>
                <p className="text-sm text-slate-500">Core details displayed across notifications, invoices, and customer communications.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    name="platformName"
                    value={formData.platformName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>


                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Office / Support Address
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. CONSULTATIONS TAB */}
          {activeTab === 'consultation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Consultation & Commission Rules</h2>
                <p className="text-sm text-slate-500">Define marketplace take rate, duration rules, and booking policies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Platform Fee (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="platformCommissionRate"
                      value={formData.platformCommissionRate}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="w-32 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-500">% deducted per consultation</span>
                  </div>
                  <p className="text-xs text-slate-400">Current take: 15% to Stitch, 85% to the expert.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Minimum Duration (Minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="minimumConsultationDuration"
                      value={formData.minimumConsultationDuration}
                      onChange={handleChange}
                      min="5"
                      step="5"
                      className="w-32 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-500">Minutes</span>
                  </div>
                  <p className="text-xs text-slate-400">Shortest allowed bookable session slot.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Auto-Approve Expert Applications</p>
                    <p className="text-xs text-slate-400">If enabled, new expert registrations are instantly approved.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoApproveExperts"
                    checked={formData.autoApproveExperts}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Enable Instant Booking</p>
                    <p className="text-xs text-slate-400">Allow users to initiate immediate calls and consultations without advance scheduling.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="enableInstantBooking"
                    checked={formData.enableInstantBooking}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Free Chat Dynamic Controls */}
              <div className="p-5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        1-Time Free Chat Consultation Rules
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Dynamic Admin Rule
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Allow a user to chat for free with an expert once per account ID. Time limit is strictly enforced: session terminates automatically on expiry. Zero charges deducted from user wallet, and zero payout to expert.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      name="enableFreeChat"
                      checked={formData.enableFreeChat}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Free Chat Duration Time Limit (Minutes)
                    </label>
                    <p className="text-xs text-slate-500">
                      Duration allowed for free consultation. When timer hits 00:00, session immediately terminates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      name="freeChatDurationMinutes"
                      value={formData.freeChatDurationMinutes}
                      onChange={handleChange}
                      min="1"
                      max="60"
                      className="w-24 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                    />
                    <span className="text-xs font-bold text-slate-600">Minutes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
