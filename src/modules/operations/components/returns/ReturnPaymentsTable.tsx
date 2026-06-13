// components/ReturnPaymentsTable.tsx

import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import {
  OperationStatus,
  ReturnPaymentResponse,
} from '../../types/operations.types.ts';
import { ReturnStatusBadge } from './ReturnStatusBadge.js';

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


  const canPayReturns =
    hasPendingAmountToPay &&
    canManageReturnPayments &&
    hasPendingRequestedReturns &&
    !!onPayReturn;

  const canOperationRequestReturns =
    operationStatus === 'VALIDADA' ||
    operationStatus === 'RETORNO_SOLICITADO';

  const canRequestReturns =
    canOperationRequestReturns &&
    hasPendingAmountToRequest &&
    !!onAddRequestReturnPayment;

  let requestStatusMessage: string | null = null;

  if (!canOperationRequestReturns) {
    requestStatusMessage = 'No se pueden solicitar retornos todavía';
  } else if (!hasPendingAmountToRequest) {
    requestStatusMessage = 'Se ha solicitado el retorno completo';
  }

  const paymentStatusMessage =
    !hasPendingAmountToPay
      ? 'Retornos liquidados'
      : !hasRequestedReturns
        ? 'Esperando solicitud de retorno'
        : 'Pendiente de pago';

  console.log({
    montoPendientePorSolicitar,
    hasPendingAmountToRequest,
    canRequestReturns,
    onAddRequestReturnPayment: !!onAddRequestReturnPayment,
    operationStatus,
  });

  return (
    <div
      className="
    overflow-hidden
    rounded-[2rem]
    border
    border-slate-200/80
    bg-white
    shadow-lg
    shadow-slate-950/5
  "
    >
      <div className="px-6 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">
              RETORNOS
            </p>

            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Retornos de dinero al cliente
            </h3>
          </div>

          <div className="grid w-full grid-cols-1 items-start gap-10 md:w-auto md:grid-cols-[1fr_1fr]">
            <div
              className="
    rounded-2xl
    border
    border-blue-200
    bg-blue-50/70
    px-5
    py-4
  "
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por solicitar
              </p>

              <p
                className={`mt-0.5 text-base font-semibold ${hasPendingAmountToRequest ? 'text-blue-700' : 'text-slate-400'
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
                    className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-900
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-slate-800
                    hover:-translate-y-0.5
                    "
                  >
                    Solicitar retorno
                  </button>
                ) : requestStatusMessage ? (
                  <p className="text-xs font-medium text-slate-400">
                    {requestStatusMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="
    rounded-2xl
    border
    border-amber-200
    bg-amber-50/70
    px-5
    py-4
  "
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Pendiente por retornar
              </p>

              <p
                className={`mt-0.5 text-base font-semibold ${hasPendingAmountToPay ? 'text-amber-700' : 'text-slate-400'
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
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className="
                  border-t
                  border-slate-100
                  text-sm
                  transition
                  hover:bg-slate-50/70
                  "
                >
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {formatCurrency(returnPayment.monto)}
                  </td>

                  <td className="px-4 py-4">
                    <ReturnStatusBadge
                      status={returnPayment.estatus}
                    />
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {paymentTypeLabels[returnPayment.tipoPago]}
                  </td>


                  <td className="px-4 py-4">
                    <div className="max-w-[240px]">
                      <p className="text-sm font-semibold tracking-tight text-slate-900">
                        {returnPayment.cuentaDestinoCliente ?? '-'}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>{returnPayment.cuentaDestinoBanco ?? 'Sin banco'}</span>

                        <span className="h-1 w-1 rounded-full bg-slate-300" />

                        <span className="truncate">
                          {returnPayment.cuentaDestinoTitular ?? '-'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.solicitadoPorNombre ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.fechaSolicitud
                      ? formatDate(returnPayment.fechaSolicitud)
                      : '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.pagadoPorNombre ?? '-'}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {returnPayment.fechaPago
                      ? formatDate(returnPayment.fechaPago)
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
                        className="
                        inline-flex
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-3
                        py-2
                        text-sm
                        font-semibold
                        text-slate-700
                        transition
                        hover:bg-slate-100
                        "
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
                          className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-xl
                          bg-emerald-600
                          px-4
                          py-2
                          text-xs
                          font-semibold
                          text-white
                          shadow-sm
                          transition
                          hover:bg-emerald-700
                          hover:-translate-y-0.5
                          "
                        >
                          Registrar retorno
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