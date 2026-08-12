import type { AuthUser } from '@/modules/auth/types/auth.types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function getStoredValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
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
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem(TOKEN_KEY);
    storage.setItem(TOKEN_KEY, token);
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
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem(USER_KEY);
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  clear() {
    clearStorage(localStorage);
    clearStorage(sessionStorage);
  },
};
