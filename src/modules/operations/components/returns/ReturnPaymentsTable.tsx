// components/ReturnPaymentsTable.tsx

import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import { ReturnPaymentResponse } from '../../types/operations.types.ts';

interface ReturnPaymentsTableProps {
  returns: ReturnPaymentResponse[];
  montoPendientePorRetornar?: number | null;
  onAddReturnPayment: (montoPendienteARetornar: number) => void;
  canAddReturn?: boolean;
}

export function ReturnPaymentsTable({
  returns,
  montoPendientePorRetornar = null,
  onAddReturnPayment,
  canAddReturn = false
}: ReturnPaymentsTableProps) {
    
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Retorno
            </p>

            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              Historial de pagos de retorno al cliente
            </h3>
          </div>

          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className="text-left md:text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por retornar
              </p>

              <p className="mt-0.5 text-base font-semibold text-amber-700">
                {formatCurrency(montoPendientePorRetornar?? 0)}
              </p>

              {montoPendientePorRetornar === 0 && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  Se ha retornado el monto completo al cliente 
                </p>
              )}
            </div>

            {canAddReturn ? (
              <button
                type="button"
                onClick={() => {onAddReturnPayment(montoPendientePorRetornar ?? 0)}}
                className="inline-flex min-w-[180px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Registrar pago de retorno
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 h-px w-full bg-slate-200" />
      </div>

      {returns.length === 0 ? (
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Esta operación aún no tiene pagos de retorno registrados.
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr className="text-left text-sm text-slate-600">
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cuenta origen</th>
                <th className="px-4 py-3 font-medium">Cuenta destino</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Registrado por</th>
                <th className="px-4 py-3 font-medium">Fecha retorno</th>
                <th className="px-4 py-3 font-medium">Comprobante</th>
              </tr>
            </thead>

            <tbody>
              {returns.map((returnPayment) => (
                <tr
                  key={returnPayment.id}
                  className="border-t border-slate-200 text-sm"
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {formatCurrency(returnPayment.monto)}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {paymentTypeLabels[returnPayment.tipoPago]}
                  </td>

                    <td className="px-4 py-4">
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                            {returnPayment.cuentaOrigenId}
                            </span>

                            <span className="text-xs text-slate-500">
                            {returnPayment.cuentaOrigenNombre}
                            </span>
                        </div>
                    </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.cuentaDestinoCliente ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.observaciones ?? ''}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.registradoPorNombre ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(returnPayment.fechaRetorno)}
                  </td>

                  <td className="px-4 py-4">
                    {returnPayment.comprobanteUrl ? (
                      <a
                        href={returnPayment.comprobanteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                      >
                        Ver comprobante
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Sin comprobante
                      </span>
                    )}
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