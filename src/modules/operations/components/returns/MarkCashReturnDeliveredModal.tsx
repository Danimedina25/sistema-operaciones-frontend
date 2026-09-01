import { useEffect, useId, useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import {
  cleanAuthorizedRecipients,
  resolveDeliveryReceiverLabel,
  type CashDeliveryTarget,
} from '@/modules/operations/utils/return-installment';

interface MarkCashReturnDeliveredModalProps {
  target: CashDeliveryTarget | null;
  isSubmitting: boolean;
  onConfirm: (
    id: number,
    operationId: number,
    comprobante: File,
    personaQueRecibioEfectivo: string,
  ) => void;
  onClose: () => void;
}

const SELECT_PLACEHOLDER = 'Selecciona una persona autorizada';
const NO_AUTHORIZED_MESSAGE =
  'Esta solicitud no tiene personas autorizadas para recibir. Actualiza la solicitud antes de cerrar la entrega.';

/**
 * Confirmación reforzada del cierre final de una entrega en efectivo/retiro
 * sin tarjeta: el socio comercial ya confirmó que la recogió, esta acción la
 * cierra como completada. En la misma transacción se registran la persona
 * autorizada que recibió realmente los fondos y la foto de entrega — no se
 * puede guardar una sin la otra. Previene doble envío.
 */
export function MarkCashReturnDeliveredModal({
  target,
  isSubmitting,
  onConfirm,
  onClose,
}: MarkCashReturnDeliveredModalProps) {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [personaQueRecibio, setPersonaQueRecibio] = useState('');

  const selectId = useId();
  const selectErrorId = useId();

  // Lista permitida, ya limpia y sin duplicados (defensa extra sobre el target).
  const autorizados = useMemo(
    () => (target ? cleanAuthorizedRecipients(target.autorizados) : []),
    [target],
  );
  const hasAutorizados = autorizados.length > 0;
  const receiverLabel = target
    ? resolveDeliveryReceiverLabel(target.tipoPago)
    : SELECT_PLACEHOLDER;

  // Reinicia selección y foto al cambiar o cerrar la parcialidad.
  useEffect(() => {
    setComprobante(null);
    setPersonaQueRecibio('');
  }, [target?.id]);

  useEffect(() => {
    if (!comprobante) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(comprobante);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [comprobante]);

  const receptorValido = personaQueRecibio !== '' && autorizados.includes(personaQueRecibio);
  const fotoValida = !!comprobante && comprobante.type.startsWith('image/');
  const canConfirm = hasAutorizados && receptorValido && fotoValida && !isSubmitting;

  const handleConfirm = () => {
    if (!target || !comprobante || !canConfirm) return;
    onConfirm(target.id, target.operationId, comprobante, personaQueRecibio);
  };

  return (
    <Modal
      open={!!target}
      title="Marcar efectivo como entregado"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      {target ? (
        <>
          <p className="text-sm text-slate-600">
            El socio comercial ya confirmó que recogió esta parcialidad en efectivo. Esta acción
            la cierra como completada.
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Monto:</span> {formatCurrency(target.monto)}
            </p>
            <p>
              <span className="font-medium">Operación:</span> #{target.operationId}
              {target.clienteNombre ? ` · ${target.clienteNombre}` : ''}
            </p>
            <p>
              <span className="font-medium">Personas autorizadas:</span>{' '}
              {hasAutorizados ? autorizados.join(', ') : 'No especificado'}
            </p>
            <p>
              <span className="font-medium">Fecha programada:</span>{' '}
              {target.scheduledAt ? formatDateTime(target.scheduledAt) : '-'}
            </p>
          </div>

          {!hasAutorizados ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {NO_AUTHORIZED_MESSAGE}
            </div>
          ) : (
            <div className="mt-4">
              <label
                htmlFor={selectId}
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                {receiverLabel} <span className="text-red-600">*</span>
              </label>
              <select
                id={selectId}
                value={personaQueRecibio}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={personaQueRecibio === ''}
                aria-describedby={personaQueRecibio === '' ? selectErrorId : undefined}
                onChange={(event) => setPersonaQueRecibio(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{SELECT_PLACEHOLDER}</option>
                {autorizados.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
              {personaQueRecibio === '' ? (
                <p id={selectErrorId} className="mt-1 text-xs text-red-600">
                  Selecciona la persona autorizada que recibió los fondos.
                </p>
              ) : null}
            </div>
          )}

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Foto de entrega del efectivo <span className="text-red-600">*</span>
            </label>

            {previewUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={previewUrl}
                  alt="Vista previa del comprobante de entrega"
                  className="max-h-72 w-full object-contain"
                />
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-3">
                  <p className="min-w-0 truncate text-xs text-slate-600">{comprobante?.name}</p>
                  <label className="shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Cambiar foto
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={isSubmitting}
                      onChange={(event) => setComprobante(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Camera className="h-6 w-6" />
                </span>
                <span className="mt-3 text-sm font-semibold text-slate-800">
                  Tomar o seleccionar foto
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  Adjunta una imagen donde se observe la entrega del efectivo.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={isSubmitting}
                  onChange={(event) => setComprobante(event.target.files?.[0] ?? null)}
                />
              </label>
            )}
            {comprobante && !fotoValida ? (
              <p role="alert" className="mt-1 text-xs text-red-600">
                El archivo debe ser una imagen.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Subiendo evidencia...' : 'Sí, marcar como entregado'}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
