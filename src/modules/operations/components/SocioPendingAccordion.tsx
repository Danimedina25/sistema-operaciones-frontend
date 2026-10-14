import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock3, RotateCcw, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsAvailableToRequestReturn, getOperationsWithRequestedReturns } from '../api/operations.api';
import type { OperationsFilters, PageResponse, PaymentOperationResponse } from '../types/operations.types.ts';
import { buildOperationDetailPath } from '@/routes/paths';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { OperationStatusBadge } from './OperationStatusBadge';
import { formatDate, formatMoney } from '@/shared/format';
import { Tabs } from '@/shared/components/ui/Tabs';
import { RequestReturnModal } from './returns/RequestReturnModal';
import { useRequestReturnPayment } from '../hooks/returns/use-request-return-payment';
import { useAddOperationPayment } from '../hooks/use-add-operation-payment';
import { useBankAccounts } from '@/modules/bank-accounts/hooks/use-bank-accounts';
import { AddOperationPaymentForm } from './AddOperationPaymentForm';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';

type Panel = 'income' | 'returns' | null;
const filters: OperationsFilters = {
  operationId: 0, search: '', status: 'ALL', dateFilter: '', startDate: '', endDate: '',
  activo: 'ACTIVE', paymentTypes: '', paymentStatus: '', returnStatuses: '',
  cuentaDestinoId: 0, banco: '', socioComercialId: 0,
};
const PAGE_SIZE = 10;
type Page = PageResponse<PaymentOperationResponse>;
const count = (page?: Page) => page?.totalElements ?? 0;

function PendingRows({ operations, kind, onRequestReturn, onRegisterPayment }: { operations: PaymentOperationResponse[]; kind: 'income' | 'request' | 'follow' | 'rejected' | 'confirm'; onRequestReturn?: (operation: PaymentOperationResponse) => void; onRegisterPayment?: (operation: PaymentOperationResponse) => void }) {
  const navigate = useNavigate();
  const followProgress = (row: PaymentOperationResponse) => {
    const total = row.montoSolicitadoRetorno ?? 0;
    const received = row.montoRetornado ?? 0;
    const percent = total > 0 ? Math.min(100, Math.max(0, Math.round(received / total * 100))) : 0;
    return <div className="min-w-0"><p className="mb-1 whitespace-nowrap text-xs text-slate-700">{formatMoney(received)} recibido</p><div role="progressbar" aria-label="Retorno recibido" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-[10px] text-slate-400">{percent}% entregado</p></div>;
  };
  const action = (operation: PaymentOperationResponse) => kind === 'request'
    ? onRequestReturn?.(operation)
    : kind === 'income' ? onRegisterPayment?.(operation)
    : navigate(`${buildOperationDetailPath(operation.id)}?${kind === 'rejected' ? 'scrollToPayments=true' : 'scrollToReturns=true'}`);
  const label = kind === 'income' ? 'Registrar pago' : kind === 'request' ? 'Solicitar retorno' : kind === 'confirm' ? 'Ver retornos' : 'Revisar';
  const actions = (operation: PaymentOperationResponse) => <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
    <Button type="button" variant="neutral" className="h-9 flex-1 px-3 text-xs sm:flex-none" onClick={() => navigate(buildOperationDetailPath(operation.id))}><ExternalLink className="h-3.5 w-3.5" />Ver operación</Button>
    <Button type="button" variant="dark" className="h-9 flex-1 px-3 text-xs sm:flex-none" onClick={() => action(operation)}>{label}</Button>
  </div>;
  const columns: DataTableColumn<PaymentOperationResponse>[] = [
    { key: 'folio', header: 'Folio', cell: (row) => `#${row.id}`, width: '72px' },
    { key: 'client', header: 'Cliente', cell: (row) => <span className="block truncate font-semibold" title={row.clienteNombre}>{row.clienteNombre}</span> },
    { key: 'created', header: 'Creada', cell: (row) => formatDate(row.createdAt), width: '125px' },
    ...(kind === 'follow'
      ? [
          { key: 'requested', header: 'Solicitado', cell: (row: PaymentOperationResponse) => formatMoney(row.montoSolicitadoRetorno), width: '130px' },
          { key: 'progress', header: 'Avance', cell: followProgress, width: '200px' },
        ]
      : kind === 'request'
        ? [{ key: 'remaining', header: 'Neto por solicitar', cell: (row: PaymentOperationResponse) => <span className="block font-semibold text-slate-900">{formatMoney(row.saldoPendientePorSolicitar)}<span className="block text-xs font-normal text-slate-400">de {formatMoney(row.montoTotal)}</span></span>, width: '170px' }]
      : [
          { key: 'amount', header: 'Monto', cell: (row: PaymentOperationResponse) => formatMoney(row.montoTotal), width: '130px' },
          { key: 'progress', header: kind === 'income' || kind === 'rejected' ? 'Registrado' : 'Solicitado', cell: (row: PaymentOperationResponse) => formatMoney(kind === 'income' || kind === 'rejected' ? row.montoRegistrado : row.montoSolicitadoRetorno), width: '130px' },
        ]),
    kind === 'income'
      ? { key: 'remaining', header: 'Falta', cell: (row) => <span className="font-semibold text-amber-700">{formatMoney(row.saldoPendientePorRegistrar)}</span>, width: '130px' }
      : { key: 'status', header: 'Estatus', cell: (row) => <OperationStatusBadge status={row.estatus} />, kind: 'status', width: '205px' },
    { key: 'actions', header: 'Acciones', cell: actions, kind: 'actions', align: 'right', width: '300px' },
  ];
  return <DataTable columns={columns} rows={operations} getRowKey={(row) => row.id}
    emptyTitle="No hay operaciones en este grupo" emptyDescription="Las nuevas tareas aparecerán aquí."
    mobileCardClassName="border-0 p-4 shadow-none"
    mobile={{ title: (row) => row.clienteNombre, subtitle: (row) => `Folio #${row.id}`,
      fields: [
        { key: 'amount', label: 'Monto', value: (row) => formatMoney(row.montoTotal) },
        { key: 'remaining', label: kind === 'income' ? 'Falta' : kind === 'request' ? 'Por solicitar' : 'Solicitado', value: (row) => formatMoney(kind === 'income' ? row.saldoPendientePorRegistrar : kind === 'request' ? row.saldoPendientePorSolicitar : row.montoSolicitadoRetorno) },
      ], extra: kind === 'follow' ? followProgress : undefined, actions }} />;
}

