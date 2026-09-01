import { Check } from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
} from '@/modules/operations/utils/operation-formatters';
import {
  isCashReturnMethod,
  resolveInstallmentReceiverDisplay,
} from '@/modules/operations/utils/return-installment';
import type { ReturnInstallment } from '../../types/operations.types.ts';
import { InstallmentStatusBadge } from './InstallmentStatusBadge';

/** Una de las dos marcas independientes del cierre (socio / jefa de cajas). */
function ConfirmationMark({
  label,
  done,
  fecha,
}: {
  label: string;
  done: boolean;
  fecha?: string | null;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${done ? 'text-emerald-700' : 'text-slate-400'}`}
      title={done && fecha ? formatDateTime(fecha) : undefined}
    >
      {done ? (
        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <span className="h-3 w-3 shrink-0 rounded-full border border-current" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

interface InstallmentHistoryTableProps {
  installments: ReturnInstallment[];
  isLoading?: boolean;
  emptyMessage?: string;
  canConfirm?: (installment: ReturnInstallment) => boolean;
  canDeliver?: (installment: ReturnInstallment) => boolean;
  canCancel?: (installment: ReturnInstallment) => boolean;
  onConfirm?: (installment: ReturnInstallment) => void;
  onDeliver?: (installment: ReturnInstallment) => void;
  onCancel?: (installment: ReturnInstallment) => void;
}

export function InstallmentHistoryTable({
  installments,
  isLoading = false,
  emptyMessage = 'Esta solicitud aún no tiene parcialidades registradas.',
  canConfirm = () => false,
  canDeliver = () => false,
  canCancel = () => false,
  onConfirm,
  onDeliver,
  onCancel,
}: InstallmentHistoryTableProps) {
  const showActionsColumn = !!onConfirm || !!onDeliver || !!onCancel;

  if (isLoading) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">Cargando parcialidades...</p>
    );
  }

  if (installments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Monto</th>
            <th className="px-3 py-2">Estatus</th>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">Responsable</th>
            <th className="px-3 py-2">Persona que recibió</th>
            <th className="px-3 py-2">Confirmaciones</th>
            <th className="px-3 py-2">Comprobante</th>
            <th className="px-3 py-2">Origen / Código</th>
            <th className="px-3 py-2">Observaciones</th>
            {showActionsColumn && <th className="px-3 py-2">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {installments.map((i, index) => {
            const fecha =
              i.fechaRealizacion ??
              i.fechaConfirmacion ??
              i.fechaHoraRecoleccion ??
              i.createdAt ??
              null;
            const responsable =
              i.realizadoPorNombre ??
              i.entregadoPorNombre ??
              i.creadoPorNombre ??
              '-';
            const receptor = resolveInstallmentReceiverDisplay(i);
            return (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                <td className="px-3 py-2 font-semibold tabular-nums text-slate-900">
                  {formatCurrency(i.monto)}
                </td>
                <td className="px-3 py-2">
                  <InstallmentStatusBadge status={i.estatus} />
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {fecha ? formatDateTime(fecha) : '-'}
                </td>
                <td className="px-3 py-2 text-slate-600">{responsable}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {receptor ? (
                    <span className="flex flex-col gap-0.5">
                      <span
                        className={
                          i.personaQueRecibioEfectivo
                            ? 'font-medium text-slate-800'
                            : 'italic text-slate-400'
                        }
                      >
                        {receptor}
                      </span>
                      {i.recibioPersonaAutorizada === false ? (
                        <span className="w-fit rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          No autorizada
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs">
                  {isCashReturnMethod(i.tipoPago) ? (
                    <div className="flex flex-col gap-0.5">
                      <ConfirmationMark
                        label="Socio"
                        done={!!i.confirmadoPorSocio}
                        fecha={i.fechaConfirmacion}
                      />
                      <ConfirmationMark
                        label="Jefa de cajas"
                        done={!!i.cerradoPorJefa}
                        fecha={i.fechaEntrega}
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {i.comprobanteUrl ||
                  i.evidenciaImportePreparadoUrl ||
                  i.comprobanteEntregaUrl ? (
                    <div className="flex flex-col gap-0.5">
                      {i.comprobanteUrl ? (
                        <a
                          href={i.comprobanteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Comprobante
                        </a>
                      ) : null}
                      {i.evidenciaImportePreparadoUrl ? (
                        <a
                          href={i.evidenciaImportePreparadoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Evidencia importe
                        </a>
                      ) : null}
                      {i.comprobanteEntregaUrl ? (
                        <a
                          href={i.comprobanteEntregaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          Entrega
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {i.cuentaOrigenNombre ?? i.codigoRetiroSinTarjeta ?? '-'}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {i.observaciones ?? '-'}
                </td>
                {showActionsColumn && (
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {canConfirm(i) && onConfirm && (
                        <button
                          type="button"
                          onClick={() => onConfirm(i)}
                          className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Confirmar recepción
                        </button>
                      )}
                      {canDeliver(i) && onDeliver && (
                        <button
                          type="button"
                          onClick={() => onDeliver(i)}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Marcar entregada
                        </button>
                      )}
                      {canCancel(i) && onCancel && (
                        <button
                          type="button"
                          onClick={() => onCancel(i)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
