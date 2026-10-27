import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';
import { 
  saveAvatarToDB, 
  getAvatarFromDB, 
  clearAvatarFromDB, 
  cleanupLocalStorageQuota, 
  safeSetLocalStorage 
} from '../utils/avatarStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Immediately clean up any previous huge items causing QuotaExceededError
    cleanupLocalStorageQuota();

    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const cachedAvatar = localStorage.getItem('user_avatar');

        if (!parsedUser.profileImage && cachedAvatar) {
          parsedUser.profileImage = cachedAvatar;
        }

        setUser(parsedUser);

        // Also check IndexedDB for persisted high-res avatar
        getAvatarFromDB().then((dbAvatar) => {
          if (dbAvatar) {
            setUser((curr) => curr ? { ...curr, profileImage: dbAvatar } : curr);
          }
        }).catch(() => {});

        // Fetch fresh profile in background so profileImage and updates stay synced
        if (parsedUser.role === 'USER') {
          axios.get(getApiUrl('/user/profile'), {
            headers: { Authorization: `Bearer ${token}` }
          }).then((res) => {
            if (res.data) {
              const activeImage = res.data.profileImage || parsedUser.profileImage || cachedAvatar || '';
              const merged = { ...parsedUser, ...res.data, profileImage: activeImage };
              setUser(merged);
              saveUserSafely(merged);
              if (activeImage) {
                saveAvatarToDB(activeImage);
                if (activeImage.length < 40000) {
                  safeSetLocalStorage('user_avatar', activeImage);
                }
              }
            }
          }).catch(() => {});
        } else if (parsedUser.role === 'EXPERT') {
          axios.get(getApiUrl('/expert/profile'), {
            headers: { Authorization: `Bearer ${token}` }
          }).then((res) => {
            if (res.data) {
              const activeImage = res.data.profileImage || parsedUser.profileImage || cachedAvatar || '';
              const merged = { ...parsedUser, ...res.data, profileImage: activeImage };
              setUser(merged);
              saveUserSafely(merged);
              if (activeImage) {
                saveAvatarToDB(activeImage);
                if (activeImage.length < 40000) {
                  safeSetLocalStorage('user_avatar', activeImage);
                }
              }
            }
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    
    setLoading(false);
  }, []);

  const saveUserSafely = (userData) => {
    if (!userData) return;
    try {
      const userToStore = { ...userData };
      // If profileImage is a large base64 data URL, avoid blowing localStorage quota
      if (userToStore.profileImage && userToStore.profileImage.startsWith('data:') && userToStore.profileImage.length > 30000) {
        saveAvatarToDB(userToStore.profileImage);
        userToStore.profileImage = ''; // IndexedDB holds the full image
      }
      safeSetLocalStorage('user', JSON.stringify(userToStore));
    } catch (e) {
      console.warn('Safe user save warning:', e);
    }
  };

  const login = (userData, token) => {
    const cachedAvatar = localStorage.getItem('user_avatar');
    const activeImage = userData.profileImage || cachedAvatar || '';
    const finalUserData = {
      ...userData,
      profileImage: activeImage
    };
    setUser(finalUserData);
    saveUserSafely(finalUserData);
    safeSetLocalStorage('token', token);
    if (activeImage) {
      saveAvatarToDB(activeImage);
      if (activeImage.length < 40000) {
        safeSetLocalStorage('user_avatar', activeImage);
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user_avatar');
    clearAvatarFromDB();
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const activeImage = updatedUser?.profileImage || prev?.profileImage || localStorage.getItem('user_avatar') || '';
      const merged = {
        ...prev,
        ...updatedUser,
        profileImage: activeImage
      };

      // 1. Save to IndexedDB (virtually unlimited quota)
      if (activeImage) {
        saveAvatarToDB(activeImage);
        if (activeImage.length < 40000) {
          safeSetLocalStorage('user_avatar', activeImage);
        }
      }

      // 2. Save user metadata safely to localStorage without oversized base64
      saveUserSafely(merged);

      return merged;
    });
  };

  const auth = {
    token: localStorage.getItem('token'),
    user: user
  };

  return (
    <AuthContext.Provider value={{ auth, token: auth.token, user, login, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
