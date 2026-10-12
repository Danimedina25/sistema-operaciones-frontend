import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Clock3, RotateCcw, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsAvailableToRequestReturn, getOperationsWithRequestedReturns } from '../api/operations.api';
import type { OperationsFilters, PageResponse, PaymentOperationResponse } from '../types/operations.types.ts';
import { buildOperationDetailPath, buildReturnRequestDetailPath } from '@/routes/paths';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { OperationStatusBadge } from './OperationStatusBadge';
import { formatMoney } from '@/shared/format';

type Panel = 'income' | 'returns' | null;
const filters: OperationsFilters = {
  operationId: 0, search: '', status: 'ALL', dateFilter: '', startDate: '', endDate: '',
  activo: 'ACTIVE', paymentTypes: '', paymentStatus: '', returnStatuses: '',
  cuentaDestinoId: 0, banco: '', socioComercialId: 0,
};
const PAGE_SIZE = 10;
type Page = PageResponse<PaymentOperationResponse>;
const count = (page?: Page) => page?.totalElements ?? 0;

function PendingRows({ operations, kind }: { operations: PaymentOperationResponse[]; kind: 'income' | 'request' | 'follow' | 'rejected' | 'confirm' }) {
  const navigate = useNavigate();
  const action = (operation: PaymentOperationResponse) => kind === 'request'
    ? navigate(`${buildReturnRequestDetailPath(operation.id)}?action=request-return`)
    : navigate(`${buildOperationDetailPath(operation.id)}?${kind === 'income' ? 'action=register-payment&scrollToPayments=true' : kind === 'rejected' ? 'scrollToPayments=true' : 'scrollToReturns=true'}`);
  const label = kind === 'income' ? 'Registrar pago' : kind === 'request' ? 'Solicitar retorno' : kind === 'confirm' ? 'Ver retornos' : 'Revisar';
  const actions = (operation: PaymentOperationResponse) => <div className="flex shrink-0 flex-wrap items-center gap-2">
    <Button type="button" variant="neutral" className="h-9 px-3 text-xs" onClick={() => navigate(buildOperationDetailPath(operation.id))}><ExternalLink className="h-3.5 w-3.5" />Ver operación</Button>
    <Button type="button" className="h-9 px-3 text-xs" onClick={() => action(operation)}>{label}</Button>
  </div>;
  const columns: DataTableColumn<PaymentOperationResponse>[] = [
    { key: 'folio', header: 'Folio', cell: (row) => `#${row.id}`, width: '72px' },
    { key: 'client', header: 'Cliente', cell: (row) => <span className="block truncate font-semibold" title={row.clienteNombre}>{row.clienteNombre}</span> },
    { key: 'amount', header: 'Monto', cell: (row) => formatMoney(row.montoTotal), width: '130px' },
    { key: 'progress', header: kind === 'income' || kind === 'rejected' ? 'Registrado' : 'Solicitado', cell: (row) => formatMoney(kind === 'income' || kind === 'rejected' ? row.montoRegistrado : row.montoSolicitadoRetorno), width: '130px' },
    kind === 'income' || kind === 'request'
      ? { key: 'remaining', header: kind === 'income' ? 'Falta' : 'Por solicitar', cell: (row) => <span className="font-semibold text-amber-700">{formatMoney(kind === 'income' ? row.saldoPendientePorRegistrar : row.saldoPendientePorSolicitar)}</span>, width: '130px' }
      : { key: 'status', header: 'Estatus', cell: (row) => <OperationStatusBadge status={row.estatus} />, kind: 'status', width: '205px' },
    { key: 'actions', header: 'Acciones', cell: actions, kind: 'actions', align: 'right', width: '265px' },
  ];
  return <DataTable columns={columns} rows={operations} getRowKey={(row) => row.id}
    emptyTitle="No hay operaciones en este grupo" emptyDescription="Las nuevas tareas aparecerán aquí."
    mobile={{ title: (row) => row.clienteNombre, subtitle: (row) => `Folio #${row.id}`,
      fields: [
        { key: 'amount', label: 'Monto', value: (row) => formatMoney(row.montoTotal) },
        { key: 'remaining', label: kind === 'income' ? 'Falta' : kind === 'request' ? 'Por solicitar' : 'Solicitado', value: (row) => formatMoney(kind === 'income' ? row.saldoPendientePorRegistrar : kind === 'request' ? row.saldoPendientePorSolicitar : row.montoSolicitadoRetorno) },
      ], actions }} />;
}

