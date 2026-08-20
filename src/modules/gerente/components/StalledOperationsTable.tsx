import { Link } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { QueryState } from '@/shared/components/ui/QueryState';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { formatCurrency } from '@/modules/operations/utils/operation-formatters';
import { buildOperationDetailPath } from '@/routes/paths';
import { useStalledOperations } from '@/modules/gerente/hooks/use-stalled-operations';

function formatElapsedSince(dateStr: string, now: Date): string {
  const hours = Math.floor((now.getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60));

  if (hours < 24) return `${hours} h sin actualizarse`;

  const days = Math.floor(hours / 24);
  return `${days} día${days === 1 ? '' : 's'} sin actualizarse`;
}

export function StalledOperationsTable() {
  const { data, isLoading, error, refetch } = useStalledOperations();
  const operations = data?.content ?? [];
  const now = new Date();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <AlertOctagon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Operaciones detenidas</h2>
          <p className="text-xs text-slate-500">
            Activas, sin finalizar, sin cambios desde hace más de 48 horas — calculado desde la
            última actualización registrada (<code>updatedAt</code>).
            {typeof data?.totalElements === 'number' && data.totalElements > operations.length
              ? ` Mostrando ${operations.length} de ${data.totalElements} en total.`
              : null}
          </p>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={operations.length === 0}
        onRetry={() => void refetch()}
        loadingLabel="Buscando operaciones detenidas..."
        emptyTitle="Sin operaciones detenidas"
        emptyDescription="Todas las operaciones activas se han actualizado recientemente."
        errorTitle="No se pudieron cargar las operaciones detenidas."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="min-w-[160px] px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="min-w-[160px] px-4 py-3 font-medium">Sin actualizar</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900">#{operation.id}</td>
                  <td className="px-4 py-3 text-slate-600">{operation.clienteNombre}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                    {formatCurrency(operation.montoTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <OperationStatusBadge status={operation.estatus} />
                  </td>
                  <td className="px-4 py-3 font-medium text-rose-700">
                    {formatElapsedSince(operation.updatedAt, now)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={buildOperationDetailPath(operation.id)}
                      className="inline-flex min-h-[40px] items-center text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>
    </div>
  );
}
