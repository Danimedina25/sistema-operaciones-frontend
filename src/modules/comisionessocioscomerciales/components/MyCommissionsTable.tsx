import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatDate, formatMoney, formatPercent } from '@/shared/format';
import type { MyWeeklyCommissionOperationResponse as Operation } from '../types/commercial-partner-commissions.types';

interface Props { operations: Operation[] }
const PAGE_SIZE = 10;

function CommissionStatus({ status }: { status: Operation['myCommissionStatus'] | null }) {
  if (!status) return <span>—</span>;
  return <StatusBadge tone={status === 'PAGADA' ? 'success' : 'pending'}>{status === 'PAGADA' ? 'Pagada' : 'Generada'}</StatusBadge>;
}

function Breakdown({ operation }: { operation: Operation }) {
  return <div className="grid gap-2 sm:grid-cols-3">
    <div className="rounded-xl border border-emerald-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">Nivel 1 · Tú</p><p className="mt-1 font-semibold text-emerald-700">{formatMoney(operation.miComision)}</p><CommissionStatus status={operation.myCommissionStatus} /></div>
    <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">Nivel 2 · {operation.socioNivel2 ?? 'Sin socio'}</p><p className="mt-1 font-semibold">{operation.socioNivel2 ? formatMoney(operation.comisionNivel2) : '—'}</p>{operation.socioNivel2 && <CommissionStatus status={operation.statusNivel2} />}</div>
    <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">Nivel 3 · {operation.socioNivel3 ?? 'Sin socio'}</p><p className="mt-1 font-semibold">{operation.socioNivel3 ? formatMoney(operation.comisionNivel3) : '—'}</p>{operation.socioNivel3 && <CommissionStatus status={operation.statusNivel3} />}</div>
  </div>;
}

export function MyCommissionsTable({ operations }: Props) {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  useEffect(() => { setPage(1); setExpanded(null); }, [operations]);
  const totalPages = Math.max(1, Math.ceil(operations.length / PAGE_SIZE));
  const rows = useMemo(() => operations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [operations, page]);
  const toggle = (operation: Operation) => <button type="button" aria-label={`${expanded === operation.operationId ? 'Ocultar' : 'Ver'} desglose de #${operation.operationId}`}
    aria-expanded={expanded === operation.operationId} onClick={() => setExpanded(expanded === operation.operationId ? null : operation.operationId)}
    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ChevronDown className={`h-4 w-4 ${expanded === operation.operationId ? 'rotate-180' : ''}`} /></button>;
  const columns: DataTableColumn<Operation>[] = [
    { key: 'folio', header: 'Folio', cell: (row) => `#${row.operationId}`, width: '68px' },
    { key: 'client', header: 'Cliente', cell: (row) => <span className="block truncate font-semibold text-slate-900" title={row.cliente}>{row.cliente}</span> },
    { key: 'date', header: 'Fecha', cell: (row) => formatDate(row.fechaOperacion), width: '110px' },
    { key: 'amount', header: 'Monto', cell: (row) => formatMoney(row.montoOperacion), width: '125px' },
    { key: 'commission', header: 'Mi comisión', cell: (row) => <span title={`${formatPercent(row.porcentajeComision)} · Red: ${formatMoney(row.comisionRed)}`} className="font-semibold text-emerald-700">{formatMoney(row.miComision)}</span>, width: '125px' },
    { key: 'status', header: 'Estatus', cell: (row) => <CommissionStatus status={row.myCommissionStatus} />, kind: 'status', width: '110px' },
    { key: 'detail', header: 'Desglose', cell: toggle, kind: 'actions', align: 'right', width: '75px' },
  ];
  return <>
    <DataTable columns={columns} rows={rows} getRowKey={(row) => row.operationId}
      emptyTitle="No hay comisiones en esta vista" emptyDescription="Cambia la semana o el estado para ver otras operaciones."
      expandedRow={(row) => expanded === row.operationId ? <Breakdown operation={row} /> : null}
      mobile={{ title: (row) => row.cliente, subtitle: (row) => `Folio #${row.operationId}`, status: (row) => <CommissionStatus status={row.myCommissionStatus} />,
        fields: [
          { key: 'date', label: 'Fecha', value: (row) => formatDate(row.fechaOperacion) },
          { key: 'amount', label: 'Monto', value: (row) => formatMoney(row.montoOperacion) },
          { key: 'percent', label: 'Comisión', value: (row) => formatPercent(row.porcentajeComision) },
          { key: 'mine', label: 'Mi comisión', value: (row) => formatMoney(row.miComision) },
        ], actions: toggle, extra: (row) => expanded === row.operationId ? <Breakdown operation={row} /> : null }} />
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>{operations.length} operaciones · Página {page} de {totalPages}</span>
      <div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Siguiente</button></div>
    </div>
  </>;
}
