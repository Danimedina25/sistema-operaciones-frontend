import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOperations } from '@/modules/operations/api/operations.api';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import { formatCurrency, formatDate } from '@/modules/operations/utils/operation-formatters';
import { buildOperationDetailPath } from '@/routes/paths';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import type { PaymentOperationResponse, OperationsFilters } from '@/modules/operations/types/operations.types.ts';
import type { PeriodRange } from '@/modules/gerente/utils/period-range';

const BASE_FILTERS: OperationsFilters = {
  operationId: 0,
  search: '',
  status: 'ALL',
  dateFilter: '',
  startDate: '',
  endDate: '',
  activo: 'ACTIVE',
  paymentTypes: '',
  paymentStatus: '',
  returnStatuses: '',
  cuentaDestinoId: 0,
  banco: '',
  socioComercialId: 0,
};

const TOP_N = 10;

interface TopOperationsTableProps {
  period: PeriodRange;
}

export function TopOperationsTable({ period }: TopOperationsTableProps) {
  const [operations, setOperations] = useState<PaymentOperationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    getOperations(
      0,
      TOP_N,
      { ...BASE_FILTERS, startDate: period.startDate, endDate: period.endDate },
      'montoTotal,desc',
    )
      .then((result) => {
        if (!cancelled) setOperations(result.content);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [period.startDate, period.endDate]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Operaciones de mayor monto</h2>
        <p className="text-xs text-slate-500">Top {TOP_N} del periodo seleccionado.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          No se pudieron cargar las operaciones.
        </div>
      ) : operations.length === 0 ? (
        <EmptyState title="Sin operaciones en este periodo" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-slate-100">
              <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="min-w-[160px] px-4 py-3 font-medium">Cliente</th>
                <th className="min-w-[160px] px-4 py-3 font-medium">Socio</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900">#{operation.id}</td>
                  <td className="px-4 py-3 text-slate-600">{operation.clienteNombre}</td>
                  <td className="px-4 py-3 text-slate-600">{operation.socioComercialNombre}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                    {formatCurrency(operation.montoTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <OperationStatusBadge status={operation.estatus} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(operation.createdAt)}</td>
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
      )}
    </div>
  );
}
