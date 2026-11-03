/**
 * Shared User Location Helper with LocalStorage Caching
 */

const STORAGE_KEY = 'experthub_user_location';

export function getCachedUserLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return parsed;
    }
  } catch {}
  return null;
}

export function requestUserLocation(onSuccess, onError) {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    if (onError) onError(new Error('Geolocation not supported'));
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (pos && pos.coords) {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now()
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch {}
        if (onSuccess) onSuccess(coords);
      }
    },
    (err) => {
      if (onError) onError(err);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}

