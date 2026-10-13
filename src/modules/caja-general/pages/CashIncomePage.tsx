import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { Tabs } from '@/shared/components/ui/Tabs';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { QueryState } from '@/shared/components/ui/QueryState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate, formatMoney } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import { cashWorkApi, type CashIncomeRow } from '../api/cash-work.api';
import { cajaGeneralApi } from '../api/caja-general.api';
import { PendingWithdrawalsInbox } from '../components/PendingWithdrawalsInbox';
import { ChequeManager } from '@/modules/cheques/ChequeManager';
import { IncomePaymentReview } from '@/modules/operations/components/IncomePaymentReview';
import { officeToday } from '@/shared/utils/period';
import { useAuth } from '@/modules/auth/store/auth.context';
import { Banknote, Check, ExternalLink, Landmark, ReceiptText } from 'lucide-react';

type Section = 'payments' | 'withdrawals';
const columns: DataTableColumn<CashIncomeRow>[] = [
  { key: 'folio', header: 'Operación', width: '13%', cell: row => <strong className="whitespace-nowrap text-slate-950">Folio #{row.operationId}</strong> },
  { key: 'partner', header: 'Socio', width: '16%', cell: row => <span className="block min-w-0 truncate" title={row.socioComercialNombre}>{row.socioComercialNombre}</span> },
  { key: 'method', header: 'Tipo de pago', width: '17%', cell: row => <span className="flex min-w-0 items-center gap-2"><span className="text-slate-500">{row.tipoPago === 'CHEQUE' ? <ReceiptText className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}</span><span className="min-w-0"><strong className="block truncate text-slate-950">{row.tipoPago === 'CHEQUE' ? 'Cheque' : 'Efectivo'}</strong><small className="block truncate text-slate-400">{row.tipoPago === 'CHEQUE' ? (row.numeroCheque ? `No. ${row.numeroCheque}` : 'Número no disponible') : 'Directo a Caja General'}</small></span></span> },
  { key: 'date', header: 'Comprobante', width: '12%', cell: row => <span className="whitespace-nowrap font-semibold text-slate-900">{formatDate(row.fechaPago)}</span> },
  { key: 'amount', header: 'Monto', width: '15%', align: 'right', cell: row => <strong className="whitespace-nowrap tabular-nums text-slate-900">{formatMoney(row.monto)}</strong> },
  { key: 'actions', header: '', kind: 'actions', width: '27%', cell: () => null },
];

export default function CashIncomePage() {
  const { hasRole } = useAuth();
  const canResolve = hasRole(['JEFA_CAJAS', 'ADMIN']);
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const section: Section = params.get('tab') === 'withdrawals' ? 'withdrawals' : 'payments';
  const setSection = (value: Section) => setParams(value === 'withdrawals' ? { tab: 'withdrawals' } : {});
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(0);
  const [chequeId, setChequeId] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ operationId: number; paymentId: number } | null>(null);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['cash-work', 'income', page, deferredSearch, method], queryFn: () => cashWorkApi.income(page, deferredSearch, method), enabled: section === 'payments' });
  const summary = useQuery({ queryKey: ['cash-work', 'summary'], queryFn: cashWorkApi.summary });
  const latest = useQuery({ queryKey: ['caja-general', 'latest'], queryFn: cajaGeneralApi.latest, enabled: section === 'withdrawals' });
  const today = officeToday();
  const openDayId = latest.data?.fecha === today && !latest.data.closedAt ? latest.data.id : null;
  const openPayment = (row: CashIncomeRow) => {
    if (row.tipoPago === 'CHEQUE') setChequeId(row.id);
    else setReviewTarget({ operationId: row.operationId, paymentId: row.id });
  };
  const actions = (row: CashIncomeRow) => <div className="flex items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(row.operationId)} aria-label={`Ver operación #${row.operationId}`}><Button variant="neutral" className="h-9 px-3 text-xs"><ExternalLink className="h-3.5 w-3.5" />Ver operación</Button></Link>
    {canResolve && <Button variant="success" className="h-9 px-3 text-xs" onClick={() => openPayment(row)}><Check className="h-3.5 w-3.5" />Confirmar</Button>}
  </div>;
  const tableColumns = columns.map(column => column.key === 'actions' ? { ...column, cell: actions } : column);
  return <div className="mx-4 space-y-6 pt-2">
    <PageHeader title="Entradas de efectivo" />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 pt-2 shadow-sm"><Tabs label="Tipos de entrada" variant="method" value={section} onChange={setSection} options={[{ value: 'payments', label: 'Pagos de ingreso de operaciones', count: summary.data?.income.count, icon: <ReceiptText className="h-4 w-4" /> }, { value: 'withdrawals', label: 'Retiros de cuentas bancarias', count: summary.data?.withdrawals.count, icon: <Landmark className="h-4 w-4" /> }]} /><p className="pb-2 text-sm text-slate-500">{section === 'payments' ? 'Por validar' : 'Por ingresar'} <strong className="ml-2 text-lg tabular-nums text-slate-950">{formatMoney(section === 'payments' ? summary.data?.income.amount : summary.data?.withdrawals.amount)}</strong></p></div>
    {section === 'payments' ? <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar folio, cliente, socio o cheque"
          activeFilters={method ? [{ key: 'method', label: method === 'CHEQUE' ? 'Cheque' : 'Efectivo', onRemove: () => { setMethod(''); setPage(0); } }] : []}
          filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Método
            <select aria-label="Método de entrada" value={method} onChange={event => { setMethod(event.target.value); setPage(0); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="CHEQUE">Cheque</option>
            </select></label>} />
        <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando pagos pendientes…">
          <DataTable columns={tableColumns} rows={query.data?.content ?? []} getRowKey={row => row.id}
            mobile={{ title: row => `Folio #${row.operationId}`, subtitle: row => `${row.clienteNombre} · ${row.socioComercialNombre}`, status: row => <StatusBadge tone="pending">Pendiente</StatusBadge>, fields: [
              { key: 'method', label: 'Método', value: row => row.tipoPago === 'CHEQUE' ? 'Cheque' : 'Efectivo' },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
              { key: 'date', label: 'Registrado', value: row => formatDate(row.fechaPago) },
            ], actions }} emptyTitle="Sin pagos por validar" emptyDescription="Los pagos en efectivo y cheques pendientes aparecerán aquí." />
        </QueryState>
        {(query.data?.totalPages ?? 0) > 1 && <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>}
      </div> : <PendingWithdrawalsInbox canResolve={canResolve} openDayId={openDayId} />}
    {section === 'payments' && <p className="text-sm text-slate-500">Los pagos ya validados aparecen en el libro de movimientos del <Link to="/caja-general" className="font-semibold text-blue-600 hover:underline">Corte →</Link></p>}
    {chequeId !== null && <ChequeManager paymentId={chequeId} onClose={() => setChequeId(null)} onChanged={async () => { await queryClient.invalidateQueries({ queryKey: ['cash-work'] }); }} />}
    {reviewTarget && <IncomePaymentReview operationId={reviewTarget.operationId} paymentId={reviewTarget.paymentId} workQueryKey="cash-work" onClose={() => setReviewTarget(null)} />}
  </div>;
}
