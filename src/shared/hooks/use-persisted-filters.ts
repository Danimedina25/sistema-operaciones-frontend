import { useCallback, useState, type SetStateAction } from 'react';

export function readPersistedFilters<T extends object>(storageKey: string, defaults: T): T {
  if (typeof window === 'undefined') return defaults;

  try {
    const cached = window.sessionStorage.getItem(storageKey);
    if (!cached) return defaults;

    const parsed = JSON.parse(cached) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;

    const restored = { ...defaults };
    for (const key of Object.keys(defaults) as Array<keyof T>) {
      const value = (parsed as Partial<T>)[key];
      if (value !== undefined && typeof value === typeof defaults[key]) {
        restored[key] = value as T[keyof T];
      }
    }

    return restored;
  } catch {
    return defaults;
  }
}

export function usePersistedFilters<T extends object>(storageKey: string, defaults: T) {
  const [state, setState] = useState(() => ({
    storageKey,
    filters: readPersistedFilters(storageKey, defaults),
  }));
  let filters = state.filters;
  if (state.storageKey !== storageKey) {
    filters = readPersistedFilters(storageKey, defaults);
    setState({ storageKey, filters });
  }

  const setFilters = useCallback(
    (next: SetStateAction<T>) => {
      setState((currentState) => {
        const current = currentState.filters;
        const resolved = typeof next === 'function'
          ? (next as (previous: T) => T)(current)
          : next;

        try {
          window.sessionStorage.setItem(storageKey, JSON.stringify(resolved));
        } catch {
          // El filtro sigue funcionando en memoria si el navegador bloquea el almacenamiento.
        }

        return { storageKey, filters: resolved };
      });
    },
    [storageKey],
  );

  const resetFilters = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // Ignora restricciones de almacenamiento y restablece el estado local.
    }
    setState({ storageKey, filters: defaults });
  }, [defaults, storageKey]);

  return { filters, setFilters, resetFilters };
}
