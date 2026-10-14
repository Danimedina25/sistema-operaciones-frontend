import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@/shared/components/ui/DataTable';
import { QueryState } from '@/shared/components/ui/QueryState';
import { formatElapsedSince, formatMoney } from '@/shared/format';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { buildOperationDetailPath } from '@/routes/paths';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';
import type { PaymentOperationResponse } from '@/modules/operations/types/operations.types.ts';

const action = (row: PaymentOperationResponse) => <Link to={buildOperationDetailPath(row.id)} className="whitespace-nowrap font-semibold text-blue-600">Ver operación</Link>;
const columns: DataTableColumn<PaymentOperationResponse>[] = [
  { key: 'folio', header: 'Folio', width: '11%', cell: row => '#' + row.id },
  { key: 'cliente', header: 'Cliente', width: '26%', cell: row => <span className="block truncate" title={row.clienteNombre}>{row.clienteNombre}</span> },
  { key: 'monto', header: 'Monto', width: '17%', cell: row => <span className="whitespace-nowrap">{formatMoney(row.montoTotal)}</span> },
  { key: 'sin-avanzar', header: 'Sin avanzar', width: '15%', cell: row => formatElapsedSince(row.updatedAt) },
  { key: 'estatus', header: 'Estatus', width: '17%', kind: 'status', cell: row => <OperationStatusBadge status={row.estatus} /> },
  { key: 'accion', header: 'Acción', width: '14%', kind: 'actions', cell: action },
];

export function StalledOperationsTable({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error, refetch } = useStalledOperations();
  const rows = data?.content ?? [];
  if (compact) return <section id="stalled-operations" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
      <h2 className="font-semibold">Operaciones detenidas</h2>
      <Link to="/operaciones?view=stalled" className="whitespace-nowrap text-xs font-semibold text-[#3b6ef5]">Ver las {data?.totalElements ?? '—'} →</Link>
    </div>
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} isEmpty={rows.length === 0}
      loadingLabel="Buscando operaciones detenidas…" emptyTitle="Sin operaciones detenidas"
      emptyDescription="Todas las operaciones activas se han actualizado recientemente."
      errorTitle="No se pudieron cargar las operaciones detenidas.">
      <div>{rows.slice(0, 5).map(row => <Link key={row.id} to={buildOperationDetailPath(row.id)}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-slate-100 px-5 py-3 text-xs last:border-b-0 hover:bg-slate-50">
        <span className="text-slate-500">#{row.id}</span>
        <strong className="truncate" title={row.clienteNombre}>{row.clienteNombre}</strong>
        <span className="hidden sm:block"><OperationStatusBadge status={row.estatus} /></span>
        <span className="whitespace-nowrap font-semibold text-red-600">{formatElapsedSince(row.updatedAt)}</span>
      </Link>)}</div>
    </QueryState>
  </section>;
  return <section id="stalled-operations" className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-100 p-4"><AlertOctagon className="h-4 w-4 text-rose-600" /><h2 className="font-semibold">Operaciones detenidas</h2></div>
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()} isEmpty={rows.length === 0}
      loadingLabel="Buscando operaciones detenidas…" emptyTitle="Sin operaciones detenidas"
      emptyDescription="Todas las operaciones activas se han actualizado recientemente."
      errorTitle="No se pudieron cargar las operaciones detenidas.">
      <DataTable columns={columns} rows={rows} getRowKey={row => row.id} emptyTitle="Sin operaciones detenidas"
        mobile={{ title: row => '#' + row.id + ' · ' + row.clienteNombre,
          status: row => <OperationStatusBadge status={row.estatus} />,
          fields: [
            { key: 'monto', label: 'Monto', value: row => formatMoney(row.montoTotal) },
            { key: 'sin-avanzar', label: 'Sin avanzar', value: row => formatElapsedSince(row.updatedAt) },
          ], actions: action }} />
    </QueryState>
  </section>;
}
