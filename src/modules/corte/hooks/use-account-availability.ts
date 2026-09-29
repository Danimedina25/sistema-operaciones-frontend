import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { usePendingWithdrawals } from '@/modules/cash-withdrawals/hooks';
import { getBankAccountBalance } from '../api/corte.api';
import { todayIso } from './use-bank-movements';

/**
 * Lo que una cuenta puede entregar hoy, como en un banco: su saldo menos el efectivo que ya
 * se retiró hacia Caja General y sigue en tránsito. El backend aplica la misma regla; aquí
 * sólo se muestra antes de enviar.
 */
export function useAccountAvailability(bankAccountId: number | null) {
  const { user } = useAuth();
  const pending = usePendingWithdrawals();
  const balance = useQuery({
    queryKey: ['account-availability', user?.userId, bankAccountId],
    queryFn: () => getBankAccountBalance(bankAccountId as number, todayIso()),
    enabled: bankAccountId !== null,
  });

  const cents = (value: number) => Math.round(value * 100);
  const saldo = balance.data?.saldoFinal ?? null;
  const enTransito = (pending.data ?? [])
    .filter(withdrawal => withdrawal.bankAccountId === bankAccountId)
    .reduce((sum, withdrawal) => sum + cents(withdrawal.monto), 0) / 100;
  const disponible = saldo === null ? null : (cents(saldo) - cents(enTransito)) / 100;

  return {
    saldo,
    enTransito,
    disponible,
    isLoading: bankAccountId !== null && (balance.isPending || pending.isPending),
  };
}

export type AccountAvailability = ReturnType<typeof useAccountAvailability>;

/** true si el monto cabe en lo disponible (o si todavía no se sabe: el backend valida igual). */
export function fitsAvailable(availability: AccountAvailability, amount: number | null): boolean {
  if (amount === null || availability.disponible === null) return true;
  return Math.round(amount * 100) <= Math.round(availability.disponible * 100);
}
