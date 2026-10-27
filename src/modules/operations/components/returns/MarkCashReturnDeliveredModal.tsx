import { getApiErrorMessage } from '@/shared/utils/errors';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CompactDenominationTables } from '@/modules/caja-general/components/CompactDenominationTables';
import { Button } from '@/shared/components/ui/Button';
import { emptyCounts, countCents } from '@/modules/caja-general/utils/cash-amounts';
import type { CashCounts } from '@/modules/caja-general/types/caja-general.types';
import { ActionDrawer } from '@/shared/components/ui/ActionDrawer';
import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';
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
    denominaciones?: CashCounts,
  ) => void | Promise<void>;
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
  const submitting = useRef(false);
  const summaryRef = useRef<HTMLElement>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const busy = isSubmitting || localBusy;
  const [submitError, setSubmitError] = useState('');
  useEffect(() => { if (submitError) summaryRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); }, [submitError]);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [selectValue, setSelectValue] = useState('');
  const [otraNombre, setOtraNombre] = useState('');
  const [denominaciones, setDenominaciones] = useState(emptyCounts);

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
    setSubmitError('');
    setSelectValue('');
    setOtraNombre('');
    setDenominaciones(emptyCounts());
  }, [target?.id]);

  const personaQueRecibio = modoOtra
    ? otraNombre.trim().replace(/\s+/g, ' ')
    : selectValue;
  const receptorValido = modoOtra
    ? personaQueRecibio.length > 0
    : selectValue !== '' && autorizados.includes(selectValue);
  const fotoValida = !!comprobante && comprobante.type.startsWith('image/');
  const requiresCashBreakdown =
    target?.tipoPago === 'EFECTIVO' || target?.tipoPago === 'RETIRO_SIN_TARJETA';
  const countedCents = countCents(denominaciones);
  const differenceCents = countedCents - Math.round((target?.monto ?? 0) * 100);
  const desgloseValido = !requiresCashBreakdown || differenceCents === 0;
  const canConfirm = receptorValido && fotoValida && desgloseValido && !busy;

  const handleConfirm = async () => {
    if (!target || !comprobante || !canConfirm || submitting.current) return;
    submitting.current = true; setLocalBusy(true); setSubmitError('');
    try {
    await onConfirm(
      target.id,
      target.operationId,
      comprobante,
      personaQueRecibio,
      requiresCashBreakdown ? denominaciones : undefined,
    );
    } catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { submitting.current = false; setLocalBusy(false); }
  };

  return (
    <ActionDrawer
      open={!!target}
      busy={busy}
      title="Marcar efectivo como entregado"
      subtitle={target ? `Operación #${target.operationId}${target.clienteNombre ? ` · ${target.clienteNombre}` : ''}${target.scheduledAt ? ` · ${formatDateTime(target.scheduledAt)}` : ''}` : undefined}
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={<div className="flex gap-3">
        <Button type="button" variant="neutral" disabled={busy} onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={!canConfirm} onClick={handleConfirm} className="h-auto min-h-11 flex-1">
          {busy ? 'Subiendo evidencia...' : 'Sí, marcar como entregado'}
        </Button>
      </div>}
    >
      {target ? (
        <>
          {requiresCashBreakdown ? (
            <section aria-label="Desglose y resumen de entrega" className="min-w-0">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Desglose por denominación</h3>
              <div className="sm:[&>div]:grid-cols-2">
                <CompactDenominationTables dense value={denominaciones} onChange={setDenominaciones} disabled={busy} />
              </div>
              <section ref={summaryRef} aria-label="Resumen de entrega" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div aria-label="Total de denominaciones" className="grid grid-cols-2 gap-3 font-bold text-slate-950">
                  <div><span className="block text-xs text-slate-500">A entregar</span><strong className="text-lg tabular-nums">{formatCurrency(target.monto)}</strong></div>
                  <div className="text-right"><span className="block text-xs text-slate-500">Total contado</span><strong className="text-lg tabular-nums">{Number.isFinite(countedCents) ? formatCurrency(countedCents / 100) : '—'}</strong></div>
                </div>
                <p role="status" className={`mt-2 border-t border-slate-200 pt-2 text-sm font-semibold ${differenceCents === 0 ? 'text-emerald-700' : differenceCents > 0 ? 'text-red-700' : 'text-amber-800'}`}>
                  {!Number.isFinite(differenceCents) ? 'Revisa las cantidades capturadas' : differenceCents === 0 ? 'Conteo completo' : differenceCents > 0 ? `Sobran ${formatCurrency(differenceCents / 100)} en el conteo` : `Faltan ${formatCurrency(-differenceCents / 100)} por contar`}
                </p>
                {submitError && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
              </section>
            </section>
          ) : null}

          <div className="mt-4 border-t border-slate-200 pt-4">
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
                disabled={busy}
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
                  disabled={busy}
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

          <div className="mt-4 border-t border-slate-200 pt-4">
            <ReceiptUploadField label="Foto de entrega del efectivo *" file={comprobante}
              onChange={setComprobante} accept="image/*" disabled={busy}
              dropHint="Tomar o seleccionar foto" />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {target.confirmadoPorSocio ? 'Recepción confirmada por el socio.' : 'Pendiente de confirmación del socio.'}
          </p>
        </>
      ) : null}
    </ActionDrawer>
  );
}
