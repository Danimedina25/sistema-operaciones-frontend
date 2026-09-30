import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { cashWithdrawalsApi } from './api';
import type { NotificationType } from '@/modules/notifications/types/notifications.types';

/** Notificaciones que significan que un retiro cambió de estado. */
export const WITHDRAWAL_NOTIFICATION_TYPES: readonly NotificationType[] = [
  'BANK_WITHDRAWAL_PENDING',
  'BANK_WITHDRAWAL_CONFIRMED',
  'BANK_WITHDRAWAL_REJECTED',
  'BANK_WITHDRAWAL_CANCELLED',
];

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
