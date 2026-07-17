import { useEffect, useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';

const CONFIRMATION_WORD = 'ELIMINAR';

interface DeleteConfirmationModalProps {
  open: boolean;
  title: string;
  description?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function DeleteConfirmationModal({
  open,
  title,
  description,
  isSubmitting,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const canConfirm = confirmText === CONFIRMATION_WORD && !isSubmitting;

  return (
    <Modal open={open} title="Eliminar definitivamente" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">¿Eliminar definitivamente este registro?</p>
          <p className="mt-1">
            Esta acción borrará el registro de manera permanente y no se podrá deshacer.
            Solo será posible eliminarlo si no tiene operaciones, movimientos ni
            información relacionada.
          </p>
        </div>

        <p className="text-sm text-slate-700">{title}</p>

        {description ? (
          <p className="text-sm text-slate-500">{description}</p>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Escribe <span className="font-semibold text-red-700">{CONFIRMATION_WORD}</span> para confirmar
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-red-500 disabled:opacity-60"
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <Button
            type="button"
            isLoading={isSubmitting}
            disabled={!canConfirm}
            onClick={() => void onConfirm()}
            className="bg-red-700 hover:bg-red-800"
          >
            Eliminar definitivamente
          </Button>
        </div>
      </div>
    </Modal>
  );
}
