import { useState } from 'react';
import toast from 'react-hot-toast';
import { Inbox } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { usePendingWithdrawals, useRefreshAfterWithdrawal, WITHDRAWAL_NOTIFICATION_TYPES } from '@/modules/cash-withdrawals/hooks';
import { useNotificationReceived } from '@/modules/notifications/hooks/use-notification-received';
import { ReasonModal } from '@/modules/cash-withdrawals/ReasonModal';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { currency } from '../utils/cash-amounts';
import { formatCashDateTime } from '../utils/cash-dates';
import { ConfirmWithdrawalModal } from './ConfirmWithdrawalModal';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { formatMoney } from '@/shared/format';
import { cashWorkApi } from '../api/cash-work.api';

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
  const summary = useQuery({ queryKey: ['cash-work', 'summary'], queryFn: cashWorkApi.summary });
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterWithdrawal();
  const [confirming, setConfirming] = useState<BankCashWithdrawal | null>(null);
  const [rejecting, setRejecting] = useState<BankCashWithdrawal | null>(null);
  const items = pending.data ?? [];
  // Un retiro nuevo o cancelado por Cuentas aparece o desaparece sin recargar la página.
  useNotificationReceived(WITHDRAWAL_NOTIFICATION_TYPES, () => { void refresh(); });

  if (pending.isError) return <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(pending.error)}</p>;
  if (items.length === 0) return <EmptyState title="Sin retiros por confirmar" description="Los retiros de cuentas en tránsito aparecerán aquí." />;
  const actions = (item: BankCashWithdrawal) => canResolve ? <div className="flex flex-wrap justify-end gap-2 whitespace-nowrap">
    <button type="button" disabled={!openDayId} onClick={() => setConfirming(item)} title={openDayId ? undefined : 'Abre la caja de hoy para confirmar'}
      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Confirmar</button>
    <button type="button" onClick={() => setRejecting(item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700">Rechazar</button>
  </div> : null;
  const columns: DataTableColumn<BankCashWithdrawal>[] = [
    { key: 'date', header: 'Registrado', width: '19%', cell: item => <span>{formatCashDateTime(item.registradoEn)}<small className="block text-slate-500">{item.registradoPorNombre}</small></span> },
    { key: 'account', header: 'Cuenta', width: '23%', cell: item => <span>{item.banco} {maskAccountNumber(item.cuentaNumero)}<small className="block text-slate-500">{item.cuentaTitular}</small></span> },
    { key: 'method', header: 'Forma', width: '22%', cell: item => <span>{WITHDRAWAL_METHODS[item.forma]}<small className="block text-slate-500">Caja General</small>{item.referencia && <small className="block text-slate-500">{item.referencia}</small>}</span> },
    { key: 'amount', header: 'Monto', width: '14%', cell: item => <strong className="whitespace-nowrap">{formatMoney(item.monto)}</strong> },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '22%', cell: actions },
  ];

  return (
    <section className="rounded-2xl border border-blue-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-blue-100 bg-blue-50/60 px-5 py-4">
        <span className="rounded-xl bg-blue-100 p-2.5 text-blue-800"><Inbox className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-950">Retiros por confirmar</h2>
          <p className="text-xs text-slate-600">
            {summary.data?.withdrawals.count ?? items.length} {items.length === 1 ? 'retiro' : 'retiros'} de las cuentas en camino a Caja General.
            {canResolve && !openDayId ? ' Para confirmarlos, consulta la fecha de hoy con la caja de hoy abierta; rechazarlos se puede en cualquier momento.' : ''}
          </p>
        </div>
        <span className="text-lg font-bold tabular-nums text-slate-950">{summary.data ? formatMoney(summary.data.withdrawals.amount) : '—'}</span>
      </header>
      <DataTable columns={columns} rows={items} getRowKey={item => item.id}
        mobile={{ title: item => `${item.banco} ${maskAccountNumber(item.cuentaNumero)}`, subtitle: item => item.cuentaTitular,
          fields: [{ key: 'date', label: 'Registrado', value: item => formatCashDateTime(item.registradoEn) },
            { key: 'method', label: 'Forma', value: item => WITHDRAWAL_METHODS[item.forma] },
            { key: 'amount', label: 'Monto', value: item => formatMoney(item.monto) }], actions }}
        emptyTitle="Sin retiros por confirmar" />

      <ConfirmWithdrawalModal
        withdrawal={confirming}
        onClose={() => setConfirming(null)}
        onConfirm={async (withdrawal, denominaciones) => {
          if (!openDayId) throw new Error('Abre la caja de hoy para confirmar.');
          await cashWithdrawalsApi.confirm(withdrawal.id, { diaCajaId: openDayId, denominaciones });
          toast.success('Retiro recibido en Caja General');
          await refresh();
          await queryClient.invalidateQueries({ queryKey: ['cash-work'] });
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
          await queryClient.invalidateQueries({ queryKey: ['cash-work'] });
        }}
      />
    </section>
  );
}
