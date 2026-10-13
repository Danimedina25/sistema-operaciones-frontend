import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { QueryState } from '@/shared/components/ui/QueryState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate, formatMoney } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import { ChequeManager } from '@/modules/cheques/ChequeManager';
import { bankWorkApi, type BankIncomeRow } from '../api/bank-work.api';

const methodLabel = (method: BankIncomeRow['tipoPago']) => ({ TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito', CHEQUE: 'Cheque' })[method];

export default function BankIncomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canReview = hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'ADMIN']);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(0);
  const [chequeId, setChequeId] = useState<number | null>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['bank-work', 'income', page, deferredSearch, method], queryFn: () => bankWorkApi.income(page, deferredSearch, method) });
  const review = (row: BankIncomeRow) => {
    if (row.tipoPago === 'CHEQUE') setChequeId(row.id);
    else navigate(`${buildOperationDetailPath(row.operationId)}?action=review-payment&paymentId=${row.id}`);
  };
  const actions = (row: BankIncomeRow) => <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(row.operationId)} aria-label={`Ver operación #${row.operationId}`}><Button variant="neutral">Ver operación</Button></Link>
    {canReview && <Button variant="success" onClick={() => review(row)}>{row.tipoPago === 'CHEQUE' ? 'Gestionar cheque' : 'Confirmar'}</Button>}
  </div>;
  const columns: DataTableColumn<BankIncomeRow>[] = [
    { key: 'folio', header: 'Operación', width: '11%', cell: row => <span className="font-semibold">#{row.operationId}</span> },
    { key: 'client', header: 'Cliente', width: '19%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre} · ${row.socioComercialNombre}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate text-slate-500">Socio: {row.socioComercialNombre}</small></span> },
    { key: 'method', header: 'Tipo', width: '12%', cell: row => methodLabel(row.tipoPago) },
    { key: 'account', header: 'Cuenta destino', width: '15%', cell: row => <span className="block truncate" title={row.cuentaDestino ?? 'Sin cuenta asignada'}>{row.cuentaDestino ?? 'Sin cuenta asignada'}</span> },
    { key: 'age', header: 'Registrado', width: '11%', cell: row => formatDate(row.fechaPago) },
    { key: 'amount', header: 'Monto', width: '11%', cell: row => <strong className="whitespace-nowrap text-slate-900">{formatMoney(row.monto)}</strong> },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '21%', cell: actions },
  ];
  return <div className="space-y-5">
    <PageHeader title="Entradas bancarias" />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Pagos de ingreso de operaciones</h2></div>
      <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar folio, cliente, socio o cuenta"
        activeFilters={method ? [{ key: 'method', label: methodLabel(method as BankIncomeRow['tipoPago']), onRemove: () => { setMethod(''); setPage(0); } }] : []}
        filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Método
          <select aria-label="Método de entrada bancaria" value={method} onChange={event => { setMethod(event.target.value); setPage(0); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="">Todos</option><option value="TRANSFERENCIA">Transferencia</option><option value="DEPOSITO">Depósito</option><option value="CHEQUE">Cheque</option>
          </select></label>} />
      <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando entradas bancarias…">
        <DataTable columns={columns} rows={query.data?.content ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `Operación #${row.operationId}`, subtitle: row => `${row.clienteNombre} · ${row.socioComercialNombre}`, status: row => <StatusBadge tone="pending">{row.estatus === 'EN_PROCESO' ? 'En proceso' : 'Pendiente'}</StatusBadge>, fields: [
            { key: 'method', label: 'Método', value: row => methodLabel(row.tipoPago) },
            { key: 'account', label: 'Cuenta destino', value: row => row.cuentaDestino ?? 'Sin cuenta asignada' },
            { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
          ], actions }} emptyTitle="Sin pagos por validar" emptyDescription="Los pagos bancarios pendientes aparecerán aquí." />
      </QueryState>
      <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>
    </section>
    {chequeId !== null && <ChequeManager paymentId={chequeId} onClose={() => setChequeId(null)} onChanged={async () => { await queryClient.invalidateQueries({ queryKey: ['bank-work'] }); }} />}
  </div>;
}
