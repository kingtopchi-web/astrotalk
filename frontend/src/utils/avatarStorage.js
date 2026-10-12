// IndexedDB and LocalStorage quota-safe avatar storage helper

const DB_NAME = 'ExpertHub_Avatar_DB';
const STORE_NAME = 'avatars';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveAvatarToDB(avatarData) {
  if (!avatarData) return;
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(avatarData, 'user_avatar');
  } catch (err) {
    console.warn('Could not save avatar to IndexedDB:', err);
  }
}

export async function getAvatarFromDB() {
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('user_avatar');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearAvatarFromDB() {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('user_avatar');
  } catch {}
}

/**
 * Compresses an image data URL or file down to small avatar dimensions (~15-25KB).
 */
export function compressAvatar(dataUrlOrFile, maxDim = 200, quality = 0.75) {
  return new Promise((resolve) => {
    if (!dataUrlOrFile) return resolve('');

    const processSrc = (src) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Quality 0.75 keeps thumbnail razor-sharp under 20KB
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(typeof dataUrlOrFile === 'string' ? dataUrlOrFile : '');
      img.src = src;
    };

    if (typeof dataUrlOrFile === 'string') {
      processSrc(dataUrlOrFile);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => processSrc(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(dataUrlOrFile);
    }
  });
}

/**
 * Cleans up any oversized base64 strings currently cluttering localStorage.
 */
export function cleanupLocalStorageQuota() {
  try {
    // 1. Check user key
    const rawUser = localStorage.getItem('user');
    if (rawUser && rawUser.length > 50000) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed.profileImage && parsed.profileImage.length > 30000) {
          saveAvatarToDB(parsed.profileImage);
          // Keep user object light in localStorage
          delete parsed.profileImage;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      } catch {}
    }

    // 2. Check user_avatar key
    const rawAvatar = localStorage.getItem('user_avatar');
    if (rawAvatar && rawAvatar.length > 50000) {
      saveAvatarToDB(rawAvatar);
      // Remove oversized key from localStorage
      localStorage.removeItem('user_avatar');
    }
  } catch (err) {
    console.warn('Quota cleanup error:', err);
  }
}

/**
 * Safely writes to localStorage without ever crashing from QuotaExceededError.
 */
export function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      console.warn(`Storage quota exceeded when writing ${key}. Cleaning up...`);
      try {
        localStorage.removeItem('user_avatar');
        // Try again without the large item
        localStorage.setItem(key, value);
      } catch (inner) {
        // If still full, remove non-essential items
        console.warn('Could not write to localStorage even after cleanup:', inner);
      }
    }
  }
}
