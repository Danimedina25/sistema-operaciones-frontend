import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/store/auth.context';
import { Button } from '@/shared/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { formatDateTime, formatMoney } from '@/shared/format';
import { depositMethodLabel, cashBankDepositsApi, type CashBankDeposit, type DepositMethod } from './api';
import { ResolveCashBankDepositDrawer, type DepositResolution } from './ResolveCashBankDepositDrawer';

export function CashBankDepositIncome() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['JEFA_CUENTAS', 'ADMIN']);
  const pending = useQuery({ queryKey: ['cash-bank-deposits', 'pending'], queryFn: cashBankDepositsApi.pending });
  const [selected, setSelected] = useState<CashBankDeposit | null>(null);
  const [mode, setMode] = useState<DepositResolution>('confirm');
  const rows = pending.data ?? [];

  function open(row: CashBankDeposit, next: DepositResolution) {
    setSelected(row); setMode(next);
  }
  const columns: DataTableColumn<CashBankDeposit>[] = [
    { key: 'date', header: 'Registrado', width: '16%', cell: row => <span className="whitespace-nowrap">{formatDateTime(row.registradoEn)}</span> },
    { key: 'account', header: 'Cuenta destino', width: '22%', cell: row => <span className="block min-w-0" title={`${row.cuenta} · ${row.cuentaTitular}`}><strong className="block truncate">{row.cuenta}</strong><small className="block truncate text-slate-500">Titular: {row.cuentaTitular}</small><small className="block truncate text-slate-400">Envió: {row.registradoPorNombre}</small></span> },
    { key: 'method', header: 'Origen', width: '17%', cell: row => <span className="block truncate" title={row.origen === 'CHEQUE' ? `Cheque ${row.numeroCheque ?? ''}`.trim() : `Caja · ${depositMethodLabel[row.forma as DepositMethod] ?? row.forma}`}>
      {row.origen === 'CHEQUE' ? `Cheque ${row.numeroCheque ?? ''}`.trim() : `Caja · ${depositMethodLabel[row.forma as DepositMethod] ?? row.forma}`}
    </span> },
    { key: 'reference', header: 'Referencia', width: '13%', cell: row => <span className="block truncate" title={row.referencia ?? ''}>{row.referencia ?? '—'}</span> },
    { key: 'amount', header: 'Monto', width: '14%', align: 'right', cell: row => <strong className="whitespace-nowrap tabular-nums">{formatMoney(row.monto)}</strong> },
    { key: 'actions', header: '', kind: 'actions', width: '18%', cell: row => canManage
      ? <div className="flex justify-end gap-2"><Button type="button" variant="success" className="h-9 px-3 text-xs" onClick={() => open(row, 'confirm')}>Confirmar</Button>
          <button type="button" onClick={() => open(row, 'reject')} className="text-xs font-semibold text-red-600">Rechazar</button></div>
      : <span className="text-xs text-slate-500">Solo consulta</span> },
  ];
  return <div className="space-y-4">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {pending.isError && <p role="alert" className="px-5 pb-4 text-sm text-red-700">No se pudieron cargar los envíos.
        <button type="button" className="ml-2 underline" onClick={() => void pending.refetch()}>Reintentar</button></p>}
      {pending.isPending ? <p className="p-5 text-sm text-slate-500">Cargando envíos…</p> :
        <DataTable columns={columns} rows={rows} getRowKey={row => row.id}
          mobile={{ title: row => row.cuenta, subtitle: row => formatDateTime(row.registradoEn),
            fields: [{ key: 'holder', label: 'Titular de la cuenta', value: row => row.cuentaTitular },
              { key: 'origin', label: 'Origen', value: row => row.origen === 'CHEQUE' ? 'Cheque' : 'Caja General' },
              { key: 'reference', label: 'Referencia / cheque', value: row => row.numeroCheque ?? row.referencia ?? '—' },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) }],
            actions: row => canManage ? <div className="flex gap-2">
              <Button variant="success" className="h-9 px-3 text-xs" onClick={() => open(row, 'confirm')}>Confirmar</Button>
              <Button variant="neutral" className="h-9 px-3 text-xs" onClick={() => open(row, 'reject')}>Rechazar</Button>
            </div> : null }}
          emptyTitle="Sin envíos por confirmar" emptyDescription="Los depósitos de efectivo y cheques pendientes aparecerán aquí." />}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Confirma cuando el depósito aparezca en la cuenta. En un envío de efectivo baja Caja General; en un cheque se valida su pago sin mover efectivo. Si no llegó o no coincide, recházalo.</p>
    </section>
    <ResolveCashBankDepositDrawer deposit={selected} mode={mode} onClose={() => setSelected(null)} />
  </div>;
}
