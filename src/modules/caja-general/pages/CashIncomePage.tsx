import { useDeferredValue, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { officeToday } from '@/shared/utils/period';
import { useAuth } from '@/modules/auth/store/auth.context';

type Section = 'payments' | 'withdrawals';
const columns: DataTableColumn<CashIncomeRow>[] = [
  { key: 'folio', header: 'Folio', width: '10%', cell: row => `#${row.operationId}` },
  { key: 'client', header: 'Cliente', width: '20%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre} · ${row.socioComercialNombre}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate text-slate-500">{row.socioComercialNombre}</small></span> },
  { key: 'date', header: 'Registrado', width: '13%', cell: row => formatDate(row.fechaPago) },
  { key: 'method', header: 'Método', width: '11%', cell: row => row.tipoPago === 'CHEQUE' ? `Cheque${row.numeroCheque ? ` · ${row.numeroCheque}` : ''}` : 'Efectivo' },
  { key: 'amount', header: 'Monto', width: '12%', cell: row => <strong className="whitespace-nowrap tabular-nums text-slate-900">{formatMoney(row.monto)}</strong> },
  { key: 'status', header: 'Estatus', kind: 'status', width: '12%', cell: row => <StatusBadge tone="pending" className="whitespace-nowrap">{row.estatus === 'EN_PROCESO' ? 'En proceso' : 'Pendiente'}</StatusBadge> },
  { key: 'actions', header: 'Acciones', kind: 'actions', width: '22%', cell: () => null },
];

export default function CashIncomePage() {
  const navigate = useNavigate();
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
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['cash-work', 'income', page, deferredSearch, method], queryFn: () => cashWorkApi.income(page, deferredSearch, method), enabled: section === 'payments' });
  const latest = useQuery({ queryKey: ['caja-general', 'latest'], queryFn: cajaGeneralApi.latest, enabled: section === 'withdrawals' });
  const today = officeToday();
  const openDayId = latest.data?.fecha === today && !latest.data.closedAt ? latest.data.id : null;
  const openPayment = (row: CashIncomeRow) => {
    if (row.tipoPago === 'CHEQUE') setChequeId(row.id);
    else navigate(`${buildOperationDetailPath(row.operationId)}?action=review-payment&paymentId=${row.id}`);
  };
  const actions = (row: CashIncomeRow) => <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(row.operationId)} aria-label={`Ver operación #${row.operationId}`}><Button variant="neutral">Ver</Button></Link>
    {canResolve && <Button variant="primary" onClick={() => openPayment(row)}>Revisar</Button>}
  </div>;
  const tableColumns = columns.map(column => column.key === 'actions' ? { ...column, cell: actions } : column);
  return <div className="space-y-4">
    <PageHeader title="Entradas de efectivo" />
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 pt-2"><Tabs label="Tipos de entrada" variant="method" value={section} onChange={setSection} options={[{ value: 'payments', label: 'Pagos de ingreso de operaciones' }, { value: 'withdrawals', label: 'Retiros de cuentas bancarias' }]} /></div>
      {section === 'payments' ? <>
        <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar folio, cliente, socio o cheque"
          activeFilters={method ? [{ key: 'method', label: method === 'CHEQUE' ? 'Cheque' : 'Efectivo', onRemove: () => { setMethod(''); setPage(0); } }] : []}
          filters={<label className="block max-w-xs text-sm font-medium text-slate-700">Método
            <select aria-label="Método de entrada" value={method} onChange={event => { setMethod(event.target.value); setPage(0); }} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="">Todos</option><option value="EFECTIVO">Efectivo</option><option value="CHEQUE">Cheque</option>
            </select></label>} />
        <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando pagos pendientes…">
          <DataTable columns={tableColumns} rows={query.data?.content ?? []} getRowKey={row => row.id}
            mobile={{ title: row => `Operación #${row.operationId}`, subtitle: row => `${row.clienteNombre} · ${row.socioComercialNombre}`, status: row => <StatusBadge tone="pending">Pendiente</StatusBadge>, fields: [
              { key: 'method', label: 'Método', value: row => row.tipoPago === 'CHEQUE' ? 'Cheque' : 'Efectivo' },
              { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
              { key: 'date', label: 'Registrado', value: row => formatDate(row.fechaPago) },
            ], actions }} emptyTitle="Sin pagos por validar" emptyDescription="Los pagos en efectivo y cheques pendientes aparecerán aquí." />
        </QueryState>
        <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>
      </> : <div className="p-4"><PendingWithdrawalsInbox canResolve={canResolve} openDayId={openDayId} /></div>}
    </div>
    {chequeId !== null && <ChequeManager paymentId={chequeId} onClose={() => setChequeId(null)} onChanged={async () => { await queryClient.invalidateQueries({ queryKey: ['cash-work'] }); }} />}
  </div>;
}
