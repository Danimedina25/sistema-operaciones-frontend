import { ReactNode, useEffect, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { useFormSubmission } from '@/shared/hooks/use-form-submission';
import { Button } from '@/shared/components/ui/Button';

const CONFIRMATION_WORD = 'ELIMINAR';

interface DeleteConfirmationModalProps {
  open: boolean;
  title: string;
  description?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  /** Encabezado del modal. Por defecto, "Eliminar definitivamente". */
  heading?: string;
  /** Reemplaza la advertencia genérica cuando no aplica a la entidad. */
  warning?: ReactNode;
  /** Datos identificativos del registro, encima de la caja de confirmación. */
  details?: ReactNode;
}

export function DeleteConfirmationModal({
  open,
  title,
  description,
  isSubmitting,
  onClose,
  onConfirm,
  heading = 'Eliminar definitivamente',
  warning,
  details,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const { submit, busy, submitError } = useFormSubmission(onConfirm, isSubmitting);
  const canConfirm = confirmText === CONFIRMATION_WORD && !busy;

  return (
    <Modal open={open} title={heading} size="compact" busy={busy} onClose={onClose} footer={<div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="neutral" disabled={busy} onClick={onClose}>Cancelar</Button>
        <Button variant="destructive" type="button" isLoading={busy} disabled={!canConfirm}
          onClick={() => { if (canConfirm) void submit(undefined); }}>Eliminar definitivamente</Button>
      </div>}>
      <div className="space-y-4">
        {submitError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {warning ?? (
            <>
              <p className="font-semibold">¿Eliminar definitivamente este registro?</p>
              <p className="mt-1">
                Esta acción borrará el registro de manera permanente y no se podrá deshacer.
                Solo será posible eliminarlo si no tiene operaciones, movimientos ni
                información relacionada.
              </p>
            </>
          )}
        </div>

        <p className="text-sm text-slate-700">{title}</p>

        {description ? (
          <p className="text-sm text-slate-500">{description}</p>
        ) : null}

        {details ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {details}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Escribe <span className="font-semibold text-red-700">{CONFIRMATION_WORD}</span> para confirmar
          </label>
          <input
            type="text"
            aria-label="Escribe ELIMINAR para confirmar"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={busy}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-500 disabled:opacity-60"
            autoComplete="off"
          />
        </div>


      </div>
    </Modal>
  );
}
