import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Truck } from 'lucide-react';
import { usePendingWithdrawals, useRefreshAfterWithdrawal } from '@/modules/cash-withdrawals/hooks';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { ReasonModal } from '@/modules/cash-withdrawals/ReasonModal';
import { WITHDRAWAL_METHODS, type BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { formatAccount, formatDateTime, formatMoney } from '@/shared/format';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { bankWorkApi } from '../api/bank-work.api';

/** Retiros en tránsito: Caja confirma; Cuentas puede cancelar mientras estén pendientes. */
export function WithdrawalsInTransit({ canCancel }: { canCancel: boolean }) {
  const pending = usePendingWithdrawals();
  const summary = useQuery({ queryKey: ['bank-work', 'summary'], queryFn: bankWorkApi.summary });
  const refresh = useRefreshAfterWithdrawal();
  const [target, setTarget] = useState<BankCashWithdrawal | null>(null);
  const [expanded, setExpanded] = useState(false);
  const items = pending.data ?? [];
  if (items.length === 0) return null;
  const actions = (item: BankCashWithdrawal) => <div className="flex items-center justify-end gap-2 whitespace-nowrap">
    <strong>{formatMoney(item.monto)}</strong>
    {canCancel && <button type="button" onClick={() => setTarget(item)} className="text-xs font-semibold text-red-700 hover:underline">Cancelar</button>}
  </div>;
  const columns: DataTableColumn<BankCashWithdrawal>[] = [
    { key: 'date', header: 'Registrado', width: '20%', cell: item => formatDateTime(item.registradoEn) },
    { key: 'account', header: 'Cuenta', width: '32%', cell: item => <span><strong className="block text-slate-900">{item.cuentaTitular}</strong><small>{formatAccount(item.banco, item.cuentaNumero)}</small></span> },
    { key: 'method', header: 'Forma', width: '22%', cell: item => WITHDRAWAL_METHODS[item.forma] },
    { key: 'actions', header: 'Monto y acciones', kind: 'actions', width: '26%', cell: actions },
  ];
  return <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm">
    <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-5 py-4 text-left">
      <span className="rounded-xl bg-amber-100 p-2.5 text-amber-800"><Truck className="h-5 w-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-950">Efectivo en tránsito a Caja General</span><span className="block text-xs text-slate-600">{items.length} {items.length === 1 ? 'retiro pendiente' : 'retiros pendientes'} de confirmar por Caja.</span></span>
      <span className="shrink-0 text-lg font-bold tabular-nums text-amber-900">{summary.data ? formatMoney(summary.data.withdrawalsInTransit.amount) : '—'}</span>
    </button>
    {expanded && <div className="border-t border-amber-200 bg-white"><DataTable columns={columns} rows={items} getRowKey={item => item.id} emptyTitle="Sin retiros en tránsito"
      mobile={{ title: item => item.cuentaTitular, subtitle: item => formatDateTime(item.registradoEn), fields: [
        { key: 'account', label: 'Cuenta', value: item => formatAccount(item.banco, item.cuentaNumero) },
        { key: 'method', label: 'Forma', value: item => WITHDRAWAL_METHODS[item.forma] },
      ], actions }} /></div>}
    <ReasonModal open={target !== null} title="Cancelar retiro" description={target ? `Se cancelará el ${target.formaEtiqueta.toLowerCase()} de ${formatMoney(target.monto)} de ${target.banco}. El monto vuelve a estar disponible en la cuenta.` : ''}
      confirmLabel="Cancelar retiro" onClose={() => setTarget(null)} onConfirm={async motivo => {
        if (!target) return;
        await cashWithdrawalsApi.cancel(target.id, motivo);
        toast.success('Retiro cancelado');
        setTarget(null);
        await refresh();
      }} />
  </section>;
}
