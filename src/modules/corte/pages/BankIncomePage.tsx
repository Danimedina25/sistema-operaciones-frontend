import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { QueryState } from '@/shared/components/ui/QueryState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatElapsedSince, formatMoney } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import { ChequeManager } from '@/modules/cheques/ChequeManager';
import { IncomePaymentReview } from '@/modules/operations/components/IncomePaymentReview';
import { Check, Clock3, ExternalLink, ReceiptText } from 'lucide-react';
import { bankWorkApi, type BankIncomeRow } from '../api/bank-work.api';

const methodLabel = (method: BankIncomeRow['tipoPago']) => ({ TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito', CHEQUE: 'Cheque' })[method];

export default function BankIncomePage() {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canReview = hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'ADMIN']);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(0);
  const [chequeId, setChequeId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ operationId: number; paymentId: number } | null>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['bank-work', 'income', page, deferredSearch, method], queryFn: () => bankWorkApi.income(page, deferredSearch, method) });
  const summary = useQuery({ queryKey: ['bank-work', 'summary'], queryFn: bankWorkApi.summary });
  const review = (row: BankIncomeRow) => {
    if (row.tipoPago === 'CHEQUE') setChequeId(row.id);
    else setReviewTarget({ operationId: row.operationId, paymentId: row.id });
  };
  const actions = (row: BankIncomeRow) => <div className="flex items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(row.operationId)} aria-label={`Ver operación #${row.operationId}`}><Button variant="neutral" className="h-9 gap-1 px-2.5 text-xs"><ExternalLink className="h-3.5 w-3.5" />Ver operación</Button></Link>
    {canReview && <Button variant="success" className="h-9 gap-1 px-2.5 text-xs" onClick={() => review(row)}><Check className="h-3.5 w-3.5" />{row.tipoPago === 'CHEQUE' ? 'Gestionar cheque' : 'Confirmar'}</Button>}
  </div>;
  const columns: DataTableColumn<BankIncomeRow>[] = [
    { key: 'folio', header: 'Operación', width: '10%', cell: row => <strong className="whitespace-nowrap text-slate-900">Folio #{row.operationId}</strong> },
    { key: 'client', header: 'Cliente', width: '16%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre} · ${row.socioComercialNombre}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate text-slate-400">Socio: {row.socioComercialNombre}</small></span> },
    { key: 'method', header: 'Tipo', width: '12%', cell: row => <span className="whitespace-nowrap">{methodLabel(row.tipoPago)}</span> },
    { key: 'account', header: 'Cuenta destino', width: '17%', cell: row => <span className="block min-w-0 truncate" title={row.cuentaDestino ?? 'Sin cuenta asignada'}><strong className="block truncate text-slate-900">{row.cuentaDestino?.split(' · ')[0] ?? 'Sin cuenta asignada'}</strong><small className="block truncate text-slate-400">{row.cuentaDestino?.split(' · ').slice(1).join(' · ')}</small></span> },
    { key: 'age', header: 'Antigüedad', width: '10%', cell: row => <span className="flex items-center gap-1 whitespace-nowrap text-xs text-slate-500" title="Desde el registro del pago"><Clock3 className="h-3.5 w-3.5" />{formatElapsedSince(row.fechaPago)}</span> },
    { key: 'amount', header: 'Monto', width: '10%', align: 'right', cell: row => <strong className="whitespace-nowrap tabular-nums text-slate-900">{formatMoney(row.monto)}</strong> },
    { key: 'actions', header: '', kind: 'actions', width: '25%', cell: actions },
  ];
  return <div className="mx-4 space-y-6 pt-2">
    <PageHeader title="Entradas bancarias" />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950"><ReceiptText className="h-4 w-4 text-emerald-600" />Pagos de ingreso de operaciones <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{summary.data?.income.count ?? '—'}</span></h2><p className="text-sm text-slate-500">Por validar <strong className="ml-2 text-lg tabular-nums text-slate-950">{formatMoney(summary.data?.income.amount)}</strong></p></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">«Confirmar» abre la validación del pago aquí. «Ver operación» abre su detalle.</p>
      {(query.data?.totalPages ?? 0) > 1 && <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>}
    </section>
    {chequeId !== null && <ChequeManager paymentId={chequeId} onClose={() => setChequeId(null)} onChanged={async () => { await queryClient.invalidateQueries({ queryKey: ['bank-work'] }); }} />}
    {reviewTarget && <IncomePaymentReview operationId={reviewTarget.operationId} paymentId={reviewTarget.paymentId} workQueryKey="bank-work" onClose={() => setReviewTarget(null)} />}
  </div>;
}
