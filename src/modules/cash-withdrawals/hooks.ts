import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cashWithdrawalsApi } from './api';

export const CASH_WITHDRAWALS_KEY = 'cash-withdrawals';

/** Retiros en tránsito: la bandeja de Cajas y lo que Cuentas ya no tiene disponible. */
export function usePendingWithdrawals(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [CASH_WITHDRAWALS_KEY, user?.userId, 'pending'],
    queryFn: cashWithdrawalsApi.pending,
    enabled,
  });
}

/**
 * Un retiro mueve la caja, el saldo bancario y lo disponible a la vez: después de cualquier
 * cambio se refrescan las tres vistas.
 */
export function useRefreshAfterWithdrawal() {
  const client = useQueryClient();
  return () => Promise.all([
    client.invalidateQueries({ queryKey: [CASH_WITHDRAWALS_KEY] }),
    client.invalidateQueries({ queryKey: ['caja-general'] }),
    client.invalidateQueries({ queryKey: ['bank-movements'] }),
    client.invalidateQueries({ queryKey: ['account-availability'] }),
  ]);
}
