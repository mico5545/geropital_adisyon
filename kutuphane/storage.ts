/**
 * iOS Safari (özellikle iPhone 7 Plus) uyumlu storage utility
 * localStorage ve sessionStorage'ı güvenli şekilde kullanır
 */

const STORAGE_PREFIX = "geropital_";

export const safeStorage = {
  // localStorage'a yazma - fallback ile
  setItemLocal: (key: string, value: string) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      localStorage.setItem(prefixedKey, value);
      return true;
    } catch (error) {
      console.warn(`localStorage setItem başarısız (${key}):`, error);
      try {
        const prefixedKey = STORAGE_PREFIX + key;
        sessionStorage.setItem(prefixedKey, value);
        return true;
      } catch (sessionError) {
        console.warn(`sessionStorage setItem başarısız (${key}):`, sessionError);
        return false;
      }
    }
  },

  // localStorage'dan okuma - her ikisini kontrol et
  getItemLocal: (key: string): string | null => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      let value = localStorage.getItem(prefixedKey);
      if (value !== null) return value;
    } catch (error) {
      console.warn(`localStorage getItem başarısız (${key}):`, error);
    }

    try {
      const prefixedKey = STORAGE_PREFIX + key;
      return sessionStorage.getItem(prefixedKey);
    } catch (error) {
      console.warn(`sessionStorage getItem başarısız (${key}):`, error);
      return null;
    }
  },

  // localStorage'dan silme
  removeItemLocal: (key: string) => {
    try {
      const prefixedKey = STORAGE_PREFIX + key;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn(`localStorage removeItem başarısız (${key}):`, error);
    }

    try {
      const prefixedKey = STORAGE_PREFIX + key;
      sessionStorage.removeItem(prefixedKey);
    } catch (error) {
      console.warn(`sessionStorage removeItem başarısız (${key}):`, error);
    }
  },

  // Tümünü temizle
  clear: () => {
    try {
      // Sadece bizim prefix'li key'leri sil
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("localStorage clear başarısız:", error);
    }

    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("sessionStorage clear başarısız:", error);
    }
  },

  // Session valid mi kontrol et
  isSessionValid: (): boolean => {
    const kullanici = safeStorage.getItemLocal("kullanici");
    return kullanici !== null && kullanici !== undefined && kullanici.length > 0;
  },
};
