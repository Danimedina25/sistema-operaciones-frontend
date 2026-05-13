import { Eye, HandCoins } from 'lucide-react';
import { PaymentOperationResponse } from '../../types/operations.types.ts';

interface ReturnsTableProps {
  operations: PaymentOperationResponse[];
  isLoading: boolean;
  onViewDetail: (operationId: number) => void;
}

function formatCurrency(value?: number | null) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    RETORNO_PARCIAL: 'Retorno parcial',
    COMPLETADA: 'Completada',
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    RETORNO_PARCIAL: 'bg-blue-50 text-blue-700 ring-blue-200',
    COMPLETADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };

  return classes[status] ?? 'bg-slate-50 text-slate-700 ring-slate-200';
}

export function ReturnsTable({
  operations,
  isLoading,
  onViewDetail,
}: ReturnsTableProps) {
  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        Cargando operaciones listas para retorno...
      </div>
    );
  }

  if (operations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
        <HandCoins className="mx-auto mb-3 h-8 w-8 text-slate-400" />

        <p className="text-sm font-medium text-slate-700">
          No hay operaciones listas para retorno
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Cuando una operación tenga dinero pendiente por devolver al cliente,
          aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Operación
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cliente primario
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Socio comercial
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monto total
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monto validado
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monto a retornar
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estatus
              </th>

              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {operations.map((operation) => (
              <tr
                key={operation.id}
                className="transition hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-slate-900">
                    #{operation.id}
                  </div>

                  <div className="text-xs text-slate-500">
                    {formatDate(operation.createdAt)}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">
                    {operation.clienteNombre}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="text-sm text-slate-700">
                    {operation.socioComercialNombre}
                  </div>
                </td>

                <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                  {formatCurrency(operation.montoTotal)}
                </td>

                <td className="px-4 py-3 text-right text-sm font-medium text-emerald-700">
                  {formatCurrency(operation.montoValidado)}
                </td>

                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-rose-700">
                    {formatCurrency(operation.montoTotalDevolverCliente)}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClass(
                      operation.estatus
                    )}`}
                  >
                    {getStatusLabel(operation.estatus)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onViewDetail(operation.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    <Eye className="h-4 w-4" />
                    Ver retorno
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}