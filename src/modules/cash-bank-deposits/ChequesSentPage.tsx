import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { QueryState } from '@/shared/components/ui/QueryState';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { formatDateTime, formatMoney } from '@/shared/format';
import { officeToday, shiftDay } from '@/shared/utils/period';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashBankDepositsApi, type CashBankDeposit } from './api';

function chequeStatus(row: CashBankDeposit) {
  if (row.estatus === 'CONFIRMADO') return <StatusBadge tone="success">Acreditado</StatusBadge>;
  if (row.estatus === 'CANCELADO') return <StatusBadge tone="danger">Rechazado</StatusBadge>;
  return <StatusBadge tone="pending">Por acreditar</StatusBadge>;
}

export default function ChequesSentPage() {
  const today = officeToday();
  const query = useQuery({
    queryKey: ['cash-bank-deposits', 'cheques-sent', today],
    queryFn: async () => {
      const [recent, pending] = await Promise.all([
        cashBankDepositsApi.list(shiftDay(today, -364), today),
        cashBankDepositsApi.pending(),
      ]);
      const rows = new Map<number, CashBankDeposit>();
      for (const row of [...recent, ...pending]) if (row.origen === 'CHEQUE') rows.set(row.id, row);
      return [...rows.values()].sort((a, b) => b.registradoEn.localeCompare(a.registradoEn) || b.id - a.id);
    },
  });
  const columns: DataTableColumn<CashBankDeposit>[] = [
    { key: 'date', header: 'Enviado', width: '17%', cell: row => formatDateTime(row.registradoEn) },
    { key: 'operation', header: 'Operación', width: '11%', cell: row => row.operationId ? `#${row.operationId}` : '—' },
    { key: 'cheque', header: 'Cheque', width: '16%', cell: row => <span className="block truncate" title={row.numeroCheque ?? ''}>{row.numeroCheque ?? '—'}</span> },
    { key: 'account', header: 'Cuenta destino', width: '20%', cell: row => <span className="block truncate" title={row.cuenta}>{row.cuenta}</span> },
    { key: 'amount', header: 'Monto', width: '12%', align: 'right', cell: row => <span className="whitespace-nowrap tabular-nums">{formatMoney(row.monto)}</span> },
    { key: 'status', header: 'Estatus', kind: 'status', width: '13%', cell: chequeStatus },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '11%', cell: row => row.operationId &&
      <Link to={buildOperationDetailPath(row.operationId)}><Button type="button" variant="neutral" className="h-9 whitespace-nowrap px-3 text-xs">Ver operación</Button></Link> },
  ];

  return <div className="mx-4 space-y-5 pt-2">
    <PageHeader title="Cheques enviados a banco" />
    <p className="text-sm text-slate-600">Estos cheques esperan acreditación bancaria o ya fueron resueltos. No entran ni salen como efectivo de Caja General.</p>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando cheques enviados…">
        <DataTable columns={columns} rows={query.data ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `Cheque ${row.numeroCheque ?? 'sin número'}`, subtitle: row => row.operationId ? `Operación #${row.operationId}` : undefined,
            status: chequeStatus,
            fields: [{ key: 'account', label: 'Cuenta destino', value: row => row.cuenta },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
              { key: 'date', label: 'Enviado', value: row => formatDateTime(row.registradoEn) }],
            actions: row => row.operationId && <Link to={buildOperationDetailPath(row.operationId)}><Button type="button" variant="neutral">Ver operación</Button></Link> }}
          emptyTitle="Sin cheques enviados a banco" emptyDescription="Cuando Cajas envíe un cheque para depósito, aparecerá aquí." showHeaderWhenEmpty />
      </QueryState>
    </section>
    <p className="text-xs text-slate-500">Se muestran los movimientos del último año y todos los cheques aún pendientes de acreditación.</p>
  </div>;
}
