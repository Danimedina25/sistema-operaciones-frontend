import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { PageHeader } from '@/shared/components/layout/PageHeader';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { SearchFilterBar } from '@/shared/components/ui/SearchFilterBar';
import { Button } from '@/shared/components/ui/Button';
import { QueryState } from '@/shared/components/ui/QueryState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Tabs } from '@/shared/components/ui/Tabs';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatAccount, formatDateTime, formatMoney } from '@/shared/format';
import { buildOperationDetailPath } from '@/routes/paths';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';
import { bankWorkApi } from '../api/bank-work.api';
import { RegisterWithdrawalForm } from '../components/RegisterWithdrawalModal';
import { WithdrawalsInTransit } from '../components/WithdrawalsInTransit';
import { cashWithdrawalsApi } from '@/modules/cash-withdrawals/api';
import { useRefreshAfterWithdrawal } from '@/modules/cash-withdrawals/hooks';
import type { BankCashWithdrawal } from '@/modules/cash-withdrawals/types';
import { officeToday } from '@/shared/utils/period';

export default function BankOutflowPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const section = params.get('tab') === 'withdrawals' ? 'withdrawals' : 'returns';
  const { hasRole } = useAuth();
  const canPay = hasRole(['JEFA_CUENTAS', 'AUXILIAR_CUENTAS', 'ADMIN']);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const deferredSearch = useDeferredValue(search);
  const query = useQuery({ queryKey: ['bank-work', 'outflow', page, deferredSearch], queryFn: () => bankWorkApi.outflow(page, deferredSearch) });
  const actions = (row: ReturnPaymentResponse) => <div className="flex flex-wrap items-center justify-end gap-2 whitespace-nowrap">
    <Link to={buildOperationDetailPath(row.operationId)} aria-label={`Ver operación #${row.operationId}`}><Button variant="neutral">Ver operación</Button></Link>
    {canPay && <Button variant="primary" onClick={() => navigate(`${buildOperationDetailPath(row.operationId)}?action=manage-return&returnRequestId=${row.id}`)}>Registrar retorno</Button>}
  </div>;
  const columns: DataTableColumn<ReturnPaymentResponse>[] = [
    { key: 'request', header: 'Solicitud', width: '12%', cell: row => <span><strong className="block text-slate-900">#{row.id}</strong><small>Operación #{row.operationId}</small></span> },
    { key: 'client', header: 'Cliente · beneficiario', width: '22%', cell: row => <span className="block min-w-0 truncate" title={`${row.clienteNombre} · ${row.cuentaDestinoTitular ?? ''}`}><strong className="block truncate text-slate-900">{row.clienteNombre}</strong><small className="block truncate">Para: {row.cuentaDestinoTitular || 'Sin titular'}</small></span> },
    { key: 'method', header: 'Método', width: '12%', cell: () => 'Transferencia' },
    { key: 'amount', header: 'Por pagar', width: '13%', cell: row => <span><strong className="block whitespace-nowrap text-orange-700">{formatMoney(row.montoDisponible ?? 0)}</strong><small>de {formatMoney(row.montoSolicitado ?? row.monto ?? 0)}</small></span> },
    { key: 'progress', header: 'Avance', width: '14%', cell: row => <span><span className="block h-1.5 overflow-hidden rounded bg-slate-200"><span className="block h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, row.porcentajeAvance ?? 0))}%` }} /></span><small>{formatMoney(row.montoRetornado ?? 0)} pagado</small></span> },
    { key: 'actions', header: 'Acciones', kind: 'actions', width: '27%', cell: actions },
  ];
  return <div className="space-y-5">
    <PageHeader title="Salidas bancarias" />
    <div className="rounded-xl border border-slate-200 bg-white px-4 pt-2 shadow-sm"><Tabs label="Tipos de salida bancaria" variant="method" value={section} onChange={value => setParams(value === 'withdrawals' ? { tab: 'withdrawals' } : {})} options={[{ value: 'returns', label: 'Retornos de operaciones' }, { value: 'withdrawals', label: 'Retiros a Caja General' }]} /></div>
    {section === 'returns' ? <>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Retornos de operaciones</h2><p className="text-xs text-slate-500">Una fila por solicitud de transferencia.</p></div>
      <SearchFilterBar search={search} onSearchChange={value => { setSearch(value); setPage(0); }} searchPlaceholder="Buscar solicitud, folio, cliente o socio" filters={<p className="text-sm text-slate-500">Se muestran todas las solicitudes pendientes, sin filtro de fecha.</p>} />
      <QueryState isLoading={query.isPending} error={query.error} onRetry={() => void query.refetch()} loadingLabel="Cargando solicitudes bancarias…">
        <DataTable columns={columns} rows={query.data?.content ?? []} getRowKey={row => row.id}
          mobile={{ title: row => `Solicitud #${row.id}`, subtitle: row => `${row.clienteNombre} · Operación #${row.operationId}`, fields: [
            { key: 'beneficiary', label: 'Beneficiario', value: row => row.cuentaDestinoTitular || 'Sin titular' },
            { key: 'amount', label: 'Por pagar', value: row => formatMoney(row.montoDisponible ?? 0) },
            { key: 'progress', label: 'Pagado', value: row => formatMoney(row.montoRetornado ?? 0) },
          ], actions }} emptyTitle="Sin retornos por pagar" emptyDescription="Las solicitudes bancarias pendientes aparecerán aquí." />
      </QueryState>
      <div className="border-t border-slate-100 p-3"><Pagination currentPage={page + 1} totalPages={query.data?.totalPages ?? 0} totalElements={query.data?.totalElements ?? 0} isLoading={query.isFetching} onPageChange={value => setPage(value - 1)} /></div>
    </section>
    </> : <BankWithdrawalsPanel />}
  </div>;
}

function BankWithdrawalsPanel() {
  const { hasRole } = useAuth();
  const canRegister = hasRole(['JEFA_CUENTAS', 'ADMIN']);
  const refresh = useRefreshAfterWithdrawal();
  const today = officeToday();
  const start = `${today.slice(0, 7)}-01`;
  const recent = useQuery({ queryKey: ['cash-withdrawals', 'recent', start, today], queryFn: () => cashWithdrawalsApi.list(start, today) });
  const columns: DataTableColumn<BankCashWithdrawal>[] = [
    { key: 'date', header: 'Fecha y hora', width: '19%', cell: row => formatDateTime(row.registradoEn) },
    { key: 'account', header: 'Cuenta origen', width: '28%', cell: row => <span><strong className="block text-slate-900">{row.cuentaTitular}</strong><small>{formatAccount(row.banco, row.cuentaNumero)}</small></span> },
    { key: 'method', header: 'Forma de retiro', width: '25%', cell: row => row.formaEtiqueta },
    { key: 'status', header: 'Estado', kind: 'status', width: '14%', cell: row => <StatusBadge tone={row.estatus === 'CONFIRMADO' ? 'success' : row.estatus === 'PENDIENTE' ? 'pending' : 'danger'}>{row.estatus === 'CONFIRMADO' ? 'Recibido' : row.estatus === 'PENDIENTE' ? 'En tránsito' : row.estatus === 'RECHAZADO' ? 'Rechazado' : 'Cancelado'}</StatusBadge> },
    { key: 'amount', header: 'Monto', kind: 'actions', width: '14%', cell: row => <strong className="whitespace-nowrap">{formatMoney(row.monto)}</strong> },
  ];
  return <div className="space-y-5">
    {canRegister && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><h2 className="mb-5 text-sm font-semibold text-slate-900">Datos del retiro</h2>
      <RegisterWithdrawalForm onClose={() => {}} onSubmit={async request => { const result = await cashWithdrawalsApi.register(request); await refresh(); await recent.refetch(); return result; }} /></div>}
    <WithdrawalsInTransit canCancel={canRegister} />
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><h2 className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">Retiros recientes</h2>
      <QueryState isLoading={recent.isPending} error={recent.error} onRetry={() => void recent.refetch()} loadingLabel="Cargando retiros…">
        <DataTable columns={columns} rows={recent.data ?? []} getRowKey={row => row.id}
          mobile={{ title: row => row.cuentaTitular, subtitle: row => formatDateTime(row.registradoEn), fields: [
            { key: 'method', label: 'Forma', value: row => row.formaEtiqueta },
            { key: 'status', label: 'Estado', value: row => row.estatus },
            { key: 'amount', label: 'Monto', value: row => formatMoney(row.monto) },
          ] }} emptyTitle="Sin retiros recientes" emptyDescription="Los retiros de este mes aparecerán aquí." />
      </QueryState>
    </section>
  </div>;
}
