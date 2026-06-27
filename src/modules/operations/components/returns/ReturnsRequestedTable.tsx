import { Eye, HandCoins } from 'lucide-react';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../../types/operations.types.ts.js';
import { useEffect } from 'react';

interface ReturnsTableProps {
  operations: PaymentOperationResponse[];
  isLoading: boolean;
  goToReturns: (operationId: number, scrollToReturns?: boolean) => void;
}

export function ReturnsRequestedTable({
  operations,
  isLoading,
  goToReturns
}: ReturnsTableProps) {

  if (!isLoading && operations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        <HandCoins className="mx-auto mb-3 h-8 w-8 text-slate-400" />

        <p className="text-sm font-medium text-slate-700">
          No hay operaciones listas para registrar retorno
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Cuando una operación tenga solicitudes de retorno que no hayan sido pagadas, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-600">
              <th className="px-4 py-3 font-medium text-center">
                Folio
              </th>
              <th className="px-4 py-3 font-medium text-center">
                Cliente primario
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Socio comercial
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Fecha de creación
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Monto total
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Monto a retornar
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Monto solicitado
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Monto retornado
              </th>

              <th className="px-4 py-3 font-medium text-center">
                Estatus retorno
              </th>

              <th className="px-4 py-3 font-medium text-center">
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
                  Cargando operaciones con retornos solicitados...
                </td>
              </tr>
            ) : (
              operations.map((operation) => (
                <tr
                  key={operation.id}
                  onClick={() => goToReturns(operation.id, true)}
                  className="cursor-pointer border-t border-slate-200 text-sm transition hover:bg-slate-50"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <div className="mt-1 text-xs font-normal text-slate-400">
                      {operation.id}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">
                    <div>{operation.clienteNombre}</div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {operation.socioComercialNombre}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(operation.createdAt)}
                  </td>

                  <td className="px-4 py-4 font-semibold text-slate-600">
                    {formatCurrency(operation.montoTotal)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <div className="font-semibold text-emerald-700">
                      {formatCurrency(operation.montoTotalDevolverCliente)}
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      neto al cliente
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <div>{formatCurrency(operation.montoSolicitadoRetorno)}</div>

                    <div className="mt-1 text-xs text-slate-400">
                      solicitado
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    <div>{formatCurrency(operation.montoRetornado)}</div>

                    <div className="mt-1 text-xs text-slate-400">
                      retornado
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <OperationStatusBadge status={operation.estatus} isReturn />
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        goToReturns(operation.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Ver solicitudes
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}