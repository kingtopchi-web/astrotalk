import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const PlatformSettingsContext = createContext({
  platformName: 'ExpertHub',
  supportEmail: 'support12@stitchplatform.com',
  contactPhone: '+91 98765 43210',
  address: 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
  enableFreeChat: true,
  freeChatDurationMinutes: 5,
  loading: false,
  refreshSettings: () => {}
});

export const PlatformSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformName: 'ExpertHub',
    supportEmail: 'support12@stitchplatform.com',
    contactPhone: '+91 98765 43210',
    address: 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
    enableFreeChat: true,
    freeChatDurationMinutes: 5,
    loading: true
  });

  const fetchSettings = useCallback(async () => {
    try {
      // Try /public/settings first
      const res = await axios.get(getApiUrl('/public/settings'), { timeout: 6000 });
      if (res.data && res.data.success) {
        setSettings({
          platformName: res.data.platformName || 'ExpertHub',
          supportEmail: res.data.supportEmail || 'support12@stitchplatform.com',
          contactPhone: res.data.contactPhone || '+91 98765 43210',
          address: res.data.address || 'Plot 42, Tech Park, Bengaluru, Karnataka, India',
          enableFreeChat: res.data.enableFreeChat !== false,
          freeChatDurationMinutes: Number(res.data.freeChatDurationMinutes) || 5,
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
            supportEmail: statsRes.data.supportEmail || prev.supportEmail,
            contactPhone: statsRes.data.contactPhone || prev.contactPhone,
            address: statsRes.data.address || prev.address,
            enableFreeChat: statsRes.data.enableFreeChat !== false,
            freeChatDurationMinutes: Number(statsRes.data.freeChatDurationMinutes) || prev.freeChatDurationMinutes,
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
