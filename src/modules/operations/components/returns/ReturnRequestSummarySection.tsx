import { ClipboardList, Download, FileSpreadsheet, UserRound } from 'lucide-react';
import { paymentTypeLabels } from '@/modules/operations/constants/operations.constants';
import {
  formatCurrency,
  formatDate,
} from '@/modules/operations/utils/operation-formatters';
import { getDestinationAccountLabel } from '../../utils/return-destination-account';
import {
  isCashReturnMethod,
  resolveReturnRequestTotals,
} from '../../utils/return-installment';
import type { ReturnPaymentResponse } from '../../types/operations.types.ts';
import { ReturnStatusBadge } from './ReturnStatusBadge';

interface ReturnRequestSummarySectionProps {
  returnRequest: ReturnPaymentResponse;
}

/**
 * Cabecera del retorno: datos de la solicitud (lo que pidió el socio) + el
 * avance calculado por el servidor (retornado / pendiente / % avance).
 */
export function ReturnRequestSummarySection({
  returnRequest,
}: ReturnRequestSummarySectionProps) {
  const totals = resolveReturnRequestTotals(returnRequest);
  const esEfectivo = isCashReturnMethod(returnRequest.tipoPago);
  const pct = Math.min(Math.max(totals.porcentajeAvance, 0), 100);

  const autorizados = [
    returnRequest.autorizadoParaRecibirEfectivo1,
    returnRequest.autorizadoParaRecibirEfectivo2,
    returnRequest.autorizadoParaRecibirEfectivo3,
  ].filter((nombre): nombre is string => Boolean(nombre?.trim()));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Solicitud #{returnRequest.id} · {paymentTypeLabels[returnRequest.tipoPago]}
            </h3>
          </div>
          <ReturnStatusBadge status={returnRequest.estatus} />
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-3">
          <div>
            <span className="block text-slate-500">Monto solicitado</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totals.montoSolicitado)}
            </span>
          </div>

          {esEfectivo ? (
            <>
              <div>
                <span className="block text-slate-500">Solicitado por</span>
                <span className="font-semibold text-slate-900">
                  {returnRequest.solicitadoPorNombre ?? 'Socio comercial'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Fecha de solicitud</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(returnRequest.fechaSolicitud)}
                </span>
              </div>
              {returnRequest.clienteNombre ? (
                <div>
                  <span className="block text-slate-500">Cliente</span>
                  <span className="font-semibold text-slate-900">
                    {returnRequest.clienteNombre}
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div>
                <span className="block text-slate-500">Banco</span>
                <span className="font-semibold text-slate-900">
                  {returnRequest.cuentaDestinoBanco ?? '-'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">
                  {getDestinationAccountLabel(returnRequest.cuentaDestinoCliente)}
                </span>
                <span className="font-semibold text-slate-900">
                  {returnRequest.cuentaDestinoCliente ?? '-'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Titular</span>
                <span className="font-semibold text-slate-900">
                  {returnRequest.cuentaDestinoTitular ?? '-'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">CLABE interbancaria</span>
                <span className="font-semibold text-slate-900">
                  {returnRequest.cuentaClabeCliente ?? '-'}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <span className="block text-slate-500">Ya retornado</span>
            <span className="font-semibold text-emerald-700">
              {formatCurrency(totals.montoRetornado)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Pendiente por retornar</span>
            <span className="font-semibold text-amber-700">
              {formatCurrency(totals.montoPendiente)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Disponible por registrar</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totals.montoDisponible)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {pct.toFixed(1)}% retornado · {totals.numeroParcialidades} parcialidad(es)
          </p>
        </div>
      </section>

      {esEfectivo ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-950">
              Personas autorizadas para recibir
            </h3>
          </div>

          {autorizados.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {autorizados.map((nombre, index) => (
                <div
                  key={`${nombre}-${index}`}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-blue-200 bg-white px-3 py-2.5"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                    {index + 1}
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold text-slate-900">
                    {nombre}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-blue-800">
              La solicitud no tiene personas autorizadas registradas.
            </p>
          )}

          <p className="mt-3 text-xs text-blue-800">
            La persona que reciba deberá presentar una identificación oficial vigente.
          </p>
        </section>
      ) : null}

      {returnRequest.archivoNominaUrl ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Esta solicitud tiene un archivo de nóminas
              </p>
              <p className="text-xs text-emerald-700">
                El socio comercial adjuntó un Excel para repartir el pago entre empleados.
              </p>
            </div>
          </div>
          <a
            href={returnRequest.archivoNominaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            Descargar archivo de nóminas
          </a>
        </div>
      ) : null}
    </div>
  );
}
