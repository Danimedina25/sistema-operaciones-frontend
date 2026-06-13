import { formatDate } from '@/modules/operations/utils/operation-formatters';
import {
  CommissionOperationSummaryResponse,
} from '../types/commercial-partner-commissions.types';

import {
  CommissionOperationStatusBadge,
} from './CommissionOperationStatusBadge';

interface CommissionOperationsTableProps {
  operations: CommissionOperationSummaryResponse[];

  isLoading?: boolean;

  onViewDetail: (
    operationId: number,
  ) => void;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
    },
  ).format(value);
}

export function CommissionOperationsTable({
  operations,
  isLoading = false,
  onViewDetail,
}: CommissionOperationsTableProps) {
  if (!isLoading && operations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4 py-3 text-center">
                Folio
              </th>

              <th className="px-4 py-3 text-center">
                Cliente
              </th>

              <th className="px-4 py-3 text-center">
                Fecha de creación
              </th>

              <th className="px-4 py-3 text-center">
                Monto operación
              </th>

              <th className="px-4 py-3 text-center">
                Socios comerciales
              </th>

              <th className="px-4 py-3 text-center">
                Total a pagar
              </th>

              <th className="px-4 py-3 text-center">
                Estado pago
              </th>

              <th className="px-4 py-3 text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  Cargando...
                </td>
              </tr>
            ) : (
              operations.map(
                (operation) => (
                  <tr
                    key={operation.operationId}
                    className="border-t border-slate-200 text-sm"
                  >
                    <td className="px-4 py-4 font-medium">
                      #{operation.operationId}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {operation.cliente}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {formatDate(
                        operation.fechaOperacion,
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {formatCurrency(
                        operation.montoOperacion,
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {
                        operation.nivelesRedComercial
                      }
                    </td>

                    <td className="px-4 py-4 text-center">
                      {formatCurrency(
                        operation.totalComisiones,
                      )}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <CommissionOperationStatusBadge
                        partialPayment={operation.pagadaParcialmente}
                        paidCompletely={
                          operation.pagadaCompletamente
                        }
                      />
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          onViewDetail(
                            operation.operationId,
                          )
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        Ver detalle de pagos
                      </button>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}