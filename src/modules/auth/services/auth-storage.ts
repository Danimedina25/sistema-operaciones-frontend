import type { AuthUser } from '@/modules/auth/types/auth.types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getStoredValue(key: string): string | null {
  const sharedValue = localStorage.getItem(key);
  if (sharedValue) return sharedValue;

  // Migra sesiones creadas por versiones anteriores, que se guardaban por
  // pestaña y por eso no estaban disponibles al abrir enlaces desde WhatsApp.
  const legacyValue = sessionStorage.getItem(key);
  if (legacyValue) {
    localStorage.setItem(key, legacyValue);
    sessionStorage.removeItem(key);
  }

  return legacyValue;
}

function clearStorage(storage: Storage) {
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export const authStorage = {
  getToken(): string | null {
    return getStoredValue(TOKEN_KEY);
  },

  setToken(token: string, rememberMe = false) {
    void rememberMe;
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, token);
  },

  getUser(): AuthUser | null {
    const raw = getStoredValue(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser, rememberMe = false) {
    void rememberMe;
    sessionStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
  },
};
