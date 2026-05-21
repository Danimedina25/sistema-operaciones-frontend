// components/ReturnPaymentsTable.tsx

import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import {
  OperationStatus,
  ReturnPaymentResponse,
} from '../../types/operations.types.ts';

interface ReturnPaymentsTableProps {
  returns: ReturnPaymentResponse[];
  montoPendientePorRetornar?: number | null;
  montoPendientePorSolicitar?: number | null;
  onAddRequestReturnPayment?: (montoPendientePorSolicitar: number) => void;
  canManageReturnPayments?: boolean;
  onPayReturn?: (returnPayment: ReturnPaymentResponse) => void;
  operationStatus?: OperationStatus;
}

export function ReturnPaymentsTable({
  returns,
  montoPendientePorRetornar = null,
  montoPendientePorSolicitar = null,
  onAddRequestReturnPayment,
  canManageReturnPayments = false,
  onPayReturn,
  operationStatus,
}: ReturnPaymentsTableProps) {
  const hasPendingAmountToRequest = (montoPendientePorSolicitar ?? 0) > 0;
  const hasPendingAmountToPay = (montoPendientePorRetornar ?? 0) > 0;

  const operationIsValidated = operationStatus === 'VALIDADA';
  const operationIsCompleted = operationStatus === 'COMPLETADA';

  const hasRequestedReturns = returns.some(
    (returnPayment) =>
      returnPayment.estatus === 'SOLICITADO' ||
      returnPayment.estatus === 'REALIZADO',
  );

  const hasPendingRequestedReturns = returns.some(
    (returnPayment) => returnPayment.estatus === 'SOLICITADO',
  );

  const canRequestReturns =
    operationIsValidated &&
    hasPendingAmountToRequest &&
    !!onAddRequestReturnPayment;

  const canPayReturns =
    hasPendingAmountToPay &&
    canManageReturnPayments &&
    hasPendingRequestedReturns &&
    !!onPayReturn;

  const requestStatusMessage =
    !hasPendingAmountToRequest || hasRequestedReturns || operationIsCompleted
      ? 'Se ha solicitado el retorno completo'
      : 'No se pueden solicitar retornos todavía';

  const paymentStatusMessage = !hasPendingAmountToPay
    ? 'Se han pagado todos los retornos'
    : montoPendientePorRetornar === montoPendientePorSolicitar ? 'No se pueden pagar retornos todavía' : null;

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

          <div className="grid w-full grid-cols-1 items-start gap-10 md:w-auto md:grid-cols-[1fr_1fr]">
            <div className="flex flex-col items-start md:items-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por solicitar
              </p>

              <p
                className={`mt-0.5 text-base font-semibold ${
                  hasPendingAmountToRequest ? 'text-violet-700' : 'text-slate-400'
                }`}
              >
                {formatCurrency(montoPendientePorSolicitar ?? 0)}
              </p>

              <div className="mt-1 flex h-[28px] items-center">
                {canRequestReturns ? (
                  <button
                    type="button"
                    onClick={() =>
                      onAddRequestReturnPayment?.(
                        montoPendientePorSolicitar ?? 0,
                      )
                    }
                    className="inline-flex min-w-[95px] items-center justify-center rounded-lg border-violet-200 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-200"
                  >
                    Solicitar retorno
                  </button>
                ) : (
                  <p className="text-xs font-medium text-slate-400">
                    {requestStatusMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por retornar
              </p>

              <p
                className={`mt-0.5 text-base font-semibold ${
                  hasPendingAmountToPay ? 'text-amber-700' : 'text-slate-400'
                }`}
              >
                {formatCurrency(montoPendientePorRetornar ?? 0)}
              </p>

              <div className="mt-1 flex h-[28px] items-center">
                <p className="text-xs font-medium text-slate-400">
                  {paymentStatusMessage}
                </p>
              </div>
            </div>
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
                <th className="px-4 py-3 font-medium">Estatus</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cuenta destino</th>
                <th className="px-4 py-3 font-medium">Solicitado por</th>
                <th className="px-4 py-3 font-medium">Fecha solicitud</th>
                <th className="px-4 py-3 font-medium">Pagado por</th>
                <th className="px-4 py-3 font-medium">Fecha retorno</th>
                <th className="px-4 py-3 font-medium">Observaciones</th>
                <th className="px-4 py-3 font-medium">Comprobante</th>

                {canPayReturns && (
                  <th className="px-4 py-3 font-medium">Acciones</th>
                )}
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

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        returnPayment.estatus === 'REALIZADO'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {returnPayment.estatus === 'REALIZADO'
                        ? 'Realizado'
                        : 'Solicitado'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {paymentTypeLabels[returnPayment.tipoPago]}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.cuentaDestinoCliente ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.solicitadoPorNombre ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.fechaSolicitud
                      ? formatDateTime(returnPayment.fechaSolicitud)
                      : '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.pagadoPorNombre ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.fechaPago
                      ? formatDateTime(returnPayment.fechaPago)
                      : '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.observaciones ?? '-'}
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

                  {canPayReturns && (
                    <td className="px-4 py-4">
                      {returnPayment.estatus === 'SOLICITADO' ? (
                        <button
                          type="button"
                          onClick={() => onPayReturn?.(returnPayment)}
                          className="inline-flex min-w-[95px] items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          Pagar retorno
                        </button>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}