import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon, Sliders,
  Save, CheckCircle, RefreshCw, Mail, Phone,
  Percent, Clock, AlertCircle, MapPin, CreditCard, ArrowRight,
  Image as ImageIcon, Plus, Trash2, ExternalLink, ShieldCheck,
  Share2, Star, MessageSquare, AlertTriangle, Calendar
} from 'lucide-react';
import adminApi, { LOCAL_API_URL, PROD_API_URL, isLocalhost, ADMIN_API_URL } from '../utils/apiConfig';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // General
    platformName: 'Stitch Consultation Marketplace',
    enableMarketplace: true,
    platformLogo: '',
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
    minimumExpertDistanceKm: '0',
    minPayoutAmount: '100',
    callSafetyTips: '• अपनी प्राइवेसी बनाए रखने के लिए अपना मोबाइल नंबर, नाम, पता, बैंक A/C नंबर या OTP किसी से शेयर न करें।\n• प्लेटफॉर्म के बाहर किसी से भी पैसे का लेन-देन न करें।\n• किसी भी असुरक्षित स्थान पर किसी से व्यक्तिगत रूप से न मिलें।\n• किसी के बहकावे अथवा लालच के शिकार न हों।',

    // Chat Retention & History Policy (Dynamic Admin Control)
    enableAutoDeleteOldChats: false,
    chatRetentionDays: '30',

    // Payout Schedule & Rules
    payoutDaysInterval: 7,
    payoutEstimatedDays: 3,

    // Hero Slider
    heroSlides: [],

    // Homepage 3-Column Stats Card
    homeStats: {
      stat1Value: '100k+',
      stat1Label: 'Consultations',
      stat2Value: '4.9',
      stat2Label: 'Avg. Rating',
      stat3Value: 'Top 1%',
      stat3Label: 'Vetted Minds',
    },

    // Footer Social Media Links
    socialLinks: {
      instagram: '',
      facebook: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
    
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

  const [newSlide, setNewSlide] = useState({
    image: '',
    title: '',
    subtitle: '',
    link: '',
    order: 1,
    isActive: true,
  });

  // Chat History Retention & Cleanup States
  const [chatStats, setChatStats] = useState(null);
  const [loadingChatStats, setLoadingChatStats] = useState(false);
  const [purgingChats, setPurgingChats] = useState(false);
  const [purgeCustomDays, setPurgeCustomDays] = useState('30');
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeActionResult, setPurgeActionResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'chatCleanup') {
      fetchChatStats();
    }
  }, [activeTab]);

  const fetchChatStats = async () => {
    try {
      setLoadingChatStats(true);
      const res = await adminApi.get('/chat-cleanup/stats');
      if (res.data.success) {
        setChatStats(res.data);
        if (res.data.retentionDays) {
          setPurgeCustomDays(String(res.data.retentionDays));
        }
      }
    } catch (err) {
      console.error('Failed to load chat stats:', err);
    } finally {
      setLoadingChatStats(false);
    }
  };

  const handlePurgeChats = async () => {
    try {
      setPurgingChats(true);
      setPurgeActionResult(null);
      const days = Number(purgeCustomDays) || Number(formData.chatRetentionDays) || 30;
      const res = await adminApi.post('/chat-cleanup/purge', { days });
      if (res.data.success) {
        setPurgeActionResult({
          type: 'success',
          text: res.data.message
        });
        setShowPurgeModal(false);
        fetchChatStats();
      }
    } catch (err) {
      setPurgeActionResult({
        type: 'error',
        text: err.response?.data?.message || 'Failed to purge chat messages'
      });
    } finally {
      setPurgingChats(false);
    }
  };

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
            setFormData(prev => ({
              ...prev,
              ...data,
              enableMarketplace: data.enableMarketplace !== false,
              homeStats: {
                ...prev.homeStats,
                ...(data.homeStats || {})
              },
              socialLinks: {
                ...prev.socialLinks,
                ...(data.socialLinks || {})
              }
            }));
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

  const handleLogoFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, platformLogo: reader.result }));
      setSaveSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSlideFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Banner image size must be less than 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewSlide(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const persistSettings = async (dataToPersist) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const urls = getAdminApiUrls();
      let saved = false;

      // Clean metadata fields to avoid immutable field issues
      const cleanData = { ...dataToPersist };
      delete cleanData._id;
      delete cleanData.__v;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.singletonKey;

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(cleanData)
          });
          if (response.ok) {
            saved = true;
          }
        } catch (err) {
          // ignore secondary URL failure
        }
      }

      if (saved) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
      return saved;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    await persistSettings(formData);
  };

  const normalizeImageUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    // Auto-convert Unsplash webpage link to direct CDN downloadable image
    const unsplashMatch = trimmed.match(/unsplash\.com\/photos\/(?:[^\/]+-)?([a-zA-Z0-9_-]+)/);
    if (unsplashMatch && unsplashMatch[1]) {
      return `https://unsplash.com/photos/${unsplashMatch[1]}/download?w=1200&q=80`;
    }
    return trimmed;
  };

  const normalizeLinkUrl = (rawLink) => {
    if (!rawLink || typeof rawLink !== 'string') return '';
    const trimmed = rawLink.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    if (trimmed.includes('.') || trimmed.startsWith('www.')) {
      return `https://${trimmed}`;
    }
    return `/${trimmed}`;
  };

  const handleAddSlide = async () => {
    if (!newSlide.image?.trim()) {
      alert('Please enter an image URL for the slide.');
      return;
    }
    const currentSlides = formData.heroSlides || [];
    const newSlideItem = {
      image: normalizeImageUrl(newSlide.image),
      title: newSlide.title.trim(),
      subtitle: newSlide.subtitle.trim(),
      link: normalizeLinkUrl(newSlide.link),
      order: newSlide.order ? Number(newSlide.order) : currentSlides.length + 1,
      isActive: newSlide.isActive !== false,
    };
    const updated = [...currentSlides, newSlideItem];
    const updatedFormData = { ...formData, heroSlides: updated };
    setFormData(updatedFormData);
    setNewSlide({
      image: '',
      title: '',
      subtitle: '',
      link: '',
      order: updated.length + 1,
      isActive: true,
    });
    // Immediately persist to backend so admin doesn't need to manually click Save Changes
    await persistSettings(updatedFormData);
  };

  const handleToggleSlideActive = async (index) => {
    const updated = [...(formData.heroSlides || [])];
    updated[index] = {
      ...updated[index],
      isActive: !updated[index].isActive,
    };
    const updatedFormData = { ...formData, heroSlides: updated };
    setFormData(updatedFormData);
    await persistSettings(updatedFormData);
  };

  const handleDeleteSlide = async (index) => {
    const updated = [...(formData.heroSlides || [])];
    updated.splice(index, 1);
    const updatedFormData = { ...formData, heroSlides: updated };
    setFormData(updatedFormData);
    await persistSettings(updatedFormData);
  };

  const handleImportDefaultSlides = async () => {
    const defaultSlides = [
      {
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
        title: "Verified Experts",
        subtitle: "100% Certified Professionals",
        link: "/category/all",
        order: 1,
        isActive: true,
      },
      {
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
        title: "Top Consultants",
        subtitle: "Astrologers, Lawyers & Counselors",
        link: "/category/all",
        order: 2,
        isActive: true,
      },
      {
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
        title: "Instant Guidance",
        subtitle: "Audio, Video & Live Chat Consultations",
        link: "/category/all",
        order: 3,
        isActive: true,
      },
    ];
    const updated = [...(formData.heroSlides || []), ...defaultSlides];
    const updatedFormData = { ...formData, heroSlides: updated };
    setFormData(updatedFormData);
    await persistSettings(updatedFormData);
  };

  const handleHomeStatChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      homeStats: {
        ...(prev.homeStats || {}),
        [field]: value
      }
    }));
    setSaveSuccess(false);
  };

  const handleSocialLinkChange = (network, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [network]: value
      }
    }));
    setSaveSuccess(false);
  };

  const tabs = [
    { id: 'general', label: 'General & Logo', icon: Sliders },
    { id: 'heroSlider', label: 'Home Hero Slider', icon: ImageIcon },
    { id: 'socialAndStats', label: 'Stats & Social Links', icon: Share2 },
    { id: 'payouts', label: 'Payout Schedule & Limits', icon: Clock },
    { id: 'consultation', label: 'Consultations & Rates', icon: Percent },
    { id: 'chatCleanup', label: 'Chat History & Auto-Delete', icon: MessageSquare },
    { id: 'razorpay', label: 'Razorpay Multi-Account', icon: CreditCard },
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm space-y-1 h-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs border border-blue-200/60 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">General Platform Information</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Core details displayed across notifications, invoices, and customer communications.</p>
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

              {/* Platform Logo & Branding */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={18} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Platform Brand Logo</h3>
                  </div>
                  {formData.platformLogo && (
                    <button
                      type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, platformLogo: '' })); setSaveSuccess(false); }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                  <div className="md:col-span-2 space-y-3">
                    {/* Option 1: Upload from local files/downloads */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                        Upload Logo from Local Files / Device
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Select a logo image (.png, .svg, .jpg, .webp) directly from your computer, downloads, or mobile storage (Max 5MB).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
                      <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                      <span>OR ENTER URL</span>
                      <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                    </div>

                    {/* Option 2: Enter URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Logo Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        name="platformLogo"
                        value={formData.platformLogo?.startsWith('data:') ? '' : (formData.platformLogo || '')}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png or leave blank"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <p className="text-xs text-slate-400">
                      Yeh logo user Header, Footer, aur Admin Portal navigation bar par dynamic display hoga.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-white min-h-[120px] shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-2">Live Logo Preview</span>
                    <img
                      src={formData.platformLogo || '/logo.png'}
                      alt="Logo Preview"
                      onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                      className="max-h-16 max-w-[160px] object-contain"
                    />
                    <span className="text-[10px] text-slate-400 mt-2 font-mono">
                      {formData.platformLogo?.startsWith('data:') ? 'Local file uploaded' : formData.platformLogo ? 'Custom URL' : 'Default /logo.png'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HERO SLIDER TAB */}
          {activeTab === 'heroSlider' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Homepage Hero Slider & Banners</h2>
                  <p className="text-sm text-slate-500">
                    Add and customize hero banner slides displayed on the homepage. Each slide supports an interactive redirect URL when clicked.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {formData.heroSlides?.length || 0} Slides Configured
                </span>
              </div>

              {/* Add New Slide Form */}
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Plus size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Add New Hero Banner Slide</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    {/* Option 1: File Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Upload Banner from Local Files / Downloads *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlideFileUpload}
                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Select a hero banner image from your device (Recommended ratio 16:9 or wide banner, max 8MB).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span>OR ENTER IMAGE URL</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    {/* Option 2: Image URL */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Banner Image URL
                      </label>
                      <input
                        type="text"
                        value={newSlide.image?.startsWith('data:') ? '' : (newSlide.image || '')}
                        onChange={(e) => setNewSlide(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="e.g. https://images.unsplash.com/... or https://example.com/banner.jpg"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {newSlide.image?.trim() && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-white w-fit shadow-xs">
                        <img
                          src={normalizeImageUrl(newSlide.image)}
                          alt="Preview"
                          className="w-24 h-14 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const warningEl = document.getElementById('slide-preview-error');
                            if (warningEl) warningEl.style.display = 'block';
                          }}
                          onLoad={() => {
                            const warningEl = document.getElementById('slide-preview-error');
                            if (warningEl) warningEl.style.display = 'none';
                          }}
                        />
                        <div className="space-y-0.5 text-xs">
                          <span className="font-bold text-slate-800 block">
                            {newSlide.image?.startsWith('data:') ? 'Local file selected' : 'Online URL selected'}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-medium">✓ Ready to be added</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewSlide(prev => ({ ...prev, image: '' }))}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-2 px-2 py-1"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Slide Title / Heading (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSlide.title}
                      onChange={(e) => setNewSlide(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Instant Guidance From Certified Experts"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Subtitle / Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={newSlide.subtitle}
                      onChange={(e) => setNewSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="e.g. Verified Astrologers & Counselors"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Click Redirect Link / URL
                    </label>
                    <input
                      type="text"
                      value={newSlide.link}
                      onChange={(e) => setNewSlide(prev => ({ ...prev, link: e.target.value }))}
                      placeholder="e.g. /experts or /experts?category=astrology or https://..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Users clicking this banner will be redirected here.</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Display Order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newSlide.order}
                        onChange={(e) => setNewSlide(prev => ({ ...prev, order: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={handleAddSlide}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        <span>{saving ? 'Adding & Saving...' : 'Add & Save Slide'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Slides List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Slides & Banners</h3>
                  {formData.heroSlides?.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>{saving ? 'Saving...' : 'Save All Slides'}</span>
                    </button>
                  )}
                </div>

                {(!formData.heroSlides || formData.heroSlides.length === 0) ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                    <ImageIcon size={32} className="mx-auto text-slate-400 dark:text-slate-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No custom hero slides configured yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                      The homepage is currently displaying the built-in default hero banners. Add your custom banner slide above, or import the default slides to customize them!
                    </p>
                    <button
                      type="button"
                      onClick={handleImportDefaultSlides}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Plus size={14} className="text-blue-600" />
                      <span>Import Default 3 Slides to Edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.heroSlides.map((slide, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          slide.isActive !== false
                            ? 'border-slate-200 bg-white shadow-xs'
                            : 'border-slate-200/60 bg-slate-50/80 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Image preview */}
                          <div className="w-24 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                            <img
                              src={slide.image}
                              alt={slide.title || `Slide ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                            />
                          </div>

                          {/* Slide details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                #{slide.order || idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {slide.title || `Slide #${idx + 1}`}
                              </h4>
                              {slide.subtitle && (
                                <span className="text-xs text-slate-500 truncate">• {slide.subtitle}</span>
                              )}
                              {slide.isActive !== false ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Redirect Link */}
                            {slide.link ? (
                              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium truncate">
                                <ExternalLink size={13} className="shrink-0" />
                                <span className="truncate">Redirects to: {slide.link}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No redirect link set (display only)</p>
                            )}
                          </div>

                          {/* Quick controls */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSlideActive(idx)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                slide.isActive !== false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {slide.isActive !== false ? 'Enabled' : 'Disabled'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSlide(idx)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Slide"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATS & SOCIAL LINKS TAB */}
          {activeTab === 'socialAndStats' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Homepage Stats & Footer Social Links</h2>
                  <p className="text-sm text-slate-500">
                    Customize the 3-column stats card on the homepage and social media links in the platform footer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

              {/* 1. Homepage 3-Column Stats Card Section */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                    <Star size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Homepage 3-Column Stats Card (Trust Bar)</h3>
                    <p className="text-xs text-slate-500">Configure values and labels displayed in the trust stats bar on the homepage.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Column 1 */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Column 1 (Counter)</span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Value / Number</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat1Value || ''}
                        onChange={(e) => handleHomeStatChange('stat1Value', e.target.value)}
                        placeholder="e.g. 100k+"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Label / Title</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat1Label || ''}
                        onChange={(e) => handleHomeStatChange('stat1Label', e.target.value)}
                        placeholder="e.g. Consultations"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Column 2 (Rating)</span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Value / Rating</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat2Value || ''}
                        onChange={(e) => handleHomeStatChange('stat2Value', e.target.value)}
                        placeholder="e.g. 4.9"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Label / Title</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat2Label || ''}
                        onChange={(e) => handleHomeStatChange('stat2Label', e.target.value)}
                        placeholder="e.g. Avg. Rating"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Column 3 (Vetting)</span>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Value / Metric</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat3Value || ''}
                        onChange={(e) => handleHomeStatChange('stat3Value', e.target.value)}
                        placeholder="e.g. Top 1%"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Label / Title</label>
                      <input
                        type="text"
                        value={formData.homeStats?.stat3Label || ''}
                        onChange={(e) => handleHomeStatChange('stat3Label', e.target.value)}
                        placeholder="e.g. Vetted Minds"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Homepage Live Preview
                  </span>
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-3 divide-x divide-slate-200 text-center">
                    <div>
                      <p className="font-heading font-extrabold text-base sm:text-xl text-slate-900">
                        {formData.homeStats?.stat1Value || '100k+'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formData.homeStats?.stat1Label || 'Consultations'}
                      </p>
                    </div>
                    <div>
                      <p className="font-heading font-extrabold text-base sm:text-xl text-slate-900 flex items-center justify-center gap-1">
                        {formData.homeStats?.stat2Value || '4.9'} <Star size={13} className="fill-amber-500 text-amber-500 inline" />
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formData.homeStats?.stat2Label || 'Avg. Rating'}
                      </p>
                    </div>
                    <div>
                      <p className="font-heading font-extrabold text-base sm:text-xl text-slate-900">
                        {formData.homeStats?.stat3Value || 'Top 1%'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formData.homeStats?.stat3Label || 'Vetted Minds'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Footer Social Media Links Section */}
              <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Footer Social Media Links</h3>
                    <p className="text-xs text-slate-500">Configure profile URLs for social icons displayed in the website footer.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Instagram Profile URL
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle or instagram.com/..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  {/* Facebook */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Facebook Page URL
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Twitter / X */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Twitter / X Profile URL
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                      placeholder="https://x.com/yourhandle"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-800"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      LinkedIn Page URL
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      YouTube Channel URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.socialLinks?.youtube || ''}
                      onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAYOUT SCHEDULE & RULES TAB */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Expert Payout Schedule & Withdrawal Rules</h2>
                <p className="text-sm text-slate-500">
                  Control how frequently experts can request withdrawals, cooldown durations, and minimum payout limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Payout Interval */}
                <div className="p-5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-blue-600" />
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Payout Request Interval (Days)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="payoutDaysInterval"
                      value={formData.payoutDaysInterval ?? 7}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className="w-28 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    />
                    <span className="text-sm font-bold text-slate-700">Days</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Kitne din me expert payout request submit kar sakta hai (e.g. 7 = weekly, 15 = bi-weekly, 30 = monthly). Ek baar payout request karne ke baad agla request itne din ke cooldown ke baad hi submit hoga.
                  </p>
                </div>

                {/* Estimated Processing Time */}
                <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-amber-600" />
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Estimated Processing Days
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="payoutEstimatedDays"
                      value={formData.payoutEstimatedDays ?? 3}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className="w-28 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center"
                    />
                    <span className="text-sm font-bold text-slate-700">Business Days</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Admin verification and bank disbursement time shown to experts on their earnings dashboard.
                  </p>
                </div>

                {/* Minimum Payout Amount */}
                <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" />
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Minimum Payout Withdrawal Limit (₹)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-700">₹</span>
                    <input
                      type="number"
                      name="minPayoutAmount"
                      value={formData.minPayoutAmount ?? '100'}
                      onChange={handleChange}
                      min="1"
                      step="10"
                      className="w-36 px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-500">Minimum wallet balance required for withdrawal</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Threshold balance required before an expert can submit a withdrawal request.
                  </p>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Expert Dashboard Preview
                </span>
                <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Payout Frequency: Every {formData.payoutDaysInterval || 7} Days
                      </p>
                      <p className="text-xs text-slate-500">
                        Min. Withdrawal: ₹{formData.minPayoutAmount || 100} • Processed within ~{formData.payoutEstimatedDays || 3} business days
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                    Enforced dynamically by backend
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CONSULTATIONS TAB */}
          {activeTab === 'consultation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Consultation & Commission Rules</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Define marketplace take rate, duration rules, and booking policies.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
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
                      className="w-32 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">% platform default take rate</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Default fallback rate. You can also configure dynamic category-wise commission rates in Categories.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
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
                      className="w-32 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Minutes</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">Shortest allowed bookable session slot.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={16} className="text-blue-500 dark:text-blue-400" />
                    <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Minimum Expert Distance (KM)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      name="minimumExpertDistanceKm"
                      value={formData.minimumExpertDistanceKm ?? ''}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="e.g. 100"
                      className="w-36 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">KM</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Only experts at or above this geographical distance (expertDistance &ge; adminMinimumDistance) will be displayed. Set to 0 to disable.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={16} className="text-emerald-500 dark:text-emerald-400" />
                    <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Minimum Expert Payout (₹)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">₹</span>
                    <input
                      type="number"
                      name="minPayoutAmount"
                      value={formData.minPayoutAmount ?? '100'}
                      onChange={handleChange}
                      min="1"
                      step="10"
                      placeholder="e.g. 100"
                      className="w-36 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Minimum balance required for withdrawal</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Minimum earnings threshold an expert must reach before they are allowed to submit a payout request.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Auto-Approve Expert Applications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">If enabled, new expert registrations are instantly approved.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="autoApproveExperts"
                    checked={formData.autoApproveExperts}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Enable Instant Booking</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Allow users to initiate immediate calls and consultations without advance scheduling.</p>
                  </div>
                  <input
                    type="checkbox"
                    name="enableInstantBooking"
                    checked={formData.enableInstantBooking}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300 dark:border-slate-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Digital Products & Marketplace System Master Control */}
                <div className={`p-4 rounded-xl border transition-colors md:col-span-2 ${formData.enableMarketplace ? 'border-emerald-200 dark:border-emerald-700/80 bg-emerald-50/40 dark:bg-emerald-950/40' : 'border-rose-200 dark:border-rose-700/80 bg-rose-50/40 dark:bg-rose-950/40'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${formData.enableMarketplace ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Enable Digital Products Marketplace</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${formData.enableMarketplace ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700'}`}>
                          {formData.enableMarketplace ? 'Visible (5 Tabs: Home | Experts | Sell | Products | Account)' : 'Hidden (3 Tabs: Home | Experts | Account)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-200 mt-1">
                        Control whether digital downloadable products, store catalogue, cart, and seller portal are active platform-wide. When enabled, mobile footer navbar displays 5 tabs. When disabled/hidden, marketplace routes are blocked and mobile footer navbar cleanly shows 3 tabs (Home, Experts, Account).
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        name="enableMarketplace"
                        checked={formData.enableMarketplace}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Free Chat Dynamic Controls */}
              <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-700/70 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎁</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        1-Time Free Chat Consultation Rules
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/70 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                        Dynamic Admin Rule
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-amber-100/90 mt-1">
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

              {/* Call Safety & Privacy Guidelines (Editable by Admin) */}
              <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Call Safety Guidelines & Privacy Tips (User Popup)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Yeh safety tips call modal popup me dikhenge. Users ko call start karne se pehle terms & safety tick karni hogi.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Safety Messages / Privacy Tips (Line-by-Line)
                  </label>
                  <textarea
                    rows={5}
                    name="callSafetyTips"
                    value={formData.callSafetyTips || ''}
                    onChange={handleChange}
                    placeholder="Enter safety tips that will appear in the call confirmation popup..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tip: You can use bullets (• or 1., 2.) for distinct guidelines.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CHAT RETENTION & AUTO-DELETE TAB */}
          {activeTab === 'chatCleanup' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chat History Retention & Auto-Cleanup</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Control how long consultation chat messages are retained. Set an automatic deletion threshold and perform on-demand manual cleanup of old chats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchChatStats}
                  disabled={loadingChatStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors w-fit shrink-0 cursor-pointer"
                >
                  <RefreshCw size={13} className={loadingChatStats ? 'animate-spin' : ''} />
                  <span>Refresh Metrics</span>
                </button>
              </div>

              {/* Feedback Alert Banner */}
              {purgeActionResult && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-semibold animate-in fade-in ${
                    purgeActionResult.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {purgeActionResult.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{purgeActionResult.text}</span>
                  </div>
                  <button
                    onClick={() => setPurgeActionResult(null)}
                    className="hover:opacity-70 font-bold ml-3 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 1. Live Chat Database Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Total Messages
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {loadingChatStats ? '...' : (chatStats?.totalMessages ?? 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Across all consultations</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Active Threads
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {loadingChatStats ? '...' : (chatStats?.totalConversations ?? 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Total conversation rooms</span>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 space-y-1">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                    Eligible for Deletion
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
                    {loadingChatStats ? '...' : (chatStats?.expiredMessagesCount ?? 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80">
                    Older than {chatStats?.retentionDays || formData.chatRetentionDays || 30} days
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Last Cleanup Run
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {chatStats?.lastChatCleanupAt
                      ? new Date(chatStats.lastChatCleanupAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never yet'}
                  </p>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {chatStats?.lastCleanedMessagesCount ? `${chatStats.lastCleanedMessagesCount} msgs purged` : 'No cleanups run'}
                  </span>
                </div>
              </div>

              {/* 2. Dynamic Retention Policy Settings */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      <span>Automatic Old Chat Deletion Policy</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      When enabled, older chats will automatically be purged daily to optimize server storage and respect privacy.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      name="enableAutoDeleteOldChats"
                      checked={Boolean(formData.enableAutoDeleteOldChats)}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Delete Messages Older Than (Retention Days)
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <input
                        type="number"
                        name="chatRetentionDays"
                        value={formData.chatRetentionDays || '30'}
                        onChange={(e) => {
                          handleChange(e);
                          setPurgeCustomDays(e.target.value);
                        }}
                        min="1"
                        max="730"
                        className="w-32 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">Days</span>

                    {/* Quick Preset Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap ml-auto">
                      <span className="text-xs text-slate-400 font-medium mr-1">Presets:</span>
                      {['7', '15', '30', '60', '90', '180'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, chatRetentionDays: preset }));
                            setPurgeCustomDays(preset);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            formData.chatRetentionDays === preset
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {preset}d
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All chat messages sent earlier than {formData.chatRetentionDays || 30} days ago will be deleted permanently.
                  </p>
                </div>
              </div>

              {/* 3. Manual Immediate Deletion / Purge Card */}
              <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trash2 size={16} className="text-rose-600" />
                      <span>On-Demand Manual Chat Cleanup (Purge Now)</span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Need to free up space or perform a compliance cleanup right now? You can immediately trigger a cleanup of messages older than your chosen threshold without waiting for the scheduled background task.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Delete older than:</span>
                    <input
                      type="number"
                      value={purgeCustomDays}
                      onChange={(e) => setPurgeCustomDays(e.target.value)}
                      min="1"
                      className="w-24 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 text-center"
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Days</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPurgeModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ml-auto active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Purge Chats Now</span>
                  </button>
                </div>
              </div>

              {/* Confirmation Modal */}
              {showPurgeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">Confirm Chat Deletion</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Irreversible database action</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Are you sure you want to permanently delete all chat messages sent more than <strong className="text-slate-900 dark:text-white font-black">{purgeCustomDays || 30} days ago</strong>?
                      {chatStats?.expiredMessagesCount > 0 && (
                        <span className="block mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                          Approximately {chatStats.expiredMessagesCount.toLocaleString()} message(s) will be removed.
                        </span>
                      )}
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowPurgeModal(false)}
                        disabled={purgingChats}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePurgeChats}
                        disabled={purgingChats}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        {purgingChats ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        <span>{purgingChats ? 'Deleting...' : 'Yes, Delete Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. RAZORPAY MULTI-ACCOUNT TAB */}
          {activeTab === 'razorpay' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Multi-Razorpay Account Management</h2>
                <p className="text-sm text-slate-500">
                  Manage up to 3 independent merchant accounts, configure default routing for customer payments vs expert payouts, test connections, and view account-wise volume reports.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                      <CreditCard size={13} />
                      <span>Dedicated Management Center</span>
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2">
                      Full-Featured Razorpay Routing & Reporting
                    </h3>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      Configure and test all 3 merchant accounts (RAZORPAY_1, RAZORPAY_2, RAZORPAY_3), select payment vs payout routing, inspect live connection latency, view webhook endpoints, and inspect transaction volume analytics.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/razorpay-accounts')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <span>Open Razorpay Accounts Dashboard</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
