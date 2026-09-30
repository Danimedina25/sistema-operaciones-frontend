import { useState } from 'react';
import toast from 'react-hot-toast';
import { Truck } from 'lucide-react';
import { usePendingWithdrawals, useRefreshAfterWithdrawal } from '@/modules/cash-withdrawals/hooks';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { ReasonModal } from '@/modules/cash-withdrawals/ReasonModal';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { formatMoney } from '../utils/money';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/**
 * Efectivo que salió de las cuentas y todavía no confirma Caja General. No ha bajado el
 * saldo del banco, pero tampoco está disponible. Cuentas puede cancelarlo mientras siga aquí.
 */
export function WithdrawalsInTransit({ canCancel }: { canCancel: boolean }) {
  const pending = usePendingWithdrawals();
  const refresh = useRefreshAfterWithdrawal();
  const [target, setTarget] = useState<BankCashWithdrawal | null>(null);
  const [expanded, setExpanded] = useState(false);
  const items = pending.data ?? [];
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.round(item.monto * 100), 0) / 100;

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="rounded-xl bg-amber-100 p-2.5 text-amber-800"><Truck className="h-5 w-5" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-950">Efectivo en tránsito a Caja General</span>
          <span className="block text-xs text-slate-600">
            {items.length} {items.length === 1 ? 'retiro pendiente' : 'retiros pendientes'} de confirmar por Caja. Aún no baja el saldo del banco, pero ya no está disponible.
          </span>
        </span>
        <span className="shrink-0 text-lg font-bold tabular-nums text-amber-900">{formatMoney(total)}</span>
      </button>

      {expanded ? (
        <div className="overflow-x-auto border-t border-amber-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Registrado</th>
                <th className="px-4 py-2.5">Cuenta</th>
                <th className="px-4 py-2.5">Forma</th>
                <th className="px-4 py-2.5 text-right">Monto</th>
                {canCancel ? <th className="px-4 py-2.5"><span className="sr-only">Acciones</span></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(item.registradoEn)}<span className="block text-xs text-slate-400">{item.registradoPorNombre}</span></td>
                  <td className="px-4 py-3 text-slate-900">{item.banco} {maskAccountNumber(item.cuentaNumero)}<span className="block text-xs text-slate-500">{item.cuentaTitular}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{WITHDRAWAL_METHODS[item.forma]}{item.referencia ? <span className="block text-xs text-slate-400">{item.referencia}</span> : null}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatMoney(item.monto)}</td>
                  {canCancel ? (
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setTarget(item)} className="text-xs font-semibold text-red-700 hover:underline">
                        Cancelar
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <ReasonModal
        open={target !== null}
        title="Cancelar retiro"
        description={target ? `Se cancelará el ${target.formaEtiqueta.toLowerCase()} de ${formatMoney(target.monto)} de ${target.banco}. El monto vuelve a estar disponible en la cuenta.` : ''}
        confirmLabel="Cancelar retiro"
        onClose={() => setTarget(null)}
        onConfirm={async motivo => {
          if (!target) return;
          await cashWithdrawalsApi.cancel(target.id, motivo);
          toast.success('Retiro cancelado');
          await refresh();
        }}
      />
    </section>
  );
}
