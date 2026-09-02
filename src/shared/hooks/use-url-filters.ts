import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { readPersistedFilters } from './use-persisted-filters';

type FilterPrimitive = string | number;

/**
 * Sincroniza un objeto de filtros tipado con los query params de la URL.
 * Los valores iguales al default se omiten de la URL para mantenerla limpia
 * y para poder distinguir "sin filtro" de "filtro explícito".
 *
 * La restricción usa un mapped type autorreferenciado (`{ [K in keyof T]: ... }`)
 * en vez de `Record<string, FilterPrimitive>` para aceptar interfaces con
 * propiedades nombradas (sin índice de firma) como `OperationsFilters`.
 */
export function useUrlFilters<T extends { [K in keyof T]: FilterPrimitive }>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const storageKey = `table-filters:${pathname}`;

  const filters = useMemo(() => {
    const result = searchParams.size === 0
      ? readPersistedFilters(storageKey, defaults)
      : { ...defaults };

    (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
      const raw = searchParams.get(String(key));
      if (raw === null) return;

      const defaultValue = defaults[key];
      if (typeof defaultValue === 'number') {
        const parsed = Number(raw);
        result[key] = (Number.isNaN(parsed) ? defaultValue : parsed) as T[keyof T];
      } else {
        result[key] = raw as T[keyof T];
      }
    });

    return result;
  }, [searchParams, defaults, storageKey]);

  const setFilters = useCallback(
    (next: T) => {
      const params = new URLSearchParams();

      try {
        window.sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // La URL continúa siendo la fuente de verdad si no hay almacenamiento.
      }

      (Object.keys(next) as Array<keyof T>).forEach((key) => {
        const value = next[key];
        const isEmpty = value === '' || value === defaults[key];
        if (isEmpty) return;

        params.set(String(key), String(value));
      });

      setSearchParams(params, { replace: true });
    },
    [defaults, setSearchParams, storageKey],
  );

  const resetFilters = useCallback(() => {
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      // La limpieza de la URL sigue funcionando si no hay almacenamiento.
    }
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams, storageKey]);

  return { filters, setFilters, resetFilters };
}
