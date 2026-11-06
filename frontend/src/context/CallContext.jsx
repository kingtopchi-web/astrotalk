import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CallContext = createContext();

export function CallProvider({ children }) {
  const [activeCall, setActiveCall] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // If user visits /live/:id directly, register it into activeCall
  useEffect(() => {
    const match = location.pathname.match(/^\/live\/([^/?]+)/);
    if (match) {
      const consultationId = match[1];
      const type = new URLSearchParams(location.search).get('type') || 'audio';
      setActiveCall((prev) => {
        if (prev?.consultationId === consultationId) {
          // If already registered and currently on /live route, ensure full screen
          if (prev.isMinimized) {
            return { ...prev, isMinimized: false };
          }
          return prev;
        }
        return { consultationId, type, isMinimized: false };
      });
    }
  }, [location.pathname, location.search]);

  const minimizeCall = () => {
    setActiveCall((prev) => (prev ? { ...prev, isMinimized: true } : null));
    navigate('/');
  };

  const maximizeCall = () => {
    if (!activeCall) return;
    setActiveCall((prev) => ({ ...prev, isMinimized: false }));
    navigate(`/live/${activeCall.consultationId}?type=${activeCall.type || 'audio'}`);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  return (
    <CallContext.Provider value={{ activeCall, setActiveCall, minimizeCall, maximizeCall, endCall }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