export function SocioPendingAccordion() {
  const { hasRole } = useAuth();
  const enabled = hasRole('SOCIO_COMERCIAL');
  const [open, setOpen] = useState<Panel>('income');
  const income = useQuery({ queryKey: ['socio-pending-income-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, { ...filters, status: 'INGRESO_PARCIAL' }), enabled });
  const request = useQuery({ queryKey: ['socio-pending-request-list'], queryFn: () => getOperationsAvailableToRequestReturn(0, PAGE_SIZE, filters), enabled });
  const follow = useQuery({ queryKey: ['socio-pending-follow-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'SOLICITADO,EN_RECOLECCION,ENTREGADO,PARCIALMENTE_RETORNADO' }), enabled });
  const rejected = useQuery({ queryKey: ['socio-pending-rejected-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, { ...filters, status: 'RECHAZADA' }), enabled });
  const confirmation = useQuery({ queryKey: ['socio-pending-confirm-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'EN_RECOLECCION' }), enabled });
  if (!enabled) return null;
  const error = [income, request, follow, rejected, confirmation].find((query) => query.isError);
  const resolved = [rejected, confirmation].every((query) => query.isSuccess) && count(rejected.data) === 0 && count(confirmation.data) === 0;
  return <div className="space-y-3">
    <p className="text-xs text-slate-500">{count(income.data)} pagos por registrar · {count(request.data)} retornos por solicitar · {count(follow.data)} en seguimiento</p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar todos los pendientes. <button type="button" className="underline" onClick={() => void error.refetch()}>Reintentar</button></p>}
    <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
      <button type="button" aria-expanded={open === 'income'} aria-controls="pending-income" onClick={() => setOpen(open === 'income' ? null : 'income')}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-3 border-l-4 border-blue-500 px-4 py-4 text-left sm:flex">
        <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Clock3 className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">Pagos de ingreso por registrar</span><span className="text-xs text-slate-500">Operaciones a las que todavía les faltan pagos de ingreso.</span></span>
        <span className="col-span-2 col-start-2 row-start-2 w-fit rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 sm:shrink-0">{count(income.data)} operaciones</span>
        <ChevronDown className={`col-start-3 row-start-1 h-4 w-4 shrink-0 text-slate-500 ${open === 'income' ? 'rotate-180' : ''}`} />
      </button>
      {open === 'income' && <div id="pending-income"><PendingRows operations={income.data?.content ?? []} kind="income" />{count(income.data) > PAGE_SIZE && <p className="border-t p-3 text-xs text-slate-500">Mostrando las primeras {PAGE_SIZE} operaciones. Abre Operaciones para ver todas.</p>}</div>}
    </section>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" aria-expanded={open === 'returns'} aria-controls="pending-returns" onClick={() => setOpen(open === 'returns' ? null : 'returns')}
        className="grid w-full grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-3 border-l-4 border-red-500 px-4 py-4 text-left sm:flex">
        <span className="rounded-lg bg-red-50 p-2 text-red-600"><RotateCcw className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">Retornos</span><span className="text-xs text-slate-500">Solicita cómo se devuelve el dinero y da seguimiento.</span></span>
        <span className="col-start-2 row-start-2 w-fit whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800 sm:shrink-0">{count(request.data)} por solicitar</span>
        <span className="col-span-2 col-start-2 row-start-3 w-fit whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 sm:shrink-0">{count(follow.data)} en seguimiento</span>
        <ChevronDown className={`col-start-3 row-start-1 h-4 w-4 shrink-0 text-slate-500 ${open === 'returns' ? 'rotate-180' : ''}`} />
      </button>
      {open === 'returns' && <div id="pending-returns" className="space-y-4 p-3">
        <div><h3 className="mb-2 text-sm font-semibold">Por solicitar</h3><PendingRows operations={request.data?.content ?? []} kind="request" /></div>
        <div><h3 className="mb-2 text-sm font-semibold">En seguimiento</h3><PendingRows operations={follow.data?.content ?? []} kind="follow" /></div>
        {(count(request.data) > PAGE_SIZE || count(follow.data) > PAGE_SIZE) && <p className="text-xs text-slate-500">Se muestran las primeras {PAGE_SIZE} operaciones de cada grupo.</p>}
      </div>}
    </section>
    {resolved ? <p className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700"><Check className="h-4 w-4" />Comprobantes rechazados y retornos por confirmar: al día</p>
      : <section className="rounded-xl border border-amber-200 bg-white p-4"><h2 className="mb-3 text-sm font-semibold">También requieren atención</h2>
        {count(rejected.data) > 0 && <div><h3 className="text-xs font-medium text-red-700">Comprobantes rechazados ({count(rejected.data)})</h3><PendingRows operations={rejected.data?.content ?? []} kind="rejected" /></div>}
        {count(confirmation.data) > 0 && <div><h3 className="text-xs font-medium text-amber-700">Retornos por confirmar ({count(confirmation.data)})</h3><PendingRows operations={confirmation.data?.content ?? []} kind="confirm" /></div>}
      </section>}
  </div>;
}
