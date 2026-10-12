import { useEffect, useMemo, useRef } from 'react';

/** Descarta una sola vez el antiguo valor inicial «Este mes» sin borrar otros filtros. */
export function useDefaultAllDatesMigration<T extends { dateFilter: string; startDate: string; endDate: string }>(
  filters: T,
  setFilters: (next: T) => void,
): T {
  const migrated = useRef(false);
  // El nuevo selector guarda rangos explícitos, así que THIS_MONTH solo puede venir del filtro antiguo.
  const migrate = filters.dateFilter === 'THIS_MONTH';
  const effectiveFilters = useMemo(() => migrate
    ? { ...filters, dateFilter: '' as T['dateFilter'], startDate: '', endDate: '' }
    : filters, [filters, migrate]);

  useEffect(() => {
    if (!migrate || migrated.current) return;
    migrated.current = true;
    setFilters(effectiveFilters);
  }, [effectiveFilters, migrate, setFilters]);

  return effectiveFilters;
}
