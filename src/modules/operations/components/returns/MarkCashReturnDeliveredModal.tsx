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

/** Valor del <select> para capturar una persona ajena a la lista de autorizados. */
const OTRA_PERSONA = '__OTRA_PERSONA__';
const SELECT_PLACEHOLDER = 'Selecciona una persona';

/**
 * Cierre de una entrega en efectivo / retiro sin tarjeta: registra quién recibió
 * realmente los fondos + la foto de entrega en la misma transacción (no se puede
 * una sin la otra). La persona puede ser un autorizado de la solicitud o —como
 * excepción— alguien ajeno a la lista, que se captura por nombre y queda marcado.
 * Previene doble envío.
 */
export function MarkCashReturnDeliveredModal({
  target,
  isSubmitting,
  onConfirm,
  onClose,
}: MarkCashReturnDeliveredModalProps) {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectValue, setSelectValue] = useState('');
  const [otraNombre, setOtraNombre] = useState('');

  const selectId = useId();
  const selectErrorId = useId();
  const otraId = useId();
  const otraErrorId = useId();

  // Lista permitida, ya limpia y sin duplicados (defensa extra sobre el target).
  const autorizados = useMemo(
    () => (target ? cleanAuthorizedRecipients(target.autorizados) : []),
    [target],
  );
  const hasAutorizados = autorizados.length > 0;
  const receiverLabel = target
    ? resolveDeliveryReceiverLabel(target.tipoPago)
    : SELECT_PLACEHOLDER;

  // Sin autorizados registrados: la única vía es capturar el nombre.
  const modoOtra = selectValue === OTRA_PERSONA || !hasAutorizados;

  // Reinicia selección y foto al cambiar o cerrar la parcialidad.
  useEffect(() => {
    setComprobante(null);
    setSelectValue('');
    setOtraNombre('');
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

  const personaQueRecibio = modoOtra
    ? otraNombre.trim().replace(/\s+/g, ' ')
    : selectValue;
  const receptorValido = modoOtra
    ? personaQueRecibio.length > 0
    : selectValue !== '' && autorizados.includes(selectValue);
  const fotoValida = !!comprobante && comprobante.type.startsWith('image/');
  const canConfirm = receptorValido && fotoValida && !isSubmitting;

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
            {target.confirmadoPorSocio
              ? 'El socio comercial ya confirmó que recogió esta parcialidad. Al registrar la entrega quedará completada.'
              : 'Registra la entrega del efectivo. La parcialidad quedará en confirmación parcial hasta que el socio comercial confirme la recepción.'}
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
              {hasAutorizados ? autorizados.join(', ') : 'Ninguna registrada'}
            </p>
            <p>
              <span className="font-medium">Fecha programada:</span>{' '}
              {target.scheduledAt ? formatDateTime(target.scheduledAt) : '-'}
            </p>
          </div>

          <div className="mt-4">
            <label
              htmlFor={hasAutorizados ? selectId : otraId}
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              {receiverLabel} <span className="text-red-600">*</span>
            </label>

            {hasAutorizados ? (
              <select
                id={selectId}
                value={selectValue}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={selectValue === ''}
                aria-describedby={selectValue === '' ? selectErrorId : undefined}
                onChange={(event) => setSelectValue(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">{SELECT_PLACEHOLDER}</option>
                {autorizados.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
                <option value={OTRA_PERSONA}>Otra persona (no autorizada)</option>
              </select>
            ) : (
              <p className="mb-2 text-xs text-amber-700">
                Esta solicitud no tiene personas autorizadas registradas. Escribe el
                nombre de quien recibió el efectivo.
              </p>
            )}

            {hasAutorizados && selectValue === '' ? (
              <p id={selectErrorId} className="mt-1 text-xs text-red-600">
                Selecciona quién recibió los fondos.
              </p>
            ) : null}

            {modoOtra ? (
              <div className="mt-3">
                {hasAutorizados ? (
                  <label
                    htmlFor={otraId}
                    className="mb-1 block text-xs font-medium text-slate-600"
                  >
                    Nombre de la persona que recibió
                  </label>
                ) : null}
                <input
                  id={otraId}
                  type="text"
                  value={otraNombre}
                  disabled={isSubmitting}
                  autoComplete="off"
                  aria-required="true"
                  aria-invalid={personaQueRecibio.length === 0}
                  aria-describedby={
                    personaQueRecibio.length === 0 ? otraErrorId : undefined
                  }
                  onChange={(event) => setOtraNombre(event.target.value)}
                  placeholder="Nombre completo"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {personaQueRecibio.length === 0 ? (
                  <p id={otraErrorId} className="mt-1 text-xs text-red-600">
                    Escribe el nombre de la persona que recibió los fondos.
                  </p>
                ) : hasAutorizados ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Esta persona no está en la lista de autorizados; se registrará como
                    excepción.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

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
