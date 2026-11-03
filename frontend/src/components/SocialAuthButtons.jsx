import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';

export default function SocialAuthButtons({ redirectTarget = '/dashboard', onError }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnContainerRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '605103845507-m1rk968uiuijteesjtofdgotufh79o3g.apps.googleusercontent.com';

  // Handle genuine Google Token returned by Google's popup
  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      if (onError) onError('Google authentication was cancelled or failed.');
      return;
    }

    setLoadingProvider('google');
    try {
      // Backend verifies token directly with Google OAuth servers
      const res = await axios.post(getApiUrl('/auth/google-verify'), {
        idToken: response.credential,
      });

      login(res.data, res.data.token);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to verify Google account. Please try again.';
      if (onError) onError(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    if (!googleClientId) return;

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render ONLY the single official Google button inside container
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = '';
            const width = Math.min(googleBtnContainerRef.current.offsetWidth || 360, 420);
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left',
              width: width > 200 ? width : 340,
            });
            setGisLoaded(true);
          }
        } catch (e) {
          console.warn('GIS init error:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [googleClientId]);

  const handleGoogleFallbackClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const btn = googleBtnContainerRef.current?.querySelector('div[role="button"]');
          if (btn) btn.click();
        }
      });
    } else {
      if (onError) onError('Google Sign-in service is initializing. Please try again in a moment or use Gmail OTP.');
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Single Google Sign-In Button */}
      <div className="w-full flex items-center justify-center min-h-[44px]">
        {/* Official GIS container */}
        <div 
          ref={googleBtnContainerRef} 
          className={`w-full flex items-center justify-center ${gisLoaded ? 'flex' : 'hidden'}`}
        />

        {/* Fallback button: ONLY shown if GIS hasn't rendered yet */}
        {!gisLoaded && (
          <button
            type="button"
            onClick={handleGoogleFallbackClick}
            disabled={loadingProvider !== null}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:scale-[0.99] text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loadingProvider === 'google' ? 'Verifying with Google...' : 'Continue with Google'}</span>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="shrink-0 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Or continue with Verified Gmail OTP
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
    </div>
  );
}