export function SocioPendingAccordion() {
  const { hasRole } = useAuth();
  const enabled = hasRole('SOCIO_COMERCIAL');
  const [open, setOpen] = useState<Panel>('income');
  const [returnsTab, setReturnsTab] = useState<'request' | 'follow'>('request');
  const [selectedRequest, setSelectedRequest] = useState<PaymentOperationResponse | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<PaymentOperationResponse | null>(null);
  const { accounts, isLoading: isLoadingAccounts } = useBankAccounts({ enabled: selectedIncome !== null });
  const bankAccounts = useMemo(() => accounts.filter((account) => account.activo).map((account) => ({ id: account.id, label: `${account.banco} - ${account.titular} - ${account.numeroCuenta}` })), [accounts]);
  const income = useQuery({ queryKey: ['socio-pending-income-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, { ...filters, status: 'INGRESO_PARCIAL' }), enabled });
  const request = useQuery({ queryKey: ['socio-pending-request-list'], queryFn: () => getOperationsAvailableToRequestReturn(0, PAGE_SIZE, filters), enabled });
  const follow = useQuery({ queryKey: ['socio-pending-follow-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'SOLICITADO,EN_RECOLECCION,ENTREGADO,PARCIALMENTE_RETORNADO' }), enabled });
  const { isSubmitting: isSubmittingIncome, submitAddOperationPayment } = useAddOperationPayment({ onSuccess: async () => {
    setSelectedIncome(null);
    await income.refetch();
  } });
  const { isSubmitting, submitRequestReturnPayment } = useRequestReturnPayment({ onSuccess: async () => {
    setSelectedRequest(null);
    await Promise.all([request.refetch(), follow.refetch()]);
  } });
  const rejected = useQuery({ queryKey: ['socio-pending-rejected-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, { ...filters, status: 'RECHAZADA' }), enabled });
  const confirmation = useQuery({ queryKey: ['socio-pending-confirm-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'EN_RECOLECCION' }), enabled });
  if (!enabled) return null;
  const error = [income, request, follow, rejected, confirmation].find((query) => query.isError);
  const resolved = [rejected, confirmation].every((query) => query.isSuccess) && count(rejected.data) === 0 && count(confirmation.data) === 0;
  return <div className="space-y-3">
    <p className="text-xs text-slate-500">{count(income.data)} {count(income.data) === 1 ? 'pago' : 'pagos'} por registrar · {count(request.data)} {count(request.data) === 1 ? 'retorno' : 'retornos'} por solicitar<span className="hidden sm:inline"> · {count(follow.data)} en seguimiento</span></p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar todos los pendientes. <button type="button" className="underline" onClick={() => void error.refetch()}>Reintentar</button></p>}
    <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
      <button type="button" aria-expanded={open === 'income'} aria-controls="pending-income" onClick={() => setOpen(open === 'income' ? null : 'income')}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-3 border-l-4 border-blue-500 px-4 py-4 text-left sm:flex">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Clock3 className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900 max-sm:text-xs">Pagos de ingreso por registrar</span><span className="hidden text-xs text-slate-500 sm:block">Operaciones a las que todavía les faltan pagos de ingreso.</span><span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800 sm:hidden">{count(income.data)} {count(income.data) === 1 ? 'operación' : 'operaciones'}</span></span>
        <span className="hidden w-fit rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 sm:inline-flex sm:shrink-0">{count(income.data)} {count(income.data) === 1 ? 'operación' : 'operaciones'}</span>
        <span className="col-start-3 row-start-1 rounded-lg bg-slate-100 p-2 sm:bg-transparent sm:p-0"><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 ${open === 'income' ? 'rotate-180' : ''}`} /></span>
      </button>
      {open === 'income' && <div id="pending-income"><PendingRows operations={income.data?.content ?? []} kind="income" onRegisterPayment={setSelectedIncome} />{count(income.data) > PAGE_SIZE && <p className="border-t p-3 text-xs text-slate-500">Mostrando las primeras {PAGE_SIZE} operaciones. Abre Operaciones para ver todas.</p>}</div>}
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" aria-expanded={open === 'returns'} aria-controls="pending-returns" onClick={() => setOpen(open === 'returns' ? null : 'returns')}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-3 border-l-4 border-red-500 px-4 py-4 text-left sm:flex">
        <span className="rounded-lg bg-red-50 p-2 text-red-600"><RotateCcw className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">Retornos</span><span className="hidden text-xs text-slate-500 sm:block">Solicita cómo se devuelve el dinero y da seguimiento.</span><span className="mt-1 flex flex-wrap gap-1 sm:hidden"><span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">{count(request.data)} por solicitar</span><span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{count(follow.data)} en seguimiento</span></span></span>
        <span className="hidden w-fit whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 sm:inline-flex sm:shrink-0">{count(request.data)} por solicitar</span>
        <span className="hidden w-fit whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 sm:inline-flex sm:shrink-0">{count(follow.data)} en seguimiento</span>
        <span className="col-start-3 row-start-1 rounded-lg bg-slate-100 p-2 sm:bg-transparent sm:p-0"><ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 ${open === 'returns' ? 'rotate-180' : ''}`} /></span>
      </button>
      {open === 'returns' && <div id="pending-returns">
        <div className="border-b border-slate-100 px-4 py-3">
          <Tabs label="Estado de retornos" value={returnsTab} onChange={setReturnsTab}
            className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 [&>button]:justify-center"
            options={[{ value: 'request', label: 'Por solicitar', count: count(request.data) }, { value: 'follow', label: 'Seguimiento', count: count(follow.data) }]} />
        </div>
        <div role="tabpanel" aria-label={returnsTab === 'request' ? 'Por solicitar' : 'Seguimiento'}>
          <PendingRows operations={returnsTab === 'request' ? request.data?.content ?? [] : follow.data?.content ?? []} kind={returnsTab} onRequestReturn={setSelectedRequest} />
        </div>
        {returnsTab === 'follow' && <p className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">Los retornos solicitados son de seguimiento: no requieren acción tuya y no cuentan como pendiente.</p>}
        {(count(request.data) > PAGE_SIZE || count(follow.data) > PAGE_SIZE) && <p className="text-xs text-slate-500">Se muestran las primeras {PAGE_SIZE} operaciones de cada grupo.</p>}
      </div>}
    </section>
    {resolved ? <p className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700"><Check className="h-4 w-4" />Comprobantes rechazados y retornos por confirmar: al día</p>
      : <section className="rounded-xl border border-amber-200 bg-white p-4"><h2 className="mb-3 text-sm font-semibold">También requieren atención</h2>
        {count(rejected.data) > 0 && <div><h3 className="text-xs font-medium text-red-700">Comprobantes rechazados ({count(rejected.data)})</h3><PendingRows operations={rejected.data?.content ?? []} kind="rejected" /></div>}
        {count(confirmation.data) > 0 && <div><h3 className="text-xs font-medium text-amber-700">Retornos por confirmar ({count(confirmation.data)})</h3><PendingRows operations={confirmation.data?.content ?? []} kind="confirm" /></div>}
      </section>}
    <RequestReturnModal open={selectedRequest !== null} operation={selectedRequest} isSubmitting={isSubmitting} onClose={() => setSelectedRequest(null)} onSubmit={submitRequestReturnPayment} />
    <ActionDrawer open={selectedIncome !== null} title={selectedIncome ? `Operación #${selectedIncome.id} · ${selectedIncome.clienteNombre}` : 'Registrar pago de ingreso'} eyebrow="Registrar pago de ingreso" subtitle={selectedIncome ? `Monto de la operación: ${formatMoney(selectedIncome.montoTotal)}` : undefined} onClose={() => setSelectedIncome(null)}>
      {selectedIncome && (isLoadingAccounts ? <p className="p-5 text-sm text-slate-500">Cargando cuentas bancarias...</p> : <AddOperationPaymentForm isSubmitting={isSubmittingIncome} bankAccounts={bankAccounts} montoTotal={selectedIncome.montoTotal} montoRegistrado={selectedIncome.montoRegistrado} saldoPendiente={selectedIncome.saldoPendientePorRegistrar} onSubmit={(values) => submitAddOperationPayment(selectedIncome.id, values)} />)}
    </ActionDrawer>
  </div>;
}
