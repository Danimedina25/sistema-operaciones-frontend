import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { usePendingWithdrawals, useRefreshAfterWithdrawal, WITHDRAWAL_NOTIFICATION_TYPES } from '@/modules/cash-withdrawals/hooks';
import { useNotificationReceived } from '@/modules/notifications/hooks/use-notification-received';
import { ReasonModal } from '@/modules/cash-withdrawals/ReasonModal';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { maskAccountNumber } from '@/shared/utils/account-formatting';
import { getApiErrorMessage } from '@/shared/utils/errors';
import { currency } from '../utils/cash-amounts';
import { formatCashDate, formatCashDateTime } from '../utils/cash-dates';
import { ConfirmWithdrawalModal } from './ConfirmWithdrawalModal';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { formatMoney } from '@/shared/format';

/**
 * Efectivo que Cuentas retiró de las cuentas para Caja General. Cajas lo revisa y, al
 * recibirlo, lo confirma con su desglose (entra a la caja de hoy) o lo rechaza con motivo.
 */
export function PendingWithdrawalsInbox({ canResolve, openDayId, pendingCloseDate, onConfirmed }: {
  /**
   * Jefa de Cajas o Administración. Rechazar no mueve la caja, así que no depende de la fecha
   * que se esté viendo; confirmar además necesita `openDayId`.
   */
  canResolve: boolean;
  /** Caja abierta de hoy, vista en la fecha de hoy; sin ella no se puede confirmar. */
  openDayId: number | null;
  pendingCloseDate?: string | null;
  onConfirmed?: () => void;
}) {
  const pending = usePendingWithdrawals();
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterWithdrawal();
  const [confirming, setConfirming] = useState<BankCashWithdrawal | null>(null);
  const [rejecting, setRejecting] = useState<BankCashWithdrawal | null>(null);
  const items = pending.data ?? [];
  // Un retiro nuevo o cancelado por Cuentas aparece o desaparece sin recargar la página.
  useNotificationReceived(WITHDRAWAL_NOTIFICATION_TYPES, () => { void refresh(); });

  if (pending.isError) return <p role="alert" className="text-sm text-red-600">{getApiErrorMessage(pending.error)}</p>;
  const actions = (item: BankCashWithdrawal) => canResolve ? <div className="flex items-center justify-end gap-3 whitespace-nowrap">
    <button type="button" disabled={!openDayId} onClick={() => setConfirming(item)} title={openDayId ? undefined : 'Abre la caja de hoy para confirmar'}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-50"><Check className="h-4 w-4" />Confirmar</button>
    <button type="button" onClick={() => setRejecting(item)} className="text-xs font-semibold text-red-700 hover:underline">Rechazar</button>
  </div> : null;
  const columns: DataTableColumn<BankCashWithdrawal>[] = [
    { key: 'date', header: 'Registrado', width: '17%', cell: item => <span>{formatCashDateTime(item.registradoEn)}<small className="block text-slate-400">{item.registradoPorNombre}</small></span> },
    { key: 'account', header: 'Cuenta', width: '17%', cell: item => <span>{item.banco} {maskAccountNumber(item.cuentaNumero)}<small className="block text-slate-400">{item.cuentaTitular}</small></span> },
    { key: 'method', header: 'Forma', width: '17%', cell: item => <span>{WITHDRAWAL_METHODS[item.forma]}{item.referencia && <small className="block text-slate-400">{item.referencia}</small>}</span> },
    { key: 'beneficiary', header: 'Beneficiario', width: '14%', cell: () => 'Caja General' },
    { key: 'amount', header: 'Monto', width: '13%', align: 'right', cell: item => <strong className="whitespace-nowrap">{formatMoney(item.monto)}</strong> },
    { key: 'actions', header: '', kind: 'actions', width: '22%', cell: actions },
  ];

  return (
    <section className="space-y-4">
      {items.length > 0 && canResolve && !openDayId && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">{pendingCloseDate ? `La caja del ${formatCashDate(pendingCloseDate)} sigue pendiente de cierre. Ciérrala y abre la caja de hoy para confirmar el retiro.` : 'Para confirmar, la caja de hoy debe estar abierta.'} Puedes rechazar el retiro en cualquier momento.</p>}
      {items.length === 0 ? <EmptyState title="No hay retiros de cuentas bancarias por ingresar" description="Cuando la Jefa de Cuentas registre un retiro hacia Caja General aparecerá aquí para que lo confirmes." /> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <DataTable columns={columns} rows={items} getRowKey={item => item.id}
        mobile={{ title: item => `${item.banco} ${maskAccountNumber(item.cuentaNumero)}`, subtitle: item => item.cuentaTitular,
          fields: [{ key: 'date', label: 'Registrado', value: item => formatCashDateTime(item.registradoEn) },
            { key: 'method', label: 'Forma', value: item => WITHDRAWAL_METHODS[item.forma] },
            { key: 'beneficiary', label: 'Beneficiario', value: () => 'Caja General' },
            { key: 'amount', label: 'Monto', value: item => formatMoney(item.monto) }], actions }}
        emptyTitle="Sin retiros por confirmar" />
      </div>}
      <p className="text-sm text-slate-500">Los retiros ya confirmados aparecen en el libro de movimientos del <Link to="/caja-general" className="font-semibold text-blue-600 hover:underline">Corte →</Link></p>

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
