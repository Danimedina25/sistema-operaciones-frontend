import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, RotateCcw, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/store/auth.context';
import { getMyOperations, getOperationsAvailableToRequestReturn, getOperationsWithRequestedReturns } from '../api/operations.api';
import type { OperationsFilters, PageResponse, PaymentOperationResponse } from '../types/operations.types.ts';
import { buildOperationActionPath, buildOperationDetailPath } from '@/routes/paths';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { OperationStatusBadge } from './OperationStatusBadge';
import { formatDate, formatMoney } from '@/shared/format';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { PendingUrgencyBadge } from '@/shared/components/ui/PendingUrgencyBadge';
import { usePendingUrgency } from '@/shared/hooks/use-pending-urgency';
import { oldestOf } from '@/shared/utils/pending-urgency';

type Panel = 'income' | 'request' | 'confirm' | 'rejected' | 'follow' | null;
const filters: OperationsFilters = {
  operationId: 0, search: '', status: 'ALL', dateFilter: '', startDate: '', endDate: '',
  activo: 'ACTIVE', paymentTypes: '', paymentStatus: '', returnStatuses: '',
  cuentaDestinoId: 0, banco: '', socioComercialId: 0,
};
const PAGE_SIZE = 10;
type Page = PageResponse<PaymentOperationResponse>;
const count = (page?: Page) => page?.totalElements ?? 0;
const OLDEST_FIRST = 'updatedAt,asc';
const oldestUpdate = (page?: Page) => oldestOf(...(page?.content ?? []).map(row => row.updatedAt));

