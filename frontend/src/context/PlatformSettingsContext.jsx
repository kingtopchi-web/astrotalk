import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const DEFAULT_SAFETY_TIPS = '• अपनी प्राइवेसी बनाए रखने के लिए अपना मोबाइल नंबर, नाम, पता, बैंक A/C नंबर या OTP किसी से शेयर न करें।\n• प्लेटफॉर्म के बाहर किसी से भी पैसे का लेन-देन न करें।\n• किसी भी असुरक्षित स्थान पर किसी से व्यक्तिगत रूप से न मिलें।\n• किसी के बहकावे अथवा लालच के शिकार न हों।';

const DEFAULT_HOME_STATS = {
  stat1Value: '100k+',
  stat1Label: 'Consultations',
  stat2Value: '4.9',
  stat2Label: 'Avg. Rating',
  stat3Value: 'Top 1%',
  stat3Label: 'Vetted Minds',
};

const DEFAULT_SOCIAL_LINKS = {
  instagram: '',
  facebook: '',
  twitter: '',
  linkedin: '',
  youtube: '',
};

const PlatformSettingsContext = createContext({
  platformName: 'ExpertHub',
  platformLogo: '',
  heroSlides: [],
  homeStats: DEFAULT_HOME_STATS,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  supportEmail: 'support12@stitchplatform.com',
  contactPhone: '+91 98765 43210',
  address: 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
  enableMarketplace: true,
  enableFreeChat: true,
  freeChatDurationMinutes: 5,
  payoutDaysInterval: 7,
  payoutEstimatedDays: 3,
  platformCommissionRate: 20,
  callSafetyTips: DEFAULT_SAFETY_TIPS,
  loading: false,
  refreshSettings: () => {}
});

export const PlatformSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformName: 'ExpertHub',
    platformLogo: '',
    heroSlides: [],
    homeStats: DEFAULT_HOME_STATS,
    socialLinks: DEFAULT_SOCIAL_LINKS,
    supportEmail: 'support12@stitchplatform.com',
    contactPhone: '+91 98765 43210',
    address: 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
    enableMarketplace: true,
    enableFreeChat: true,
    freeChatDurationMinutes: 5,
    payoutDaysInterval: 7,
    payoutEstimatedDays: 3,
    platformCommissionRate: 20,
    callSafetyTips: DEFAULT_SAFETY_TIPS,
    loading: true
  });

  const fetchSettings = useCallback(async () => {
    try {
      // Try /public/settings first
      const res = await axios.get(getApiUrl('/public/settings'), { timeout: 6000 });
      if (res.data && res.data.success) {
        setSettings({
          platformName: res.data.platformName || 'ExpertHub',
          platformLogo: res.data.platformLogo || '',
          heroSlides: Array.isArray(res.data.heroSlides) ? res.data.heroSlides : [],
          homeStats: res.data.homeStats || DEFAULT_HOME_STATS,
          socialLinks: res.data.socialLinks || DEFAULT_SOCIAL_LINKS,
          supportEmail: res.data.supportEmail || 'support12@stitchplatform.com',
          contactPhone: res.data.contactPhone || '+91 98765 43210',
          address: res.data.address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
          enableMarketplace: res.data.enableMarketplace !== false,
          enableFreeChat: res.data.enableFreeChat !== false,
          freeChatDurationMinutes: Number(res.data.freeChatDurationMinutes) || 5,
          payoutDaysInterval: Number(res.data.payoutDaysInterval ?? 7),
          payoutEstimatedDays: Number(res.data.payoutEstimatedDays ?? 3),
          platformCommissionRate: Number(res.data.platformCommissionRate ?? 20),
          callSafetyTips: res.data.callSafetyTips || DEFAULT_SAFETY_TIPS,
          loading: false
        });
        return;
      }
    } catch (e) {
      // Fallback to /public/stats
      try {
        const statsRes = await axios.get(getApiUrl('/public/stats'), { timeout: 6000 });
        if (statsRes.data) {
          setSettings(prev => ({
            ...prev,
            platformName: statsRes.data.platformName || prev.platformName,
            platformLogo: statsRes.data.platformLogo || prev.platformLogo,
            heroSlides: Array.isArray(statsRes.data.heroSlides) ? statsRes.data.heroSlides : prev.heroSlides,
            supportEmail: statsRes.data.supportEmail || prev.supportEmail,
            contactPhone: statsRes.data.contactPhone || prev.contactPhone,
            address: statsRes.data.address || prev.address,
            enableFreeChat: statsRes.data.enableFreeChat !== false,
            freeChatDurationMinutes: Number(statsRes.data.freeChatDurationMinutes) || prev.freeChatDurationMinutes,
            payoutDaysInterval: Number(statsRes.data.payoutDaysInterval ?? prev.payoutDaysInterval),
            payoutEstimatedDays: Number(statsRes.data.payoutEstimatedDays ?? prev.payoutEstimatedDays),
            callSafetyTips: statsRes.data.callSafetyTips || prev.callSafetyTips || DEFAULT_SAFETY_TIPS,
            loading: false
          }));
          return;
        }
      } catch (err2) {
        // use fallback defaults
      }
    } finally {
      setSettings(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Auto-refresh when tab gains focus so changes made in Admin settings tab reflect instantly
    const handleFocus = () => {
      fetchSettings();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchSettings]);

  return (
    <PlatformSettingsContext.Provider value={{ ...settings, refreshSettings: fetchSettings }}>
      {children}
    </PlatformSettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(PlatformSettingsContext);
export default PlatformSettingsContext;
