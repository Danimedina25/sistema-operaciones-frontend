import { useState } from 'react';
import toast from 'react-hot-toast';
import { Inbox } from 'lucide-react';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { usePendingWithdrawals, useRefreshAfterWithdrawal } from '@/modules/cash-withdrawals/hooks';
import { ReasonModal } from '@/modules/cash-withdrawals/ReasonModal';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { currency } from '../utils/cash-amounts';
import { formatCashDateTime } from '../utils/cash-dates';
import { ConfirmWithdrawalModal } from './ConfirmWithdrawalModal';

/**
 * Efectivo que Cuentas retiró de las cuentas para Caja General. Cajas lo revisa y, al
 * recibirlo, lo confirma con su desglose (entra a la caja de hoy) o lo rechaza con motivo.
 */
export function PendingWithdrawalsInbox({ canResolve, openDayId, onConfirmed }: {
  /**
   * Jefa de Cajas o Administración. Rechazar no mueve la caja, así que no depende de la fecha
   * que se esté viendo; confirmar además necesita `openDayId`.
   */
  canResolve: boolean;
  /** Caja abierta de hoy, vista en la fecha de hoy; sin ella no se puede confirmar. */
  openDayId: number | null;
  onConfirmed?: () => void;
}) {
  const pending = usePendingWithdrawals();
  const refresh = useRefreshAfterWithdrawal();
  const [confirming, setConfirming] = useState<BankCashWithdrawal | null>(null);
  const [rejecting, setRejecting] = useState<BankCashWithdrawal | null>(null);
  const items = pending.data ?? [];

  if (pending.isError) return <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(pending.error)}</p>;
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + Math.round(item.monto * 100), 0) / 100;

  return (
    <section className="rounded-2xl border border-blue-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50/60 px-5 py-4">
        <span className="rounded-xl bg-blue-100 p-2.5 text-blue-800"><Inbox className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-950">Retiros por confirmar</h2>
          <p className="text-xs text-slate-600">
            {items.length} {items.length === 1 ? 'retiro' : 'retiros'} de las cuentas en camino a Caja General.
            {canResolve && !openDayId ? ' Para confirmarlos, consulta la fecha de hoy con la caja de hoy abierta; rechazarlos se puede en cualquier momento.' : ''}
          </p>
        </div>
        <span className="text-lg font-bold tabular-nums text-slate-950">{currency(total)}</span>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Registrado</th>
              <th className="px-4 py-2.5">Cuenta</th>
              <th className="px-4 py-2.5">Forma</th>
              <th className="px-4 py-2.5">Beneficiario</th>
              <th className="px-4 py-2.5 text-right">Monto</th>
              {canResolve ? <th className="px-4 py-2.5"><span className="sr-only">Acciones</span></th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-slate-600">{formatCashDateTime(item.registradoEn)}<span className="block text-xs text-slate-400">{item.registradoPorNombre}</span></td>
                <td className="px-4 py-3 text-slate-900">{item.banco} {maskAccountNumber(item.cuentaNumero)}<span className="block text-xs text-slate-500">{item.cuentaTitular}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{WITHDRAWAL_METHODS[item.forma]}{item.referencia ? <span className="block text-xs text-slate-400">{item.referencia}</span> : null}</td>
                <td className="px-4 py-3 text-slate-600">Caja General</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{currency(item.monto)}</td>
                {canResolve ? (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" disabled={!openDayId} onClick={() => setConfirming(item)}
                      title={openDayId ? undefined : 'Consulta la fecha de hoy con la caja de hoy abierta'}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                      Confirmar
                    </button>
                    <button type="button" onClick={() => setRejecting(item)} className="ml-3 text-xs font-semibold text-red-700 hover:underline">
                      Rechazar
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmWithdrawalModal
        withdrawal={confirming}
        onClose={() => setConfirming(null)}
        onConfirm={async (withdrawal, denominaciones) => {
          if (!openDayId) throw new Error('Abre la caja de hoy para confirmar.');
          await cashWithdrawalsApi.confirm(withdrawal.id, { diaCajaId: openDayId, denominaciones });
          toast.success('Retiro recibido en Caja General');
          await refresh();
          onConfirmed?.();
        }}
      />
      <ReasonModal
        open={rejecting !== null}
        title="Rechazar retiro"
        description={rejecting ? `Se avisará a Cuentas que no se recibió el ${rejecting.formaEtiqueta.toLowerCase()} de ${currency(rejecting.monto)} de ${rejecting.banco}.` : ''}
        confirmLabel="Rechazar retiro"
        onClose={() => setRejecting(null)}
        onConfirm={async motivo => {
          if (!rejecting) return;
          await cashWithdrawalsApi.reject(rejecting.id, motivo);
          toast.success('Retiro rechazado');
          await refresh();
        }}
      />
    </section>
  );
}
