import { HandCoins } from 'lucide-react';
import { OperationStatusBadge } from '@/modules/operations/components/OperationStatusBadge';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { PaymentOperationResponse } from '../../types/operations.types.ts.js';
import { useAuth } from '@/modules/auth/store/auth.context.js';

interface ReturnsTableProps {
  operations: PaymentOperationResponse[];
  isLoading: boolean;
  onReturnPayments: (operationId: number, scrollToReturns?: boolean) => void;
}

export function ReturnsForPaymentTable({
  operations,
  isLoading,
  onReturnPayments
}: ReturnsTableProps) {

  const { user } = useAuth();

  const roles = user?.roles ?? [];

  const isJefaCajas = roles.includes('JEFA_CAJAS');
  const isJefaCuentas = roles.includes('JEFA_CUENTAS');
  const isAuxiliarCuentas = roles.includes('AUXILIAR_CUENTAS');

  const visibleOperations = operations.filter((operation) => {
    if (isJefaCajas) {
      return (
        operation.contieneRetornosEnEfectivo ||
        operation.contieneRetornosRetiroSinTarjeta
      );
    }

    if (isJefaCuentas || isAuxiliarCuentas) {
      return operation.contieneRetornosEnTransferencia;
    }

    return true; // ADMIN, GERENTE, DIRECCION ven todo
  });

  if (!isLoading && visibleOperations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        <HandCoins className="mx-auto mb-3 h-8 w-8 text-slate-400" />

        <p className="text-sm font-medium text-slate-700">
          {operations.length > 0
            ? 'No hay operaciones de tu tipo listas para registrar retorno'
            : 'No hay operaciones listas para registrar retorno'}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {operations.length > 0
            ? 'No hay retornos pendientes del tipo que te corresponde pagar.'
            : 'Cuando una operación tenga solicitudes de retorno que no hayan sido pagadas, aparecerá aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-100">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-3 font-medium text-center">
                Folio
              </th>
              <th className="min-w-[140px] px-4 py-3 font-medium text-center">
                Cliente primario
              </th>

              <th className="min-w-[140px] px-4 py-3 font-medium text-center">
                Socio comercial
              </th>

              <th className="min-w-[120px] px-4 py-3 font-medium text-center">
                Fecha de creación
              </th>

              <th className="min-w-[110px] px-4 py-3 font-medium text-center">
                Monto total
              </th>

              <th className="min-w-[130px] px-4 py-3 font-medium text-center">
                Monto a retornar
              </th>

              <th className="min-w-[130px] px-4 py-3 font-medium text-center">
                Monto solicitado
              </th>

              <th className="min-w-[130px] px-4 py-3 font-medium text-center">
                Monto retornado
              </th>

              <th className="min-w-[150px] px-4 py-3 font-medium text-center">
                Estatus retorno
              </th>

              <th className="min-w-[180px] px-4 py-3 font-medium text-center">
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
                  Cargando operaciones listas para pagar retornos...
                </td>
              </tr>
            ) : (
              visibleOperations.map((operation) => {
                const canPayReturns =
                  (isJefaCajas && operation.contieneRetornosEnEfectivo) ||
                  (isJefaCajas && operation.contieneRetornosRetiroSinTarjeta) ||
                  ((isJefaCuentas || isAuxiliarCuentas) && operation.contieneRetornosEnTransferencia);
                return (
                  <tr
                    key={operation.id}
                    //onClick={() => onReturnPayments(operation.id, true)}
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
                      {canPayReturns ? (
                        <button
                          type="button"
                          onClick={() => {
                            onReturnPayments(operation.id);
                          }}
                          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                        >
                          {isJefaCajas ? 'Programar recolecciones' : 'Pagar retornos'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin acciones
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}