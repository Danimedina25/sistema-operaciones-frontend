import { useState, type FormEvent } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/utils/errors';

/** Rechazar o cancelar un retiro siempre deja constancia del motivo. */
export function ReasonModal({ open, title, description, confirmLabel, onClose, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<unknown>;
}) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setMotivo(''); setError('');
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!motivo.trim()) { setError('Indica el motivo.'); return; }
    setBusy(true);
    setError('');
    try {
      await onConfirm(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={title} onClose={close}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-slate-600">{description}</p>
        <label className="block text-sm font-medium text-slate-700">Motivo
          <textarea
            aria-label="Motivo"
            value={motivo}
            maxLength={500}
            rows={3}
            onChange={event => setMotivo(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={close} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Volver</button>
          <Button type="submit" isLoading={busy} className="bg-red-600 hover:bg-red-700">{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}
