import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getBankMovementTotals, searchBankMovements } from '../api/corte.api';
import type { BankMovementFilters } from '../types/bank-movements.types';

export const BANK_MOVEMENTS_PAGE_SIZE = 20;

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** El rango debe estar ordenado y no puede ser futuro: el backend lo rechaza igual. */
export function isQueryableRange(filters: BankMovementFilters): boolean {
  return Boolean(filters.desde && filters.hasta)
    && filters.desde <= filters.hasta
    && filters.hasta <= todayIso();
}

export function useBankMovements(filters: BankMovementFilters, page: number) {
  const { user } = useAuth();
  const enabled = isQueryableRange(filters);

  const movements = useQuery({
    queryKey: ['bank-movements', user?.userId, filters, page],
    queryFn: () => searchBankMovements(filters, page, BANK_MOVEMENTS_PAGE_SIZE),
    enabled,
  });

  // Los totales se piden aparte porque cubren todo el filtro, no la página visible.
  const totals = useQuery({
    queryKey: ['bank-movements', user?.userId, 'totals', filters],
    queryFn: () => getBankMovementTotals(filters),
    enabled,
  });

  return { movements, totals, enabled };
}
