import { Modal } from '@/shared/components/ui/Modal';
import { formatCurrency, formatDateTime } from '@/modules/operations/utils/operation-formatters';
import type { ReturnPaymentResponse } from '@/modules/operations/types/operations.types.ts';

interface MarkCashReturnDeliveredModalProps {
  returnPayment: ReturnPaymentResponse | null;
  isSubmitting: boolean;
  onConfirm: (returnPaymentId: number) => void;
  onClose: () => void;
}

/**
 * Confirmación reforzada antes de marcar un retorno en efectivo/retiro sin
 * tarjeta como entregado: muestra el resumen completo (monto, operación,
 * receptor autorizado, fecha programada) y previene doble envío
 * deshabilitando los botones mientras `isSubmitting` es true. Reutilizada
 * desde el detalle de operación y desde "Entregas de hoy".
 */
export function MarkCashReturnDeliveredModal({
  returnPayment,
  isSubmitting,
  onConfirm,
  onClose,
}: MarkCashReturnDeliveredModalProps) {
  const authorizedRecipients = returnPayment
    ? [
        returnPayment.autorizadoParaRecibirEfectivo1,
        returnPayment.autorizadoParaRecibirEfectivo2,
        returnPayment.autorizadoParaRecibirEfectivo3,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <Modal
      open={!!returnPayment}
      title="Marcar efectivo como entregado"
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      {returnPayment ? (
        <>
          <p className="text-sm text-slate-600">
            ¿Confirmas que ya entregaste este retorno en efectivo? El socio comercial podrá
            confirmar la recepción después de esto.
          </p>

          <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Monto:</span> {formatCurrency(returnPayment.monto)}
            </p>
            <p>
              <span className="font-medium">Operación:</span> #{returnPayment.operationId}
              {returnPayment.clienteNombre ? ` · ${returnPayment.clienteNombre}` : ''}
            </p>
            <p>
              <span className="font-medium">Receptor autorizado:</span>{' '}
              {authorizedRecipients || 'No especificado'}
            </p>
            <p>
              <span className="font-medium">Fecha programada:</span>{' '}
              {returnPayment.fechaHoraRecoleccionEfectivo
                ? formatDateTime(returnPayment.fechaHoraRecoleccionEfectivo)
                : '-'}
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              disabled={isSubmitting}
              onClick={() => onConfirm(returnPayment.id)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando...' : 'Sí, marcar como entregado'}
            </button>
          </div>
        </>
      ) : null}
    </Modal>
  );
}
