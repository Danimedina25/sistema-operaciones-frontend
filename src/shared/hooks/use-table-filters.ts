import { useAuth } from '@/modules/auth/store/auth.context';
import { usePersistedFilters } from './use-persisted-filters';
import { useUrlFilters } from './use-url-filters';
import { useLocation } from 'react-router-dom';

export function useTableCacheKey(table: string) {
  const { user } = useAuth();
  return `${table}:v2:user:${user?.userId ?? 'anonymous'}`;
}

/** Guarda únicamente cambios explícitos, separados por tabla y usuario. */
export function useTableFilters<T extends object>(table: string, defaults: T) {
  return usePersistedFilters(useTableCacheKey(table), defaults);
}

export function useTableUrlFilters<T extends { [K in keyof T]: string | number }>(defaults: T) {
  const { pathname } = useLocation();
  const cacheKey = useTableCacheKey(`table-filters:${pathname}`);
  return useUrlFilters(defaults, cacheKey);
}