function PendingRows({ operations, kind }: { operations: PaymentOperationResponse[]; kind: 'income' | 'request' | 'follow' | 'rejected' | 'confirm' }) {
  const navigate = useNavigate();
  const followProgress = (row: PaymentOperationResponse) => {
    const total = row.montoSolicitadoRetorno ?? 0;
    const received = row.montoRetornado ?? 0;
    const percent = total > 0 ? Math.min(100, Math.max(0, Math.round(received / total * 100))) : 0;
    return <div className="min-w-0"><p className="mb-1 whitespace-nowrap text-xs text-slate-700">{formatMoney(received)} recibido</p><div role="progressbar" aria-label="Retorno recibido" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-[10px] text-slate-400">{percent}% entregado</p></div>;
  };
  const action = (operation: PaymentOperationResponse) => navigate(kind === 'follow'
    ? `${buildOperationDetailPath(operation.id)}?scrollToReturns=true`
    : buildOperationActionPath(operation.id, kind === 'income' ? 'register-payment' : kind === 'request' ? 'request-return' : kind === 'rejected' ? 'review-rejected-payment' : 'confirm-return'));
  const label = kind === 'income' ? 'Registrar pago' : kind === 'request' ? 'Solicitar retorno' : kind === 'confirm' ? 'Ver retornos' : 'Revisar';
  const actions = (operation: PaymentOperationResponse) => <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
    <Button type="button" variant="neutral" className="h-9 flex-1 px-3 text-xs sm:flex-none" onClick={() => navigate(buildOperationDetailPath(operation.id))}><ExternalLink className="h-3.5 w-3.5" />Ver operación</Button>
    <Button type="button" variant="dark" className="h-9 flex-1 px-3 text-xs sm:flex-none" onClick={() => action(operation)}>{label}</Button>
  </div>;
  const columns: DataTableColumn<PaymentOperationResponse>[] = [
    { key: 'folio', header: 'Folio', cell: (row) => `#${row.id}`, width: '6%' },
    { key: 'client', header: 'Cliente', cell: (row) => <span className="block truncate font-semibold" title={row.clienteNombre}>{row.clienteNombre}</span>, width: kind === 'request' ? '22%' : '18%' },
    { key: 'created', header: 'Creada', cell: (row) => formatDate(row.createdAt), width: '12%' },
    ...(kind === 'follow'
      ? [
          { key: 'requested', header: 'Solicitado', cell: (row: PaymentOperationResponse) => formatMoney(row.montoSolicitadoRetorno), width: '12%' },
          { key: 'progress', header: 'Avance', cell: followProgress, width: '16%' },
        ]
      : kind === 'request'
        ? [{ key: 'remaining', header: 'Neto por solicitar', cell: (row: PaymentOperationResponse) => <span className="block font-semibold text-slate-900">{formatMoney(row.saldoPendientePorSolicitar)}<span className="block text-xs font-normal text-slate-400">de {formatMoney(row.montoTotal)}</span></span>, width: '18%' }]
      : [
          { key: 'amount', header: 'Monto', cell: (row: PaymentOperationResponse) => formatMoney(row.montoTotal), width: '12%' },
          { key: 'progress', header: kind === 'income' || kind === 'rejected' ? 'Registrado' : 'Solicitado', cell: (row: PaymentOperationResponse) => formatMoney(kind === 'income' || kind === 'rejected' ? row.montoRegistrado : row.montoSolicitadoRetorno), width: '12%' },
        ]),
    kind === 'income'
      ? { key: 'remaining', header: 'Falta', cell: (row) => <span className="font-semibold text-amber-700">{formatMoney(row.saldoPendientePorRegistrar)}</span>, width: '12%' }
      : { key: 'status', header: 'Estatus', cell: (row) => <span className="[&>span]:max-w-full [&>span]:whitespace-normal [&>span]:break-words"><OperationStatusBadge status={row.estatus} /></span>, kind: 'status', width: kind === 'request' ? '18%' : '16%' },
    { key: 'actions', header: 'Acciones', cell: actions, kind: 'actions', align: 'right', width: kind === 'income' ? '28%' : kind === 'request' ? '24%' : '20%' },
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
  const [open, setOpen] = useState<Panel>(null);
  const listRef = useRef<HTMLElement>(null);
  const [listVisit, setListVisit] = useState(0);
  useEffect(() => {
    if (!listVisit) return;
    listRef.current?.focus({ preventScroll: true });
    listRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [listVisit]);
  function openList(panel: Panel) { setOpen(panel); setListVisit(current => current + 1); }
  // Lo más atrasado primero: el semáforo toma la operación con más tiempo sin cambios.
  const income = useQuery({ queryKey: ['socio-pending-income-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, filters, { missingIncome: true, sort: OLDEST_FIRST }), enabled });
  const request = useQuery({ queryKey: ['socio-pending-request-list'], queryFn: () => getOperationsAvailableToRequestReturn(0, PAGE_SIZE, filters, OLDEST_FIRST), enabled });
  const follow = useQuery({ queryKey: ['socio-pending-follow-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'SOLICITADO,EN_RECOLECCION,ENTREGADO,PARCIALMENTE_RETORNADO' }), enabled });
  const rejected = useQuery({ queryKey: ['socio-pending-rejected-list'], queryFn: () => getMyOperations(0, PAGE_SIZE, { ...filters, paymentStatus: 'RECHAZADA' }, { sort: OLDEST_FIRST }), enabled });
  const confirmation = useQuery({ queryKey: ['socio-pending-confirm-list'], queryFn: () => getOperationsWithRequestedReturns(0, PAGE_SIZE, { ...filters, returnStatuses: 'EN_RECOLECCION' }, OLDEST_FIRST), enabled });
  const urgencyOf = usePendingUrgency();
  if (!enabled) return null;
  const error = [income, request, follow, rejected, confirmation].find((query) => query.isError);
  const groups = [
    { key: 'income' as const, title: 'Pagos de ingreso por registrar', action: 'Ver pagos por registrar', query: income, icon: Clock3, border: 'border-t-blue-500', iconColor: 'bg-blue-100 text-blue-700', description: 'Completa los pagos de ingreso de tus operaciones.' },
    { key: 'request' as const, title: 'Retornos por solicitar', action: 'Ver retornos por solicitar', query: request, icon: RotateCcw, border: 'border-t-violet-500', iconColor: 'bg-violet-100 text-violet-700', description: 'Indica cómo se devolverá el dinero al cliente.' },
    { key: 'confirm' as const, title: 'Retornos por confirmar', action: 'Ver retornos por confirmar', query: confirmation, icon: CheckCircle2, border: 'border-t-amber-500', iconColor: 'bg-amber-100 text-amber-700', description: 'Revisa los retornos y confirma lo recibido por el cliente.' },
    { key: 'rejected' as const, title: 'Comprobantes rechazados', action: 'Ver comprobantes rechazados', query: rejected, icon: AlertTriangle, border: 'border-t-red-500', iconColor: 'bg-red-100 text-red-700', description: 'Revisa el motivo del rechazo y corrige el pago.' },
    { key: 'follow' as const, title: 'Retornos en seguimiento', action: 'Ver seguimiento', query: follow, icon: RotateCcw, border: 'border-t-slate-400', iconColor: 'bg-slate-100 text-slate-600', description: 'Consulta su avance. No se cuentan como pendientes de acción.' },
  ];
  const selected = groups.find(group => group.key === open);
  const selectedQuery = open === 'follow' ? follow : selected?.query;
  return <div className="space-y-5">
    <p className="text-sm text-slate-500">Pendientes de todas las fechas · Cantidades por operación</p>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar todos los pendientes. <button type="button" className="underline" onClick={() => void error.refetch()}>Reintentar</button></p>}
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(({ key, title, action, query, icon: Icon, border, iconColor, description }) => <article key={key} aria-label={title} className={`flex min-w-0 flex-col rounded-2xl border border-t-[3px] border-slate-200 bg-white p-6 shadow-sm ${border}`}>
        <div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconColor}`}><Icon aria-hidden="true" className="h-5 w-5" /></span><h2 className="min-w-0 flex-1 text-base font-semibold leading-5 text-slate-950">{title}</h2></div>
        <p className="mt-5 flex items-baseline gap-2" aria-live="polite"><strong className="text-4xl font-bold tabular-nums text-slate-950">{query.isPending ? '…' : query.isError ? '—' : count(query.data)}</strong><span className="text-sm text-slate-500">{count(query.data) === 1 ? 'operación' : 'operaciones'}</span></p>
        <p className="mt-3 min-h-10 text-sm text-slate-500">{description}</p>
        <div className="mb-5 mt-3">{query.isSuccess && key !== 'follow' && urgencyOf(count(query.data), oldestUpdate(query.data))
          ? <PendingUrgencyBadge urgency={urgencyOf(count(query.data), oldestUpdate(query.data))} />
          : <StatusBadge tone={query.isError ? 'danger' : key === 'follow' ? 'neutral' : query.isSuccess && count(query.data) === 0 ? 'success' : 'pending'}>{query.isPending ? 'Cargando' : query.isError ? 'No disponible' : key === 'follow' ? count(query.data) === 0 ? 'Sin retornos en seguimiento' : 'Solo seguimiento' : count(query.data) === 0 ? 'Sin pendientes' : 'Requiere atención'}</StatusBadge>}</div>
        <Button variant="dark" className="mt-auto w-full text-xs" disabled={!query.isSuccess} aria-controls="socio-pending-list" aria-expanded={open === key} onClick={() => openList(key)}>{action}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Button>
      </article>)}
    </div>
    {open && selectedQuery && <section id="socio-pending-list" ref={listRef} tabIndex={-1} aria-label={open === 'follow' ? 'Listado de retornos en seguimiento' : `Listado de ${selected?.title.toLowerCase()}`} className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-950">{open === 'follow' ? 'Retornos en seguimiento' : selected?.title}</h2><Button variant="neutral" className="h-9 px-3 text-xs" onClick={() => setOpen(null)}>Cerrar listado</Button></div>
      {selectedQuery.isError ? <p role="alert" className="p-5 text-sm text-red-700">No se pudo cargar el listado.</p> : selectedQuery.isPending ? <p className="p-5 text-sm text-slate-500">Cargando operaciones…</p> : <PendingRows operations={selectedQuery.data?.content ?? []} kind={open} />}
      {count(selectedQuery.data) > PAGE_SIZE && <p className="border-t border-slate-100 p-4 text-xs text-slate-500">Mostrando las primeras {PAGE_SIZE} operaciones. Abre Operaciones para ver todas.</p>}
    </section>}
  </div>;
}
