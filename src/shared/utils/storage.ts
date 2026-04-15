export const storage = {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },
};